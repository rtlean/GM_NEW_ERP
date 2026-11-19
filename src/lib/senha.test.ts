import { describe, expect, it } from "vitest";
import { gerarSenhaProvisoria, senhaAtendeRegras } from "./senha";

describe("gerarSenhaProvisoria", () => {
  it("gera senhas que atendem a regra do design", () => {
    for (let i = 0; i < 50; i++) {
      expect(senhaAtendeRegras(gerarSenhaProvisoria())).toBe(true);
    }
  });

  it("gera senhas diferentes", () => {
    expect(gerarSenhaProvisoria()).not.toBe(gerarSenhaProvisoria());
  });
});

describe("senhaAtendeRegras", () => {
  it("aceita 10+ caracteres com letra e número", () => {
    expect(senhaAtendeRegras("abcdefgh12")).toBe(true);
  });

  it("recusa senha curta, só letras, só números ou com símbolo", () => {
    expect(senhaAtendeRegras("abc12")).toBe(false);
    expect(senhaAtendeRegras("abcdefghijk")).toBe(false);
    expect(senhaAtendeRegras("1234567890")).toBe(false);
    expect(senhaAtendeRegras("abcdefgh1!")).toBe(false);
  });
});
