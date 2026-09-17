import { NextResponse } from "next/server";

import { listPublishedNews } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function GET() {
  const news = await listPublishedNews();
  return NextResponse.json({ data: news });
}
