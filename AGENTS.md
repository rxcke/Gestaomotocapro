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
- Report recorded session elapsed time without inventing pause durations, since journey pauses are not persisted.
