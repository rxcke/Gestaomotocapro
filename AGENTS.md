<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep weekly reporting as a pure calculation over RLS-scoped existing rows in `src/lib/weekly-report.ts`; this avoids a second financial ledger or unnecessary stored summaries.
- Use the browser's local calendar for weekly DATE boundaries and session end dates; this matches existing client-side period calculations.
- Keep pause intervals in RLS-scoped work_session_pauses and derive working time through workedDuration; this avoids invented pauses and keeps journey and weekly hours consistent.
- Keep AppDataProvider in its own component module, separate from AppContext and hooks; this prevents Fast Refresh from replacing the context while mounted consumers still reference the old instance.
- Keep session-start race recovery in `src/lib/start-work-session.ts` and read the user's open journey across all motorcycles; an open journey can have no motorcycle and the database's unique index remains the final guard.
- Keep app entitlement in `has_app_access(auth.uid())` while subscription remains a separate Cakto fact; this prevents special roles from masquerading as paid plans.
- Keep marketing consent in append-only, owner-scoped choices and purchases in a transaction-keyed server-only delivery table; this preserves revocations and prevents webhook replays from double-sending conversions.
- Keep the free demo as a database-timed window in `demo_usage` (created by a profile trigger, read-only to users) that `has_app_access` honors via `has_demo_access`, never a subscription, trial or role; this makes expiry tamper-proof without touching Cakto.
- Cakto events are applied only through `apply_cakto_event` (ordered by `event_at`, never reactivating a refunded/charged-back transaction) and authenticated by the documented HMAC header; pending purchases link by hashed e-mail only to confirmed accounts. Why: prevents stale/forged events granting access and keeps buyer e-mails out of the event log.
- Closed work_session totals are derived by database triggers from linked incomes/expenses, and entries may only link to the owner's sessions; this keeps Jornada history consistent with Dinheiro/Relatórios without trusting the client. Regression scenarios live in tests/db/.
- Password recovery e-mails link to /auth/confirm, which calls verifyOtp(token_hash, recovery) once; /reset-password still requires a fresh OTP session plus a same-user recovery marker. Why: avoids depending on the implicit-flow URL hash being caught at app start.
- Keep usage points in an append-only owner-readable ledger, credited by a no-argument authenticated database RPC using the server's America/Sao_Paulo calendar and a per-user transaction lock; this prevents client-chosen dates, identities, credits and concurrent duplicate bonuses.
- Record authenticated /app visits independently of financial entitlement; expose ranking aggregates with generated public aliases only, never profile/contact/financial fields, so gamification neither changes subscription access nor leaks private data.
- The ranking UI uses authenticated Query loaders and the existing points RPCs only; keep totals and dense-rank positions server-owned. Equal totals share a position, with public alias ascending as the stable display tie-breaker, matching the existing database function; show the independent personal summary outside pagination so users always see their own position. Never derive all-time running history totals from the capped recent-history response.
