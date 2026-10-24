import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { configuredForPush } from "@/lib/web-push";
import { pushToAll, readPushPreferences } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function kyivDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Kyiv", day: "2-digit", month: "2-digit", year: "numeric",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!configuredForPush()) return NextResponse.json({ error: "Web Push is not configured" }, { status: 503 });
  try {
    const prefs = await readPushPreferences();
    if (!prefs.daily_summary) return NextResponse.json({ skipped: "Daily summary disabled" });

    const todayInKyiv = kyivDateKey(new Date());
    const previous = new Date(`${todayInKyiv}T12:00:00Z`);
    previous.setUTCDate(previous.getUTCDate() - 1);
    const day = previous.toISOString().slice(0, 10);
    const supabase = getSupabaseAdmin();
    // Claim the calendar day before sending so repeated cron invocations don't send twice.
    const { error: claimedError } = await supabase.from("push_daily_dispatches").insert({ local_day: day });
    if (claimedError) {
      if (claimedError.code === "23505") return NextResponse.json({ skipped: "Already sent" });
      throw claimedError;
    }
    try {
      const { data, error } = await supabase.rpc("tracklink_push_daily_stats", { p_day: day });
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      const clicks = Number(result?.clicks ?? 0);
      const visitors = Number(result?.visitors ?? 0);
      const sent = await pushToAll({
        title: `TrackLink · Daily summary · ${day}`,
        body: `${clicks.toLocaleString("en-US")} clicks · ${visitors.toLocaleString("en-US")} unique visitors yesterday`,
        tag: `daily-${day}`,
      });
      if (sent.delivered === 0 && sent.failed > 0) {
        throw new Error("All push deliveries failed.");
      }
      return NextResponse.json({ date: day, ...sent });
    } catch (error) {
      await supabase.from("push_daily_dispatches").delete().eq("local_day", day);
      throw error;
    }
  } catch (error) {
    console.error("Daily summary failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Daily summary failed" }, { status: 500 });
  }
}
