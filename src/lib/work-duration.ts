import type { WorkSession, WorkSessionPause } from "./types";

/** Intervalo da jornada menos os intervalos de pausa efetivamente registrados. */
export function workedDuration(session: WorkSession, pauses: WorkSessionPause[], now = Date.now()) {
  const start = new Date(session.start_time).getTime();
  const end = session.end_time ? new Date(session.end_time).getTime() : now;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  const total = Math.max(0, end - start);
  const paused = pauses.filter((pause) => pause.work_session_id === session.id).reduce((sum, pause) => {
    const from = new Date(pause.started_at).getTime();
    const to = pause.ended_at ? new Date(pause.ended_at).getTime() : end;
    if (!Number.isFinite(from) || !Number.isFinite(to)) return sum;
    return sum + Math.max(0, Math.min(end, to) - Math.max(start, from));
  }, 0);
  return Math.max(0, total - paused);
}