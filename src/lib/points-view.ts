/** Display only: the server owns credits, ranks and the weekly calendar. */
export const RANKING_PAGE_SIZE = 20;

export function rankingPage(value: unknown): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function weeklyBonusPercent(progress: number): number {
  return Math.min(5, Math.max(0, progress)) / 5 * 100;
}

export function pointsEventDate(referenceDate: string): string {
  // DATE is already the authoritative Brasília day; never convert it to UTC midnight.
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(`${referenceDate}T12:00:00`));
}