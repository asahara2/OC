import type { NextRequest } from "next/server";

import { adminAuthenticationResponse, hasValidAdminAuthorization } from "@/lib/admin-auth-core";
import { parseStaffSessionCookie, permissionsForStaffSession, staffCookieName, type StaffPermission } from "@/lib/staff-auth";

const staffPathPermissions: Record<string, StaffPermission> = {
  "/admin/news": "news_write",
  "/admin/constitution": "constitution_write",
  "/admin/polls": "poll_manage",
  "/admin/messages": "message_publish",
  "/admin/settings": "media_manage",
  "/admin/leaders": "leader_manage",
};

export async function middleware(request: NextRequest) {
  if (await hasValidAdminAuthorization(request.headers.get("authorization"))) {
    return;
  }

  const staff = parseStaffSessionCookie(request.cookies.get(staffCookieName)?.value);
  const requiredPermission = Object.entries(staffPathPermissions).find(([path]) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`))?.[1];
  if (staff && requiredPermission && permissionsForStaffSession(staff).includes(requiredPermission)) return;

  return adminAuthenticationResponse();
}

export const config = {
  matcher: ["/admin/:path*", "/admin.html"],
  runtime: "nodejs",
};
