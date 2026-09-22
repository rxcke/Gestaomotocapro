import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { formatBrazilianMobile, isValidBrazilianMobile, needsPhoneCompletion, normalizeBrazilianMobile } from "./phone";

describe("celular brasileiro", () => {
  test("normaliza número mascarado para formato internacional", () => {
    assert.equal(normalizeBrazilianMobile("(31) 99999-9999"), "+5531999999999");
  });

  test("mantém um número internacional válido", () => {
    assert.equal(normalizeBrazilianMobile("+55 31 99999-9999"), "+5531999999999");
  });

  test("rejeita texto, telefone curto e número sem o nono dígito", () => {
    assert.equal(isValidBrazilianMobile("qualquer coisa"), false);
    assert.equal(isValidBrazilianMobile("3199999"), false);
    assert.equal(isValidBrazilianMobile("(31) 8888-7777"), false);
  });

  test("formata progressivamente sem salvar a máscara", () => {
    assert.equal(formatBrazilianMobile("31999999999"), "(31) 99999-9999");
    assert.equal(formatBrazilianMobile("+5531999999999"), "(31) 99999-9999");
  });

  test("solicita telefone ausente uma vez e não solicita o já válido", () => {
    assert.equal(needsPhoneCompletion(null), true);
    assert.equal(needsPhoneCompletion(""), true);
    assert.equal(needsPhoneCompletion("+5531999999999"), false);
  });
});