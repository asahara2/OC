import type { NextRequest } from "next/server";

import { adminAuthenticationResponse, hasValidAdminAuthorization } from "@/lib/admin-auth-core";

export async function middleware(request: NextRequest) {
  if (await hasValidAdminAuthorization(request.headers.get("authorization"))) {
    return;
  }

  return adminAuthenticationResponse();
}

export const config = {
  matcher: ["/admin/:path*"],
};
