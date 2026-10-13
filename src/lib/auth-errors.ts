const AUTH_ERROR_MESSAGES: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "E-mail ou senha incorretos."],
  [/email not confirmed/i, "Confirme seu e-mail antes de entrar."],
  [/user already registered|already been registered/i, "Já existe uma conta com este e-mail."],
  [/password should be at least|weak password/i, "Use uma senha mais forte, com pelo menos 8 caracteres."],
  [/rate limit|over_email_send_rate_limit/i, "Muitas tentativas seguidas. Aguarde alguns minutos."],
  [/expired|otp_expired/i, "Este link expirou. Solicite um novo."],
  [/same password/i, "A nova senha deve ser diferente da senha anterior."],
];

const RATE_LIMIT_CODES = new Set(["over_email_send_rate_limit", "over_request_rate_limit", "over_sms_send_rate_limit"]);

function waitMessage(message: string) {
  const match = /after (\d{1,3}) seconds?/i.exec(message);
  const seconds = match ? Number(match[1]) : 0;
  return seconds > 0
    ? `Aguarde ${seconds} ${seconds === 1 ? "segundo" : "segundos"} e tente de novo.`
    : "Aguarde alguns segundos e tente de novo.";
}

export function authErrorMessage(error: unknown, fallback = "Não foi possível continuar.") {
  const fields = (error && typeof error === "object" ? error : {}) as { message?: unknown; code?: unknown; status?: unknown };
  const message = typeof error === "string" ? error : typeof fields.message === "string" ? fields.message : "";
  const code = typeof fields.code === "string" ? fields.code : "";
  if (RATE_LIMIT_CODES.has(code) || fields.status === 429 || /for security purposes.*after \d+ seconds?/i.test(message)) {
    return waitMessage(message);
  }
  if (code === "otp_expired") return "Este link expirou. Solicite um novo.";
  if (code === "same_password") return "A nova senha deve ser diferente da senha anterior.";
  return AUTH_ERROR_MESSAGES.find(([pattern]) => pattern.test(message))?.[1] ?? fallback;
}

export function peekSafeReturnPath() {
  if (typeof window === "undefined") return "/app";
  const value = window.sessionStorage.getItem("auth:returnTo");
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/app";
}

export function clearSafeReturnPath() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem("auth:returnTo");
}