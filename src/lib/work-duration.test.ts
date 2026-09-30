import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { workedDuration } from "./work-duration";
import type { WorkSession, WorkSessionPause } from "./types";

const at = (hour: number, minute = 0) => `2026-09-28T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`;
const session = (end_time: string | null): WorkSession => ({ id: "session", user_id: "owner", motorcycle_id: null, start_time: at(8), end_time, start_km: null, end_km: null, total_income: 0, total_expense: 0, net_profit: 0, created_at: at(8) });
const pause = (start: string, end: string | null, work_session_id = "session"): WorkSessionPause => ({ id: crypto.randomUUID(), user_id: "owner", work_session_id, started_at: start, ended_at: end, created_at: start });

describe("duração efetivamente trabalhada", () => {
  test("jornada 08–12 sem pausa dura quatro horas", () => assert.equal(workedDuration(session(at(12)), []), 4 * 3600000));
  test("jornada 08–12 com pausa 10–10:30 dura três horas e meia", () => assert.equal(workedDuration(session(at(12)), [pause(at(10), at(10, 30))]), 3.5 * 3600000));
  test("jornada 08–17 com pausa 12–13 dura oito horas", () => assert.equal(workedDuration(session(at(17)), [pause(at(12), at(13))]), 8 * 3600000));
  test("múltiplas pausas são subtraídas", () => assert.equal(workedDuration(session(at(13)), [pause(at(9, 30), at(10)), pause(at(11, 30), at(12))]), 4 * 3600000));
  test("pausa aberta congela contador após refresh", () => {
    const s = session(null);
    const pauses = [pause(at(10), null)];
    assert.equal(workedDuration(s, pauses, new Date(at(11)).getTime()), 2 * 3600000);
    assert.equal(workedDuration(s, pauses, new Date(at(17)).getTime()), 2 * 3600000);
  });
  test("retomar e recarregar preserva duração acumulada", () => {
    const s = session(null);
    assert.equal(workedDuration(s, [pause(at(10), at(10, 30))], new Date(at(12)).getTime()), 3.5 * 3600000);
  });
  test("encerrar pausada fecha intervalo na hora do encerramento", () => assert.equal(workedDuration(session(at(12)), [pause(at(10), at(12))]), 2 * 3600000));
  test("pausa curta e pausa de outra jornada não distorcem o tempo", () => assert.equal(workedDuration(session(at(12)), [pause(at(10), at(10, 1)), pause(at(8), at(12), "other")]), 239 * 60000));
});