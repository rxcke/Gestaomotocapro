# Points preview validation — 2026-10-19

## Scope
Existing migration 0040 was reused unchanged. The requesting user explicitly identified the disposable account used for credits. The separate existing user was used only for read/write-denial checks, without visiting /app or calling the credit RPC for that user.

## Executed against the preview
- Authenticated the authorized disposable account and confirmed its identity before any credit operation.
- Read initial summary/history: total 0 and zero events.
- Visited /app: the existing access hook credited one daily_login worth exactly 1 point, reference date 2026-10-19 (Brasília).
- Read the existing getMyPoints server function in the browser: total 1 and one event worth 1 point.
- Reloaded /app and called the existing credit function again: daily_awarded=false, bonus_awarded=false; total/history remained 1/1.
- Attempted own-points update to 999 through the authenticated Data API: no rows affected, no credit changed. The operation returned an empty result rather than a permission error; authoritative readback confirmed the original 1 point.
- Controlled browser interception returned HTTP 503 for the credit call only: the server-function caller rejected, the app remained usable, and no success toast appeared. No production/server behavior was mocked for successful credits.
- Used a separate authenticated browser context for another user: target private history returned zero rows; update affected no rows. No credit function was called for that context.
- Final privileged read confirmed the disposable account has exactly one daily event worth 1; the other account's pre-existing event was unchanged.
- Browser page errors: 0.

## Controlled weekly scenario
Executed tests/db/run-points-tests.sh in a disposable local PostgreSQL instance using the unchanged migration. All 36 assertions passed, including five distinct days yielding total 10 (five daily points plus a single bonus of 5), sixth/seventh days yielding only +1, bonus reprocessing, and ten concurrent fifth-day calls yielding no duplicates. These controlled timestamps were used only in the disposable database, never the active preview database.

## Limits and next stage
The weekly bonus was not exercised over five actual preview days; its controlled database scenario passed. Points are not yet displayed in an application screen, so readback was through the browser's existing authenticated server functions, not a newly built ranking interface. No new schema, auth setting, recovery behavior, subscription, payment, webhook, or financial data change was made. Nothing was published. The authorized account's single legitimate daily point is retained. The next stage is the ranking interface.