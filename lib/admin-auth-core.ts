function configuredCredentials() {
  // Bracket access intentionally keeps this runtime-configurable on Vercel.
  // Direct process.env.NAME access may otherwise be replaced during the build.
  const username = process.env["ADMIN_USERNAME"];
  const password = process.env["ADMIN_PASSWORD"];
  return username && password ? `${username}:${password}` : null;
}

async function digest(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

function equalBytes(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index];
  return mismatch === 0;
}

export async function hasValidAdminAuthorization(authorization: string | null) {
  const expected = configuredCredentials();
  if (!expected || !authorization?.startsWith("Basic ")) return false;

  try {
    const received = atob(authorization.slice(6));
    return equalBytes(await digest(received), await digest(expected));
  } catch {
    return false;
  }
}

export function adminIsConfigured() {
  return configuredCredentials() !== null;
}

export function adminAuthenticationResponse() {
  if (!adminIsConfigured()) {
    return new Response("Admin authentication is not configured.", { status: 503 });
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Administration", charset="UTF-8"' },
  });
}
