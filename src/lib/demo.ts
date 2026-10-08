export type AccessMode = "demo_active" | "demo_expired" | "subscriber" | "admin" | "ambassador" | "blocked";
export const DEMO_HOURS = 24;

export function demoExpiry(startedAt: Date) {
  return new Date(startedAt.getTime() + DEMO_HOURS * 3_600_000);
}

export function accessMode(flags: { active: boolean; admin: boolean; ambassador: boolean; demoActive: boolean; demoExpired: boolean }): AccessMode {
  if (flags.admin) return "admin";
  if (flags.ambassador) return "ambassador";
  if (flags.active) return "subscriber";
  if (flags.demoActive) return "demo_active";
  return flags.demoExpired ? "demo_expired" : "blocked";
}

/** Visual countdown only; the backend decides access. */
export function demoRemainingLabel(expiresAt: string | null, now: number) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return { expired: true, soon: false, text: "DEMONSTRAÇÃO ENCERRADA" };
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const span = `${h}h ${String(m).padStart(2, "0")}min`;
  return h < 2 ? { expired: false, soon: true, text: `Sua demonstração termina em ${span}.` } : { expired: false, soon: false, text: `Você tem ${span} restantes` };
}
