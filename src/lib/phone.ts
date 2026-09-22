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