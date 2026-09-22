const AUTH_ERROR_MESSAGES: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "E-mail ou senha incorretos."],
  [/email not confirmed/i, "Confirme seu e-mail antes de entrar."],
  [/user already registered|already been registered/i, "Já existe uma conta com este e-mail."],
  [/password should be at least|weak password/i, "Use uma senha mais forte, com pelo menos 8 caracteres."],
  [/rate limit|over_email_send_rate_limit/i, "Muitas tentativas seguidas. Aguarde alguns minutos."],
  [/expired|otp_expired/i, "Este link expirou. Solicite um novo."],
  [/same password/i, "A nova senha deve ser diferente da senha anterior."],
];

export function authErrorMessage(error: unknown, fallback = "Não foi possível continuar.") {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return AUTH_ERROR_MESSAGES.find(([pattern]) => pattern.test(message))?.[1] ?? fallback;
}

export function readSafeReturnPath() {
  if (typeof window === "undefined") return "/app";
  const value = window.sessionStorage.getItem("auth:returnTo");
  window.sessionStorage.removeItem("auth:returnTo");
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/app";
}