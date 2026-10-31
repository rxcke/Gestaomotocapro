import { test } from "node:test";
import assert from "node:assert/strict";
import {
  accessKind,
  accessLabel,
  adminAccessFilter,
  adminPage,
  adminPlanFilter,
  adminSearch,
  adminSubscriptionFilter,
  adminWebhookStatusFilter,
  overviewPeriod,
  overviewPeriodStart,
  planLabel,
  subscriptionStatusLabel,
  webhookNeedsAttention,
} from "./admin-view";

test("invalid admin pages fall back to the first page", () => {
  for (const value of [-1, 0, 1.5, "bad", Infinity]) assert.equal(adminPage(value), 1);
  assert.equal(adminPage("3"), 3);
});

test("overview period accepts only 7d, 30d or all", () => {
  assert.equal(overviewPeriod("7d"), "7d");
  assert.equal(overviewPeriod("30d"), "30d");
  for (const value of ["1d", "year", 7, null]) assert.equal(overviewPeriod(value), "all");
});

test("overview period start is relative to now and null for all", () => {
  const now = new Date("2026-10-31T12:00:00Z");
  assert.equal(overviewPeriodStart("7d", now)?.toISOString(), "2026-10-24T12:00:00.000Z");
  assert.equal(overviewPeriodStart("30d", now)?.toISOString(), "2026-10-01T12:00:00.000Z");
  assert.equal(overviewPeriodStart("all", now), null);
});

test("historical quarterly plans keep their label", () => {
  assert.equal(planLabel("monthly"), "Start · Mensal");
  assert.equal(planLabel("quarterly"), "Pro · Trimestral");
  assert.equal(planLabel("annual"), "Elite · Anual");
});

test("subscription statuses include chargeback and refunded", () => {
  assert.equal(subscriptionStatusLabel("active"), "Ativa");
  assert.equal(subscriptionStatusLabel("chargeback"), "Chargeback");
  assert.equal(subscriptionStatusLabel("refunded"), "Reembolsada");
});

test("access kind prioritizes admin, ambassador and subscriber over demo", () => {
  const now = Date.parse("2026-10-31T12:00:00Z");
  const base = { admin: false, ambassador: false, subscribed: false, demo: false, demoExpiresAt: null };
  assert.equal(accessKind({ ...base, admin: true, subscribed: true }, now), "admin");
  assert.equal(accessKind({ ...base, ambassador: true }, now), "ambassador");
  assert.equal(accessKind({ ...base, subscribed: true }, now), "subscriber");
  assert.equal(accessKind({ ...base, demo: true, demoExpiresAt: "2026-11-01T12:00:00Z" }, now), "demo");
  assert.equal(accessKind({ ...base, demo: true, demoExpiresAt: "2026-10-30T12:00:00Z" }, now), "demo_expired");
  assert.equal(accessKind(base, now), "none");
  assert.equal(accessLabel("demo_expired"), "Demonstração expirada");
});

test("admin filters reject unknown values", () => {
  assert.equal(adminAccessFilter("ambassador"), "ambassador");
  assert.equal(adminAccessFilter("root"), "all");
  assert.equal(adminSubscriptionFilter("chargeback"), "chargeback");
  assert.equal(adminSubscriptionFilter("whatever"), "all");
  assert.equal(adminPlanFilter("quarterly"), "quarterly");
  assert.equal(adminPlanFilter("weekly"), "all");
  assert.equal(adminWebhookStatusFilter("attention"), "attention");
  assert.equal(adminWebhookStatusFilter("broken"), "all");
});

test("webhook attention requires unprocessed or an error message", () => {
  assert.equal(webhookNeedsAttention({ processed: true, error_message: null }), false);
  assert.equal(webhookNeedsAttention({ processed: false, error_message: null }), true);
  assert.equal(webhookNeedsAttention({ processed: true, error_message: "buyer_not_found" }), true);
});

test("admin search trims and caps free text", () => {
  assert.equal(adminSearch("  erick  "), "erick");
  assert.equal(adminSearch(42), "");
  assert.equal(adminSearch("x".repeat(200)).length, 120);
});
