// Identifies a password-recovery session from the access token issued by the
// auth server after it validated a recovery link (amr method "recovery").
// An ordinary signed-in session (password, Google, magic link) never qualifies.
export const RECOVERY_WINDOW_SECONDS = 60 * 60;

type AmrEntry = { method?: string; timestamp?: number };

function decodeClaims(accessToken: string): Record<string, unknown> | null {
  try {
    const part = accessToken.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

export function isRecoverySession(accessToken: string | null | undefined, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  if (!accessToken) return false;
  const claims = decodeClaims(accessToken);
  const rawAmr = claims?.["amr"];
  const amr = Array.isArray(rawAmr) ? (rawAmr as AmrEntry[]) : [];
  return amr.some((entry) =>
    entry?.method === "recovery" &&
    typeof entry.timestamp === "number" &&
    nowSeconds - entry.timestamp >= -60 &&
    nowSeconds - entry.timestamp <= RECOVERY_WINDOW_SECONDS,
  );
}

/** Error reported by the auth server in the link's return URL (hash or query). */
export function recoveryLinkError(hash: string, search: string): string | null {
  const read = (s: string) => new URLSearchParams(s.replace(/^[#?]/, ""));
  const h = read(hash);
  const q = read(search);
  return h.get("error_code") ?? q.get("error_code") ?? h.get("error") ?? q.get("error");
}
