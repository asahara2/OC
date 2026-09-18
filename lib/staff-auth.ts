import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";

import { hasValidAdminAuthorization } from "@/lib/admin-auth-core";
import { createAdminClient } from "@/lib/supabase/server";

export const staffCookieName = "oc_staff_session";
export const staffPermissions = ["news_write", "constitution_write", "poll_manage", "message_publish", "troll_publish", "leader_manage", "media_manage"] as const;
export type StaffPermission = (typeof staffPermissions)[number];
type StaffSession = { id: string; role: string; expiresAt: number };

function sessionSecret() {
  const secret = process.env.STAFF_SESSION_SECRET;
  if (!secret || secret.length < 24) throw new Error("STAFF_SESSION_SECRET は24文字以上で設定してください。");
  return secret;
}
function signature(value: string) { return createHmac("sha256", sessionSecret()).update(value).digest("base64url"); }

export function hashStaffPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const digest = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${digest}`;
}
export function verifyStaffPassword(password: string, encoded: string) {
  const [algorithm, salt, expected] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !expected) return false;
  const actual = scryptSync(password, salt, 64).toString("base64url");
  return actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}
export function createStaffSession(id: string, role: string) {
  const payload = Buffer.from(JSON.stringify({ id, role, expiresAt: Date.now() + 1000 * 60 * 60 * 12 })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}
export function parseStaffSessionCookie(value?: string): StaffSession | null {
  if (!value) return null;
  const [payload, supplied] = value.split(".");
  if (!payload || !supplied) return null;
  try {
    const expected = signature(payload);
    if (expected.length !== supplied.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as StaffSession;
    return typeof session.id === "string" && typeof session.role === "string" && session.expiresAt > Date.now() ? session : null;
  } catch { return null; }
}
export async function getStaffSession() { return parseStaffSessionCookie((await cookies()).get(staffCookieName)?.value); }
export async function requireStaffPermission(permission: StaffPermission) {
  const requestHeaders = await headers();
  if (await hasValidAdminAuthorization(requestHeaders.get("authorization"))) return { id: "admin", role: "admin" };
  const session = await getStaffSession();
  if (!session) throw new Error("スタッフとしてログインしてください。");
  if (session.role === "admin" || session.role === "kyoso") return session;
  const { data, error } = await createAdminClient().from("staff_permissions").select("granted").eq("staff_id", session.id).eq("permission", permission).maybeSingle();
  if (error || !data?.granted) throw new Error("この操作を行う権限がありません。");
  return session;
}
