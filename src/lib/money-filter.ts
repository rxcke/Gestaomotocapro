export const ALL_ENTRIES = "all";
export const NO_MOTO = "none";

/** All entries, one motorcycle's entries, or only entries without a motorcycle. */
export function filterByMotorcycle<T extends { motorcycle_id: string | null }>(rows: T[], filter: string) {
  if (filter === ALL_ENTRIES) return rows;
  if (filter === NO_MOTO) return rows.filter((r) => r.motorcycle_id == null);
  return rows.filter((r) => r.motorcycle_id === filter);
}
