import { after, NextRequest, NextResponse } from "next/server";
import { isLikelyBot, isPrefetch } from "@/lib/bots";
import { getSupabaseAdmin } from "@/lib/supabase";

function normalizeCountryCode(value: string | null) {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

async function getLink(slug: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("links")
    .select("id, destination_url, is_active")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function handleTrackingGet(request: NextRequest, slug: string) {
  const link = await getLink(slug);

  if (!link) {
    return new NextResponse("Link not found", { status: 404 });
  }

  if (!link.is_active) {
    return new NextResponse("Link is temporarily disabled", { status: 410 });
  }

  const response = NextResponse.redirect(link.destination_url, 307);
  const userAgent = request.headers.get("user-agent");
  const shouldCount =
    request.nextUrl.searchParams.get("test") !== "1" &&
    !isLikelyBot(userAgent) &&
    !isPrefetch(request.headers);

  let visitorId = request.cookies.get("tt_visitor")?.value;
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    response.cookies.set("tt_visitor", visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  if (shouldCount) {
    const countryCode = normalizeCountryCode(
      request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry")
    );

    const click = {
      link_id: link.id,
      visitor_id: visitorId,
      country_code: countryCode,
      user_agent: userAgent,
    };

    after(async () => {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("clicks").insert(click);
      if (error) console.error("Failed to save click", error);
    });
  }

  return response;
}

export async function handleTrackingHead(slug: string) {
  const link = await getLink(slug);

  if (!link) return new NextResponse(null, { status: 404 });
  if (!link.is_active) return new NextResponse(null, { status: 410 });

  return NextResponse.redirect(link.destination_url, 307);
}
