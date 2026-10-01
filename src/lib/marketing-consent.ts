export const NOTICE_VERSION = "2026-10-01-v1";
export const CONSENT_KEY = "gmp:marketing-consent";
export const VISITOR_KEY = "gmp:visitor-id";

export type ConsentChoice = {
  visitorId: string;
  accepted: boolean;
  decidedAt: string;
  region: string;
  noticeVersion: string;
};

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? "null");
    if (!parsed || typeof parsed !== "object") return null;
    const choice = parsed as Partial<ConsentChoice>;
    return typeof choice.visitorId === "string" && typeof choice.accepted === "boolean" && typeof choice.decidedAt === "string" && typeof choice.region === "string" && choice.noticeVersion === NOTICE_VERSION
      ? choice as ConsentChoice : null;
  } catch { return null; }
}

export function visitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function saveConsent(accepted: boolean, region: string): ConsentChoice {
  const choice = { visitorId: visitorId(), accepted, region, decidedAt: new Date().toISOString(), noticeVersion: NOTICE_VERSION };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(choice));
  window.dispatchEvent(new Event("marketing-consent-change"));
  return choice;
}

export function requiresConsent(region: string): boolean {
  // Unknown locations fail closed. EEA, UK, Switzerland, and Brazil require a choice.
  return !region || region === "XX" || region === "T1" || ["BR", "GB", "CH", "NO", "IS", "LI", "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"].includes(region);
}