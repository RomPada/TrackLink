import { after, NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isLikelyBot, isPrefetch } from "@/lib/bots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

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

export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const link = await getLink(slug);

  if (!link) {
    return new NextResponse("Посилання не знайдено", { status: 404 });
  }

  if (!link.is_active) {
    return new NextResponse("Посилання тимчасово вимкнене", { status: 410 });
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
    const click = {
      link_id: link.id,
      visitor_id: visitorId,
      referrer: request.headers.get("referer") || null,
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

export async function HEAD(_request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const link = await getLink(slug);

  if (!link) return new NextResponse(null, { status: 404 });
  if (!link.is_active) return new NextResponse(null, { status: 410 });

  return NextResponse.redirect(link.destination_url, 307);
}
