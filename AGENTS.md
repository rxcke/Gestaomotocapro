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
