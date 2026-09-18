import { NextResponse } from "next/server";
import { z } from "zod";

import { createStaffSession, staffCookieName, verifyEnvironmentStaffPassword } from "@/lib/staff-auth";

const schema = z.object({ username: z.string().trim().regex(/^[a-z0-9][a-z0-9_-]{2,63}$/), password: z.string().min(12).max(256) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "IDまたはパスワードの形式が正しくありません。" }, { status: 400 });
  const account = verifyEnvironmentStaffPassword(parsed.data.username, parsed.data.password);
  if (!account) return NextResponse.json({ error: "IDまたはパスワードが正しくありません。" }, { status: 401 });
  const response = NextResponse.json({ ok: true, role: account.role });
  response.cookies.set(staffCookieName, createStaffSession(account.id, account.role), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 12, path: "/" });
  return response;
}
