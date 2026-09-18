import { NextResponse } from "next/server";
import { listPublicMessages } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function GET() { return NextResponse.json({ data: await listPublicMessages() }); }
