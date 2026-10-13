import { test } from "node:test";
import assert from "node:assert/strict";
import { authErrorMessage } from "./auth-errors";

const authError = (message: string, code?: string, status?: number) =>
  Object.assign(new Error(message), { code, status });

test("rate limit recognised by code, with server-provided wait time", () => {
  const e = authError("For security purposes, you can only request this after 12 seconds.", "over_email_send_rate_limit", 429);
  assert.equal(authErrorMessage(e), "Aguarde 12 segundos e tente de novo.");
});

test("rate limit by code without a time uses a generic wait", () => {
  assert.equal(authErrorMessage(authError("Email rate limit exceeded", "over_email_send_rate_limit")), "Aguarde alguns segundos e tente de novo.");
});

test("status 429 alone is treated as a wait", () => {
  assert.equal(authErrorMessage(authError("Too many requests", undefined, 429)), "Aguarde alguns segundos e tente de novo.");
});

test("wait message recognised from the error text structure", () => {
  assert.equal(authErrorMessage(authError("For security purposes, you can only request this after 1 seconds.")), "Aguarde 1 segundo e tente de novo.");
});

test("unknown failures get the generic message", () => {
  assert.equal(authErrorMessage(authError("boom internal xyz")), "Não foi possível continuar.");
  assert.equal(authErrorMessage(null), "Não foi possível continuar.");
  assert.equal(authErrorMessage(authError("x"), "Falhou."), "Falhou.");
});

test("never reveals whether an email exists", () => {
  for (const m of ["User not found", "No user with this email", "Email address is invalid"]) {
    const out = authErrorMessage(authError(m));
    assert.equal(out, "Não foi possível continuar.");
  }
});

test("other auth errors keep their messages", () => {
  assert.equal(authErrorMessage(authError("Invalid login credentials")), "E-mail ou senha incorretos.");
  assert.equal(authErrorMessage(authError("Email not confirmed")), "Confirme seu e-mail antes de entrar.");
  assert.equal(authErrorMessage(authError("User already registered")), "Já existe uma conta com este e-mail.");
  assert.equal(authErrorMessage(authError("Email link is invalid or has expired", "otp_expired")), "Este link expirou. Solicite um novo.");
  assert.equal(authErrorMessage(authError("New password should be different from the old password.", "same_password")), "A nova senha deve ser diferente da senha anterior.");
});
