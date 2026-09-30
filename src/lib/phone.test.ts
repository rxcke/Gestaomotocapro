import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { displayProfilePhone, formatBrazilianMobile, isValidBrazilianMobile, needsPhoneCompletion, normalizeBrazilianMobile } from "./phone";

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

describe("exibição do telefone no painel", () => {
  test("formata número internacional e local sem mudar os dígitos", () => {
    assert.equal(displayProfilePhone("+5531999999999"), "(31) 99999-9999");
    assert.equal(displayProfilePhone("31988887777"), "(31) 98888-7777");
    assert.equal(displayProfilePhone("(31) 98888-7777"), "(31) 98888-7777");
  });
  test("ausência e formatos desconhecidos não inventam nem truncam número", () => {
    assert.equal(displayProfilePhone(null), "Não informado");
    assert.equal(displayProfilePhone("  "), "Não informado");
    assert.equal(displayProfilePhone("+1 212 555 0000"), "+1 212 555 0000");
    assert.equal(displayProfilePhone("319999999999"), "319999999999");
  });
});