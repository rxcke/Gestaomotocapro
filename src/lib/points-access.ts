/** Scheduling only. The database independently chooses the authoritative day. */
export function nextBrasiliaDayDelay(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo", hourCycle: "h23",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(now);
  const part = (name: string) => Number(parts.find((p) => p.type === name)?.value ?? 0);
  const elapsed = ((part("hour") * 60 + part("minute")) * 60 + part("second")) * 1000 + now.getUTCMilliseconds();
  return 86_400_000 - elapsed + 1000;
}