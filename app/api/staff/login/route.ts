import { NextResponse } from "next/server";
import { z } from "zod";

import { createStaffSession, staffCookieName, verifyStaffPassword } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/server";

const schema = z.object({ username: z.string().trim().regex(/^[a-z0-9][a-z0-9_-]{2,63}$/), password: z.string().min(12).max(256) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "IDまたはパスワードの形式が正しくありません。" }, { status: 400 });
  const { data, error } = await createAdminClient().from("staff_accounts").select("id, role_slug, password_hash, is_active").eq("username", parsed.data.username).maybeSingle();
  if (error || !data || !data.is_active || !verifyStaffPassword(parsed.data.password, data.password_hash)) return NextResponse.json({ error: "IDまたはパスワードが正しくありません。" }, { status: 401 });
  const response = NextResponse.json({ ok: true, role: data.role_slug });
  response.cookies.set(staffCookieName, createStaffSession(data.id, data.role_slug), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 12, path: "/" });
  return response;
}
