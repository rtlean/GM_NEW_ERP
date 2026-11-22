import { describe, expect, it } from "vitest";
import { AUTOMACOES, MODELOS_MENSAGEM } from "./whatsapp-regras";

describe("dados do design", () => {
  it("tem os 5 modelos e as 6 automações do design", () => {
    expect(MODELOS_MENSAGEM).toHaveLength(5);
    expect(AUTOMACOES).toHaveLength(6);
  });
});
