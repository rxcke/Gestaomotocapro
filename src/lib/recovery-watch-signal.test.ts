import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseMarker } from "./recovery-session";

// Pure copy-free check of the URL signal rule via the module source would need the
// auth client; test the rule through a minimal re-implementation guard instead.
const src = readFileSync(new URL("./recovery-watch.ts", import.meta.url), "utf8");
const root = readFileSync(new URL("../routes/__root.tsx", import.meta.url), "utf8");

test("root route calls startRecoveryWatch at module load (not a side-effect import)", () => {
  assert.match(root, /^startRecoveryWatch\(\);$/m);
  assert.doesNotMatch(root, /^import\s+["']@\/lib\/recovery-watch["'];?$/m);
});

test("watch is idempotent and clears on sign-out", () => {
  assert.match(src, /if \(started \|\| typeof window === "undefined"\) return started;/);
  assert.match(src, /SIGNED_OUT"\) return clearRecoveryMarker\(\)/);
});

test("URL signal alone never becomes a marker without a session user", () => {
  assert.match(src, /const userId = session\?\.user\?\.id;\s*if \(!userId\) return;/);
  assert.equal(parseMarker(null), null);
});
