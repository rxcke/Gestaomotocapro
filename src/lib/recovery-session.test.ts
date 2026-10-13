import { test } from "node:test";
import assert from "node:assert/strict";
import { isRecoverySession, parseMarker, recoveryLinkError } from "./recovery-session";

const now = 1_800_000_000;
const user = { id: "u1" };
// amr exactly as the auth server issues it after verifying a recovery link: method "otp".
const session = (method: string, ts = now - 5, u = user) => ({
  access_token: `h.${Buffer.from(JSON.stringify({ amr: [{ method, timestamp: ts }] })).toString("base64url")}.s`,
  user: u,
});
const marker = { userId: "u1", at: now - 5 };

test("valid recovery: otp session + recovery event marker", () => {
  assert.equal(isRecoverySession(session("otp"), marker, now), true);
});

test("recovery event received before the page mounted still counts (marker persisted)", () => {
  const stored = parseMarker(JSON.stringify(marker));
  assert.equal(isRecoverySession(session("otp"), stored, now), true);
});

test("valid after the URL was cleaned: decision does not read the URL", () => {
  assert.equal(recoveryLinkError("", ""), null);
  assert.equal(isRecoverySession(session("otp"), marker, now), true);
});

test("password and Google sessions are refused, even with a marker", () => {
  assert.equal(isRecoverySession(session("password"), marker, now), false);
  assert.equal(isRecoverySession(session("oauth"), marker, now), false);
});

test("magic link (otp) without recovery event is refused", () => {
  assert.equal(isRecoverySession(session("otp"), null, now), false);
});

test("marker from another user is refused", () => {
  assert.equal(isRecoverySession(session("otp", now - 5, { id: "u2" }), marker, now), false);
});

test("recovery older than one hour is refused", () => {
  assert.equal(isRecoverySession(session("otp", now - 3601), marker, now), false);
  assert.equal(isRecoverySession(session("otp"), { userId: "u1", at: now - 3601 }, now), false);
});

test("invalid, expired or used link: server error in URL, no session", () => {
  assert.equal(recoveryLinkError("#error=access_denied&error_code=otp_expired", ""), "otp_expired");
  assert.equal(recoveryLinkError("", "?error_code=otp_expired"), "otp_expired");
  assert.equal(isRecoverySession(null, marker, now), false);
});

test("corrupt marker is ignored", () => {
  assert.equal(parseMarker("{bad"), null);
  assert.equal(parseMarker(JSON.stringify({ userId: 1 })), null);
});
