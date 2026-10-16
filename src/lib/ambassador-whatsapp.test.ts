import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { ambassadorWhatsAppUrl } from "./ambassador-whatsapp";

const ORIGINAL =
  "https://wa.me/5531983662706?text=Ol%C3%A1!%20Tenho%20interesse%20em%20me%20tornar%20embaixador%20do%20Gest%C3%A3o%20Motoca%20Pro.%20Gostaria%20de%20conhecer%20o%20programa%20e%20como%20come%C3%A7ar.";

describe("ambassadorWhatsAppUrl", () => {
  test("sem perfil usa a mensagem padrão original", () => {
    assert.equal(decodeURIComponent(ambassadorWhatsAppUrl(null)), decodeURIComponent(ORIGINAL));
  });
  test("perfis mantêm o mesmo número", () => {
    for (const p of ["criador", "entregador", "comunidade"] as const) {
      assert.equal(ambassadorWhatsAppUrl(p).startsWith("https://wa.me/5531983662706?text="), true);
    }
  });
  test("cada perfil tem mensagem própria", () => {
    assert.ok(decodeURIComponent(ambassadorWhatsAppUrl("criador")).includes("criador de conteúdo"));
    assert.ok(decodeURIComponent(ambassadorWhatsAppUrl("entregador")).includes("profissional de entregas"));
    assert.ok(decodeURIComponent(ambassadorWhatsAppUrl("comunidade")).includes("audiência"));
  });
});
