# Ranking UI validation

Executed on 2026-10-19 against the preview, using only the previously authorized disposable account.

- Authenticated `/app/ranking` rendered the real total of 1 point, shared rank 1, one weekly day and one daily-login history event (+1, 2026-10-19).
- Both actual participants tied at 1 point and retained the database's shared dense rank 1; public aliases are ordered ascending. No new tie-break calculation or migration.
- `/app/ranking?page=2` returned an empty classification page while retaining the user's independent global rank and score. Previous-page navigation worked.
- Desktop and 360px screenshots inspected; mobile More menu exposed Ranking and history remained reachable by scrolling. No horizontal overflow.
- A browser-intercepted HTTP 503 for the personal read showed the error screen, not a fabricated balance. Removing the interception and selecting Retry restored real data. No page errors.
- `bun test`: 139 passed, zero failed. Latest harness build: OK.
- Live RLS inspected: both ledger and participant tables still have owner-only authenticated SELECT policies. No schema, permission, credit-hook, subscription or authentication changes.

Limits: a completely participant-free database and a user with no history were not exercised, since active rows were preserved. Their empty states are implemented but not claimed as tested. Only two live participants exist; pagination beyond a full 20-row page was not tested with artificial data. Weekly bonus UI has no real five-day event yet. History remains the existing latest-100 response; no invented cumulative historical totals.