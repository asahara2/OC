import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createPublicClient } from "@/lib/supabase/server";

const payloadSchema = z.object({ optionId: z.string().uuid() });

export async function POST(request: Request, { params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;
  if (!z.string().uuid().safeParse(pollId).success) return NextResponse.json({ error: "投票IDが正しくありません。" }, { status: 400 });
  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "選択肢を選んでください。" }, { status: 400 });
  const jar = await cookies();
  const cookieName = `oc_poll_${pollId}`;
  const voterToken = jar.get(cookieName)?.value ?? randomUUID();
  const { error } = await createPublicClient().from("poll_votes").insert({ poll_id: pollId, option_id: parsed.data.optionId, voter_token: voterToken });
  if (error) {
    const message = error.code === "23505" ? "このブラウザからは、すでに投票済みです。" : "現在この投票は受け付けていません。";
    return NextResponse.json({ error: message }, { status: 409 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, voterToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return response;
}
