import { NextRequest } from "next/server";
import { handleTrackingGet, handleTrackingHead } from "@/lib/tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = await params;
  return handleTrackingGet(request, slug);
}

export async function HEAD(_request: NextRequest, { params }: Params) {
  const { slug } = await params;
  return handleTrackingHead(slug);
}
