// Registered at app start (imported by the root route) so the auth client's
// PASSWORD_RECOVERY event is caught even when it fires before the
// "Nova senha" page has loaded. The marker lives only in this tab.
import { supabase } from "@/integrations/supabase/client";
import { RECOVERY_MARKER_KEY, parseMarker, type RecoveryMarker } from "./recovery-session";

export function readRecoveryMarker(): RecoveryMarker | null {
  if (typeof window === "undefined") return null;
  return parseMarker(window.sessionStorage.getItem(RECOVERY_MARKER_KEY));
}

export function clearRecoveryMarker() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(RECOVERY_MARKER_KEY);
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" && session?.user?.id) {
      const marker: RecoveryMarker = { userId: session.user.id, at: Math.floor(Date.now() / 1000) };
      window.sessionStorage.setItem(RECOVERY_MARKER_KEY, JSON.stringify(marker));
    } else if (event === "SIGNED_OUT") {
      clearRecoveryMarker();
    }
  });
}
