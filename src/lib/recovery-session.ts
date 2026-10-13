// Password recovery is recognised by two facts together:
// 1. this tab received the auth client's official PASSWORD_RECOVERY event
//    (emitted only after the server accepted a recovery link) — stored as a
//    per-tab marker tied to the user it was issued for;
// 2. the session was issued by an e-mail one-time token (amr method "otp",
//    what the auth server really records for recovery links) less than 1 hour ago.
// Password/Google sessions, or a magic link without the recovery event, never qualify.
export const RECOVERY_WINDOW_SECONDS = 60 * 60;
export const RECOVERY_MARKER_KEY = "auth:recovery";

export type RecoveryMarker = { userId: string; at: number };
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

const fresh = (ts: number, now: number) => now - ts >= -60 && now - ts <= RECOVERY_WINDOW_SECONDS;

export function hasFreshOtpSession(accessToken: string | null | undefined, now: number): boolean {
  if (!accessToken) return false;
  const rawAmr = decodeClaims(accessToken)?.["amr"];
  const amr = Array.isArray(rawAmr) ? (rawAmr as AmrEntry[]) : [];
  return amr.some((e) => e?.method === "otp" && typeof e.timestamp === "number" && fresh(e.timestamp, now));
}

export function parseMarker(raw: string | null): RecoveryMarker | null {
  try {
    const v = raw ? JSON.parse(raw) : null;
    return v && typeof v.userId === "string" && typeof v.at === "number" ? v : null;
  } catch {
    return null;
  }
}

export function isRecoverySession(
  session: { access_token?: string; user?: { id?: string } } | null | undefined,
  marker: RecoveryMarker | null,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!session?.access_token || !session.user?.id || !marker) return false;
  if (marker.userId !== session.user.id || !fresh(marker.at, nowSeconds)) return false;
  return hasFreshOtpSession(session.access_token, nowSeconds);
}

/** Error reported by the auth server in the link's return URL (hash or query). */
export function recoveryLinkError(hash: string, search: string): string | null {
  const read = (s: string) => new URLSearchParams(s.replace(/^[#?]/, ""));
  const h = read(hash);
  const q = read(search);
  return h.get("error_code") ?? q.get("error_code") ?? h.get("error") ?? q.get("error");
}
