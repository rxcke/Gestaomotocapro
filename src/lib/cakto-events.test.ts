import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, test } from "node:test";
import { caktoEventTime, hasValidCaktoSignature } from "./cakto-events";

const secret = "test-secret-not-real";
const body = '{"event":"purchase_approved","data":{"id":"o1"}}';
const now = 1_800_000_000;
const sign = (ts: number, raw = body, key = secret) =>
  `v1=${createHmac("sha256", key).update(`${ts}.${raw}`).digest("hex")}`;

describe("Cakto signature", () => {
  test("accepts a valid v1 signature", async () => {
    assert.equal(await hasValidCaktoSignature(body, String(now), sign(now), secret, now), true);
  });
  test("accepts v1 among several versions", async () => {
    assert.equal(await hasValidCaktoSignature(body, String(now), `v2=abcd, ${sign(now)}`, secret, now), true);
  });
  test("rejects tampered body, wrong secret, missing headers", async () => {
    assert.equal(await hasValidCaktoSignature(body + " ", String(now), sign(now), secret, now), false);
    assert.equal(await hasValidCaktoSignature(body, String(now), sign(now, body, "other"), secret, now), false);
    assert.equal(await hasValidCaktoSignature(body, null, sign(now), secret, now), false);
    assert.equal(await hasValidCaktoSignature(body, String(now), null, secret, now), false);
  });
  test("rejects replays older than 5 minutes", async () => {
    const old = now - 301;
    assert.equal(await hasValidCaktoSignature(body, String(old), sign(old), secret, now), false);
  });
});

describe("Cakto event time", () => {
  test("uses the event-specific date", () => {
    assert.equal(caktoEventTime("refund", { refundedAt: "2026-01-10T00:00:00Z", paidAt: "2026-01-01T00:00:00Z" }, null), "2026-01-10T00:00:00.000Z");
    assert.equal(caktoEventTime("chargeback", { chargedbackAt: "2026-02-03T00:00:00Z" }, null), "2026-02-03T00:00:00.000Z");
    assert.equal(caktoEventTime("subscription_renewed", { paidAt: "2026-03-01T00:00:00Z" }, null), "2026-03-01T00:00:00.000Z");
  });
  test("falls back to the signed delivery time, else null", () => {
    assert.equal(caktoEventTime("subscription_late", {}, String(now)), new Date(now * 1000).toISOString());
    assert.equal(caktoEventTime("subscription_late", {}, null), null);
  });
});
