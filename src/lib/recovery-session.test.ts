import { test } from "node:test";
import assert from "node:assert/strict";
import { isRecoverySession, recoveryLinkError } from "./recovery-session";

const now = 1_800_000_000;
const token = (amr: unknown) =>
  `h.${Buffer.from(JSON.stringify({ amr })).toString("base64url")}.s`;

test("valid recovery session is accepted without the URL marker", () => {
  assert.equal(isRecoverySession(token([{ method: "recovery", timestamp: now - 5 }]), now), true);
});

test("ordinary password session is rejected", () => {
  assert.equal(isRecoverySession(token([{ method: "password", timestamp: now - 5 }]), now), false);
});

test("google and magic link sessions are rejected", () => {
  assert.equal(isRecoverySession(token([{ method: "oauth", timestamp: now }]), now), false);
  assert.equal(isRecoverySession(token([{ method: "otp", timestamp: now }]), now), false);
});

test("old recovery session (over 1 hour) is rejected", () => {
  assert.equal(isRecoverySession(token([{ method: "recovery", timestamp: now - 3601 }]), now), false);
});

test("no session or garbage token is rejected", () => {
  assert.equal(isRecoverySession(null, now), false);
  assert.equal(isRecoverySession("not-a-jwt", now), false);
});

test("expired link error is read from the hash", () => {
  assert.equal(recoveryLinkError("#error=access_denied&error_code=otp_expired", ""), "otp_expired");
});

test("error is read from the query string too", () => {
  assert.equal(recoveryLinkError("", "?error_code=otp_expired"), "otp_expired");
  assert.equal(recoveryLinkError("#type=recovery", ""), null);
});
