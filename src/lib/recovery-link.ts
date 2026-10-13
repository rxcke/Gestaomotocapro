// Builds the password-recovery e-mail link pointing at the app's own /auth/confirm page.
// The auth server's ready-made link is `<auth>/auth/v1/verify?token=<hash>&type=recovery&redirect_to=...`.
// Its `token` query param IS the token hash: on GET /verify the auth server does
// `p.TokenHash = p.Token` (supabase/auth internal/api/verify.go), so the same value is
// accepted by verifyOtp({ token_hash, type: "recovery" }). Validity and single use are unchanged.
export const ALLOWED_APP_ORIGINS = [
  "https://gestaomotocapro.com.br",
  "https://www.gestaomotocapro.com.br",
  "https://gestaomotocapro.lovable.app",
  "https://id-preview--c2109f63-5c6e-443d-b474-0b141d85fa6f.lovable.app",
] as const;
export const DEFAULT_APP_ORIGIN = ALLOWED_APP_ORIGINS[0];

/** Only exact, allow-listed https origins; anything else falls back to the main domain. */
export function safeAppOrigin(redirectTo: string | null | undefined): string {
  if (!redirectTo) return DEFAULT_APP_ORIGIN;
  try {
    const origin = new URL(redirectTo).origin;
    return (ALLOWED_APP_ORIGINS as readonly string[]).includes(origin) ? origin : DEFAULT_APP_ORIGIN;
  } catch {
    return DEFAULT_APP_ORIGIN;
  }
}

/**
 * Returns the /auth/confirm link, or null when the server link is not a plain
 * recovery link this method supports (caller then keeps the original link).
 */
export function buildRecoveryConfirmUrl(serverUrl: string, tokenHash?: string | null): string | null {
  let url: URL;
  try {
    url = new URL(serverUrl);
  } catch {
    return null;
  }
  if (!url.pathname.endsWith("/auth/v1/verify")) return null;
  if (url.searchParams.get("type") !== "recovery") return null;
  const hash = tokenHash || url.searchParams.get("token");
  // pkce_ tokens need the code verifier flow; never rewrite them.
  if (!hash || hash.startsWith("pkce_") || !/^[A-Za-z0-9_-]{16,}$/.test(hash)) return null;
  const target = new URL("/auth/confirm", safeAppOrigin(url.searchParams.get("redirect_to")));
  target.searchParams.set("token_hash", hash);
  target.searchParams.set("type", "recovery");
  return target.toString();
}
