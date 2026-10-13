import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { buildRecoveryConfirmUrl, safeAppOrigin } from "./recovery-link";
import { __resetConfirmForTests, confirmRecovery, readConfirmParams } from "./recovery-confirm";

const AUTH = "https://abc.supabase.co/auth/v1/verify";
const HASH = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8";
const serverLink = (redirect: string, type = "recovery", token = HASH) =>
  `${AUTH}?token=${token}&type=${type}&redirect_to=${encodeURIComponent(redirect)}`;

beforeEach(() => __resetConfirmForTests());

test("link: builds /auth/confirm on the requesting allowed domain", () => {
  assert.equal(
    buildRecoveryConfirmUrl(serverLink("https://www.gestaomotocapro.com.br/reset-password")),
    `https://www.gestaomotocapro.com.br/auth/confirm?token_hash=${HASH}&type=recovery`,
  );
});

test("link: unknown or look-alike redirect domains fall back to main domain", () => {
  for (const evil of ["https://evil.com/x", "https://gestaomotocapro.com.br.evil.com/", "http://gestaomotocapro.com.br/", "javascript:alert(1)"]) {
    assert.equal(safeAppOrigin(evil), "https://gestaomotocapro.com.br");
  }
  assert.ok(buildRecoveryConfirmUrl(serverLink("https://evil.com/"))!.startsWith("https://gestaomotocapro.com.br/auth/confirm?"));
});

test("link: prefers server-provided token_hash when present", () => {
  const other = "f".repeat(56);
  assert.match(buildRecoveryConfirmUrl(serverLink("https://gestaomotocapro.com.br/"), other)!, new RegExp(`token_hash=${other}`));
});

test("link: non-recovery, pkce or malformed links are not rewritten", () => {
  assert.equal(buildRecoveryConfirmUrl(serverLink("https://gestaomotocapro.com.br/", "magiclink")), null);
  assert.equal(buildRecoveryConfirmUrl(serverLink("https://gestaomotocapro.com.br/", "recovery", "pkce_" + HASH)), null);
  assert.equal(buildRecoveryConfirmUrl("https://abc.supabase.co/other?token=x&type=recovery"), null);
  assert.equal(buildRecoveryConfirmUrl("not a url"), null);
});

const ok = async () => ({ data: { session: { user: { id: "u1" } }, user: { id: "u1" } }, error: null });

test("confirm: valid token verifies once and returns the user", async () => {
  let calls = 0;
  const verify = async (a: { token_hash: string; type: "recovery" }) => {
    calls++;
    assert.deepEqual(a, { token_hash: HASH, type: "recovery" });
    return ok();
  };
  const params = readConfirmParams(`?token_hash=${HASH}&type=recovery`);
  const [r1, r2] = await Promise.all([confirmRecovery(params, verify), confirmRecovery(params, verify)]);
  assert.deepEqual(r1, { ok: true, userId: "u1" });
  assert.deepEqual(r2, r1);
  assert.equal(calls, 1);
});

test("confirm: expired token", async () => {
  const r = await confirmRecovery({ tokenHash: HASH, type: "recovery" }, async () => ({
    data: { session: null, user: null }, error: { code: "otp_expired", status: 403, message: "Email link is invalid or has expired" },
  }));
  assert.deepEqual(r, { ok: false, reason: "expired" });
});

test("confirm: already used token is refused", async () => {
  const r = await confirmRecovery({ tokenHash: HASH, type: "recovery" }, async () => ({
    data: { session: null, user: null }, error: { status: 403, message: "Token has expired or is invalid" },
  }));
  assert.equal(r.ok, false);
});

test("confirm: wrong type or missing token never calls the server", async () => {
  let calls = 0;
  const verify = async () => { calls++; return ok(); };
  assert.deepEqual(await confirmRecovery({ tokenHash: HASH, type: "magiclink" }, verify), { ok: false, reason: "invalid_type" });
  assert.deepEqual(await confirmRecovery({ tokenHash: null, type: "recovery" }, verify), { ok: false, reason: "missing_token" });
  assert.equal(calls, 0);
});

test("confirm: success without session is not accepted", async () => {
  const r = await confirmRecovery({ tokenHash: HASH, type: "recovery" }, async () => ({ data: { session: null, user: { id: "u1" } }, error: null }));
  assert.equal(r.ok, false);
});
