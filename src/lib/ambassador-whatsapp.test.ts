import { describe, expect, test } from "bun:test";
import { ambassadorWhatsAppUrl } from "./ambassador-whatsapp";

const ORIGINAL =
  "https://wa.me/5531983662706?text=Ol%C3%A1!%20Tenho%20interesse%20em%20me%20tornar%20embaixador%20do%20Gest%C3%A3o%20Motoca%20Pro.%20Gostaria%20de%20conhecer%20o%20programa%20e%20como%20come%C3%A7ar.";

describe("ambassadorWhatsAppUrl", () => {
  test("sem perfil usa a mensagem padrão original", () => {
    expect(decodeURIComponent(ambassadorWhatsAppUrl(null))).toBe(decodeURIComponent(ORIGINAL));
  });
  test("perfis mantêm o mesmo número", () => {
    for (const p of ["criador", "entregador", "comunidade"] as const) {
      expect(ambassadorWhatsAppUrl(p).startsWith("https://wa.me/5531983662706?text=")).toBe(true);
    }
  });
  test("cada perfil tem mensagem própria", () => {
    expect(decodeURIComponent(ambassadorWhatsAppUrl("criador"))).toContain("criador de conteúdo");
    expect(decodeURIComponent(ambassadorWhatsAppUrl("entregador"))).toContain("profissional de entregas");
    expect(decodeURIComponent(ambassadorWhatsAppUrl("comunidade"))).toContain("audiência");
  });
});
