import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { DEFAULT_PUSH_PREFERENCES, readPushPreferences } from "@/lib/notifications";
import { configuredForPush, deliverPush, publicVapidKey, safeEndpoint } from "@/lib/web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}
function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return Boolean(host && parsed.host.toLowerCase() === host.toLowerCase() &&
      (parsed.protocol === "https:" || parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"));
  } catch { return false; }
}

export async function GET() {
  if (!(await isAdmin())) return response({ error: "Unauthorized" }, 401);
  try {
    const supabase = getSupabaseAdmin();
    const [preferences, countResult] = await Promise.all([
      readPushPreferences(),
      supabase.from("push_subscriptions").select("endpoint", { count: "exact", head: true }),
    ]);
    if (countResult.error) throw countResult.error;
    return response({ configured: configuredForPush(), publicKey: publicVapidKey(), preferences, devices: countResult.count ?? 0 });
  } catch (error) {
    console.error("Push configuration error", error);
    return response({ error: "Push tables are not available. Run the v0.7.0 Supabase migration." }, 503);
  }
}

type PushBody = {
  action?: string;
  subscription?: { endpoint?: string; keys?: { auth?: string; p256dh?: string } };
  endpoint?: string;
  preferences?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return response({ error: "Unauthorized" }, 401);
  if (!sameOrigin(request)) return response({ error: "Invalid request origin" }, 403);
  let body: PushBody;
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 10000) return response({ error: "Payload too large" }, 413);
    body = (await request.json()) as PushBody;
  } catch { return response({ error: "Invalid request" }, 400); }
  const supabase = getSupabaseAdmin();
  try {
    if (body.action === "subscribe") {
      if (!configuredForPush()) return response({ error: "VAPID keys are not configured" }, 503);
      const sub = body.subscription;
      const endpoint = sub?.endpoint ?? "";
      const auth = sub?.keys?.auth ?? "";
      const p256dh = sub?.keys?.p256dh ?? "";
      if (!safeEndpoint(endpoint) || !/^[\w-]{15,100}$/.test(auth) || !/^[\w-]{50,200}$/.test(p256dh)) {
        return response({ error: "Invalid push subscription" }, 400);
      }
      const { count, error: countError } = await supabase.from("push_subscriptions")
        .select("endpoint", { head: true, count: "exact" });
      if (countError) throw countError;
      if ((count ?? 0) >= 10) {
        const { data: existing } = await supabase.from("push_subscriptions").select("endpoint").eq("endpoint", endpoint).maybeSingle();
        if (!existing) return response({ error: "Device limit reached (10). Remove a device first." }, 409);
      }
      const { error } = await supabase.from("push_subscriptions").upsert({
        endpoint, auth_secret: auth, p256dh,
        user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: "endpoint" });
      if (error) throw error;
      return response({ ok: true });
    }
    if (body.action === "unsubscribe") {
      if (!body.endpoint || !safeEndpoint(body.endpoint)) return response({ error: "Invalid endpoint" }, 400);
      const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", body.endpoint);
      if (error) throw error;
      return response({ ok: true });
    }
    if (body.action === "clear-devices") {
      const { error } = await supabase.from("push_subscriptions")
        .delete().not("endpoint", "is", null);
      if (error) throw error;
      return response({ ok: true });
    }
    if (body.action === "preferences") {
      const submitted = body.preferences;
      if (!submitted || typeof submitted !== "object") return response({ error: "Invalid preferences" }, 400);
      const changes: Record<string, boolean> = {};
      for (const key of Object.keys(DEFAULT_PUSH_PREFERENCES)) {
        if (typeof submitted[key] !== "boolean") return response({ error: `Invalid ${key}` }, 400);
        changes[key] = submitted[key] as boolean;
      }
      const { error } = await supabase.from("push_preferences").upsert({
        id: 1, ...changes, updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      if (error) throw error;
      return response({ ok: true });
    }
    if (body.action === "test") {
      if (!configuredForPush()) return response({ error: "VAPID keys are not configured" }, 503);
      if (!body.endpoint || !safeEndpoint(body.endpoint)) return response({ error: "Invalid endpoint" }, 400);
      const { data: existing, error } = await supabase.from("push_subscriptions")
        .select("endpoint,p256dh,auth_secret").eq("endpoint", body.endpoint).maybeSingle();
      if (error) throw error;
      if (!existing) return response({ error: "Device is not subscribed" }, 404);
      const status = await deliverPush({ endpoint: existing.endpoint, keys: { p256dh: existing.p256dh, auth: existing.auth_secret } }, {
        title: "TrackLink · Test notification", body: "Push notifications are ready on this device.",
      });
      if (status === 404 || status === 410) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", existing.endpoint);
        return response({ error: "Subscription expired. Disable and enable notifications again." }, 410);
      }
      if (status < 200 || status >= 300) return response({ error: `Push service returned HTTP ${status}` }, 502);
      return response({ ok: true });
    }
    return response({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("Push request failed", error instanceof Error ? error.message : "Unknown error");
    return response({ error: "Push request failed. Check your Supabase migration and VAPID settings." }, 500);
  }
}
