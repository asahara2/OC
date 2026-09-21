import type { NextRequest } from "next/server";

import { adminAuthenticationResponse, hasValidAdminAuthorization } from "@/lib/admin-auth-core";
import { parseStaffSessionCookie, staffCookieName } from "@/lib/staff-auth";

export async function middleware(request: NextRequest) {
  if (await hasValidAdminAuthorization(request.headers.get("authorization"))) {
    return;
  }

  const staff = parseStaffSessionCookie(request.cookies.get(staffCookieName)?.value);
  const staffPaths = ["/admin/news", "/admin/constitution", "/admin/polls", "/admin/messages", "/admin/settings"];
  if (staff && staffPaths.some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`))) return;

  return adminAuthenticationResponse();
}

export const config = {
  matcher: ["/admin/:path*", "/admin.html"],
  runtime: "nodejs",
};
