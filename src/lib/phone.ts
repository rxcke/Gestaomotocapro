import { z } from "zod";

const brazilianMobileDigits = z.string().regex(/^[1-9]{2}9\d{8}$/);

export function normalizeBrazilianMobile(value: string): string | null {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length === 13) digits = digits.slice(2);
  return brazilianMobileDigits.safeParse(digits).success ? `+55${digits}` : null;
}

export function formatBrazilianMobile(value: string | null | undefined): string {
  let digits = (value ?? "").replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) digits = digits.slice(2);
  digits = digits.slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidBrazilianMobile(value: string | null | undefined): boolean {
  return normalizeBrazilianMobile(value ?? "") !== null;
}

export function needsPhoneCompletion(value: string | null | undefined): boolean {
  return !isValidBrazilianMobile(value);
}

/** Read-only display for numbers already stored on a profile. Never guess or truncate a DDD. */
export function displayProfilePhone(value: string | null | undefined): string {
  const original = value?.trim();
  if (!original) return "Não informado";
  const digits = original.replace(/\D/g, "");
  const local = digits.length === 13 && digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length === 11 && /^[1-9]{2}9\d{8}$/.test(local)) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  return original;
}