import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";

import { hasValidAdminAuthorization } from "@/lib/admin-auth-core";

export const staffCookieName = "oc_staff_session";
export const staffPermissions = ["news_write", "constitution_write", "poll_manage", "message_publish", "troll_publish", "leader_manage", "media_manage"] as const;
export type StaffPermission = (typeof staffPermissions)[number];
export type StaffSession = { id: string; role: string; expiresAt: number };

function sessionSecret() {
  const secret = process.env.STAFF_SESSION_SECRET;
  if (!secret || secret.length < 24) throw new Error("STAFF_SESSION_SECRET は24文字以上で設定してください。");
  return secret;
}
function signature(value: string) { return createHmac("sha256", sessionSecret()).update(value).digest("base64url"); }

type EnvStaffAccount = { id: string; role: "kyoso" | "mod"; password: string; permissions: StaffPermission[] };
export function environmentStaffAccounts(): EnvStaffAccount[] {
  const specs = [
    ["KYOSO", "kyoso", staffPermissions], ["MOD_01", "mod", ["news_write", "constitution_write", "poll_manage"]],
    ["MOD_02", "mod", ["news_write", "constitution_write", "poll_manage"]], ["MOD_03", "mod", ["news_write", "constitution_write", "poll_manage"]],
  ] as const;
  return specs.flatMap(([prefix, role, basePermissions]) => {
    const id = process.env[`${prefix}_USERNAME`]; const password = process.env[`${prefix}_PASSWORD`];
    if (!id || !password) return [];
    const extra = (process.env[`${prefix}_PERMISSIONS`] ?? "").split(",").map((item) => item.trim()).filter((item): item is StaffPermission => staffPermissions.includes(item as StaffPermission));
    return [{ id, role, password, permissions: [...new Set([...basePermissions, ...extra])] }];
  });
}
export function verifyEnvironmentStaffPassword(username: string, password: string) {
  const account = environmentStaffAccounts().find((item) => item.id === username);
  if (!account || account.password.length !== password.length || !timingSafeEqual(Buffer.from(account.password), Buffer.from(password))) return null;
  return account;
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
export function permissionsForStaffSession(session: StaffSession | null): StaffPermission[] {
  if (!session) return [];
  if (session.role === "admin" || session.role === "kyoso") return [...staffPermissions];
  return environmentStaffAccounts().find((item) => item.id === session.id && item.role === session.role)?.permissions ?? [];
}
export async function requireStaffPermission(permission: StaffPermission) {
  const requestHeaders = await headers();
  if (await hasValidAdminAuthorization(requestHeaders.get("authorization"))) return { id: "admin", role: "admin" };
  const session = await getStaffSession();
  if (!session) throw new Error("スタッフとしてログインしてください。");
  if (!permissionsForStaffSession(session).includes(permission)) throw new Error("この操作を行う権限がありません。");
  return session;
}
export async function requireFounderOrAdmin() {
  const requestHeaders = await headers();
  if (await hasValidAdminAuthorization(requestHeaders.get("authorization"))) return { id: "admin", role: "admin" as const };
  const session = await getStaffSession();
  if (!session || session.role !== "kyoso") throw new Error("教祖またはADMINのみ実行できます。");
  return session;
}
