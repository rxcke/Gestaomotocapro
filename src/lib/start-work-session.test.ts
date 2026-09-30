import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { startOrResumeSession } from "./start-work-session";

const conflict = { code: "23505", message: 'duplicate key value violates unique constraint "work_sessions_one_active_per_user"' };
const isConflict = (error: unknown) => error === conflict;

describe("início seguro de jornada", () => {
  test("sem jornada cria uma única", async () => {
    let inserts = 0;
    assert.deepEqual(await startOrResumeSession(async () => null, async () => { inserts++; return "nova"; }, isConflict), { session: "nova", existed: false });
    assert.equal(inserts, 1);
  });
  test("jornada aberta existente não cria outra", async () => {
    const result = await startOrResumeSession(async () => "aberta", async () => { throw new Error("insert inesperado"); }, isConflict);
    assert.deepEqual(result, { session: "aberta", existed: true });
  });
  test("jornada pausada existente não cria outra", async () => {
    assert.deepEqual(await startOrResumeSession(async () => "pausada", async () => { throw new Error("insert inesperado"); }, isConflict), { session: "pausada", existed: true });
  });
  test("duas requisições simultâneas recuperam a mesma jornada após conflito", async () => {
    let active: string | null = null;
    let inserts = 0;
    const getActive = async () => active;
    const create = async () => {
      inserts++;
      await Promise.resolve();
      if (active) throw conflict;
      active = "mesma-jornada";
      return active;
    };
    const results = await Promise.all([startOrResumeSession(getActive, create, isConflict), startOrResumeSession(getActive, create, isConflict)]);
    assert.equal(inserts, 2);
    assert.deepEqual(results.map((r) => r.session), ["mesma-jornada", "mesma-jornada"]);
    assert.equal(results.filter((r) => !r.existed).length, 1);
  });
  test("erros não relacionados ao índice continuam sendo erros", async () => {
    await assert.rejects(startOrResumeSession(async () => null, async () => { throw new Error("sem acesso"); }, isConflict), /sem acesso/);
  });
});