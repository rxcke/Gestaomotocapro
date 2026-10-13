// Must be started explicitly from the root route at module load (startRecoveryWatch()).
// A side-effect-only import is dropped by the bundler ("sideEffects": false), which
// previously moved this listener into the lazy "Nova senha" chunk and lost the event.
import { supabase } from "@/integrations/supabase/client";
import { RECOVERY_MARKER_KEY, parseMarker, type RecoveryMarker } from "./recovery-session";

const URL_SIGNAL_KEY = "auth:recovery-url";
let started = false;

export function readRecoveryMarker(): RecoveryMarker | null {
  if (typeof window === "undefined") return null;
  return parseMarker(window.sessionStorage.getItem(RECOVERY_MARKER_KEY));
}

export function clearRecoveryMarker() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(RECOVERY_MARKER_KEY);
  window.sessionStorage.removeItem(URL_SIGNAL_KEY);
}

const nowSeconds = () => Math.floor(Date.now() / 1000);
const saveMarker = (userId: string, at: number) =>
  window.sessionStorage.setItem(RECOVERY_MARKER_KEY, JSON.stringify({ userId, at } satisfies RecoveryMarker));

/** Called by /auth/confirm after verifyOtp(recovery) succeeded. Never sufficient alone:
 * /reset-password still requires a fresh OTP session of the same user. */
export function markRecoveryVerified(userId: string) {
  if (typeof window === "undefined") return;
  saveMarker(userId, nowSeconds());
}

/** True when the URL is the auth server's recovery redirect (implicit flow). Never proof on its own. */
export function urlHasRecoverySignal(hash: string): boolean {
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  return p.get("type") === "recovery" && p.has("access_token");
}

export function startRecoveryWatch(): boolean {
  if (started || typeof window === "undefined") return started;
  started = true;
  // Read before the auth client is touched (it clears the hash while initialising).
  if (urlHasRecoverySignal(window.location.hash)) {
    window.sessionStorage.setItem(URL_SIGNAL_KEY, String(nowSeconds()));
  }
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") return clearRecoveryMarker();
    const userId = session?.user?.id;
    if (!userId) return;
    if (event === "PASSWORD_RECOVERY") {
      saveMarker(userId, nowSeconds());
      return;
    }
    // Fallback: bind the URL signal to the session the client created from that same redirect.
    const signalAt = Number(window.sessionStorage.getItem(URL_SIGNAL_KEY));
    if (signalAt && !readRecoveryMarker()) {
      window.sessionStorage.removeItem(URL_SIGNAL_KEY);
      saveMarker(userId, signalAt);
    }
  });
  return started;
}

export const isRecoveryWatchStarted = () => started;
