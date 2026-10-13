import { test } from "node:test";
import assert from "node:assert/strict";
import { financialWriteErrorMessage, isPositiveAmount, NON_POSITIVE_AMOUNT_MESSAGE } from "./money-input";

test("F-01: zero não é aceito", () => assert.equal(isPositiveAmount(0), false));
test("F-01: valor negativo não é aceito", () => assert.equal(isPositiveAmount(-10), false));
test("F-01: campo vazio não é aceito", () => assert.equal(isPositiveAmount(null), false));
test("F-01: centavo positivo é aceito", () => assert.equal(isPositiveAmount(0.01), true));
test("F-01: recusa do banco vira mensagem clara", () => {
  assert.equal(financialWriteErrorMessage('new row for relation "incomes" violates check constraint "incomes_amount_positive"'), NON_POSITIVE_AMOUNT_MESSAGE);
  assert.equal(financialWriteErrorMessage('violates check constraint "expenses_amount_positive"'), NON_POSITIVE_AMOUNT_MESSAGE);
});
test("F-04: jornada de outro usuário vira mensagem clara", () => assert.equal(financialWriteErrorMessage("work_session_owner_mismatch"), "Essa jornada não pertence à sua conta."));
