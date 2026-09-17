import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/**
 * This module runs only on the server. A dynamic lookup deliberately prevents
 * Next from replacing a public variable with `undefined` during a build that
 * was started before Vercel had applied its environment-variable update.
 * Vercel Functions then read the deployment's runtime environment instead.
 */
function runtimeEnv(name: string) {
  return process.env[name];
}

function publicConfig() {
  const url = runtimeEnv("NEXT_PUBLIC_SUPABASE_URL") ?? runtimeEnv("SUPABASE_URL");
  const anonKey = runtimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    ?? runtimeEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    ?? runtimeEnv("SUPABASE_PUBLISHABLE_KEY");

  if (!url || !anonKey) {
    // Never include values in an error. Identifying names is safe and makes a
    // deployment misconfiguration diagnosable from Vercel Function logs.
    const missing = [
      !url && "NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)",
      !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)",
    ].filter(Boolean).join(", ");
    throw new Error(`Supabase public environment variables are not configured: ${missing}.`);
  }

  return { url, anonKey };
}

/** A server-side client constrained by the public RLS policies. */
export function createPublicClient() {
  const { url, anonKey } = publicConfig();
  return createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Server-only client for administrative mutations. Never import this into a
 * Client Component and never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createAdminClient() {
  const { url } = publicConfig();
  const serviceRoleKey = runtimeEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
