import { headers } from "next/headers";

import { hasValidAdminAuthorization } from "@/lib/admin-auth-core";

/** Defense in depth for Server Actions in addition to middleware. */
export async function requireAdmin() {
  const requestHeaders = await headers();
  if (!(await hasValidAdminAuthorization(requestHeaders.get("authorization")))) {
    throw new Error("Unauthorized administrative action.");
  }
}
