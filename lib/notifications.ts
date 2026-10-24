import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { configuredForPush, deliverPush, type PushSubscriptionData } from "@/lib/web-push";

export type PushPreferences = {
  every_click: boolean;
  new_visitor: boolean;
  milestones: boolean;
  daily_summary: boolean;
};

export const DEFAULT_PUSH_PREFERENCES: PushPreferences = {
  every_click: false,
  new_visitor: true,
  milestones: true,
  daily_summary: false,
};

export async function readPushPreferences(): Promise<PushPreferences> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("push_preferences")
    .select("every_click,new_visitor,milestones,daily_summary").eq("id", 1).single();
  if (error) throw error;
  return data as PushPreferences;
}

export async function pushToAll(message: { title: string; body: string; tag?: string }) {
  if (!configuredForPush()) return { delivered: 0, failed: 0 };
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("push_subscriptions")
    .select("endpoint,p256dh,auth_secret").limit(20);
  if (error) throw error;
  let delivered = 0;
  let failed = 0;
  await Promise.all((data ?? []).map(async (row) => {
    const subscription: PushSubscriptionData = {
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth_secret },
    };
    try {
      const status = await deliverPush(subscription, message);
      if (status >= 200 && status < 300) {
        delivered++;
      } else if (status === 404 || status === 410) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", row.endpoint);
      } else {
        failed++;
        console.error("Push gateway returned status", status);
      }
    } catch (error) {
      failed++;
      console.error("Web Push delivery failed", error instanceof Error ? error.message : "Unknown error");
    }
  }));
  return { delivered, failed };
}

export async function notifyRecordedClick(args: {
  linkId: string;
  visitorId: string;
  countryCode: string | null;
}) {
  if (!configuredForPush()) return;
  const supabase = getSupabaseAdmin();
  const preferences = await readPushPreferences();
  if (!preferences.every_click && !preferences.new_visitor && !preferences.milestones) return;

  const { count: visitorCount, error: visitorError } = await supabase
    .from("clicks").select("id", { count: "exact", head: true }).eq("visitor_id", args.visitorId);
  if (visitorError) throw visitorError;
  const isNew = visitorCount === 1;
  if (!preferences.every_click && !preferences.milestones && !(preferences.new_visitor && isNew)) return;

  const { count: linkCount, error: linkError } = await supabase
    .from("clicks").select("id", { count: "exact", head: true }).eq("link_id", args.linkId);
  if (linkError) throw linkError;
  const total = linkCount ?? 0;
  const milestoneReached = preferences.milestones && (total === 100 || total === 500 || (total > 0 && total % 1000 === 0));
  if (!preferences.every_click && !(preferences.new_visitor && isNew) && !milestoneReached) return;

  const { data: link } = await supabase.from("link_stats")
    .select("name,group_name,today_clicks").eq("id", args.linkId).maybeSingle();
  if (!link) return;
  const groupName = link.group_name ?? "No group";
  let country = "unknown country";
  if (args.countryCode) {
    try { country = new Intl.DisplayNames(["en"], { type: "region" }).of(args.countryCode) ?? args.countryCode; }
    catch { country = args.countryCode; }
  }
  let title = "TrackLink · New link click";
  if (milestoneReached) title = `TrackLink · ${total.toLocaleString("en-US")} clicks!`;
  else if (isNew && preferences.new_visitor) title = "TrackLink · New unique visitor";
  const description = `${country} · ${link.name} → ${groupName} · ${Number(link.today_clicks ?? 0).toLocaleString("en-US")} clicks today`;
  await pushToAll({ title, body: description, tag: milestoneReached ? `milestone-${args.linkId}-${total}` : undefined });
}
