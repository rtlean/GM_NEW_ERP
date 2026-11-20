import { describe, expect, it } from "vitest";
import { CAMPOS_DO_PROGRESSO, TIPOS_DE_IMOVEL, camposFaltando, percentualDoCadastro } from "./cadastro-imovel";

const tudo = Object.fromEntries(CAMPOS_DO_PROGRESSO.map((c) => [c, true])) as Record<(typeof CAMPOS_DO_PROGRESSO)[number], boolean>;

describe("progresso do cadastro", () => {
  it("100% quando todos os campos estão preenchidos", () => {
    expect(percentualDoCadastro(tudo)).toBe(100);
    expect(camposFaltando(tudo)).toEqual([]);
  });
  it("lista o que falta em português, na ordem do design", () => {
    const parcial = { ...tudo, cep: false, aluguel: false };
    expect(camposFaltando(parcial)).toEqual(["CEP", "aluguel"]);
    expect(percentualDoCadastro(parcial)).toBe(60);
  });
  it("tipo Consultório volta para a lista", () => {
    expect(TIPOS_DE_IMOVEL).toContain("Consultório");
  });
});
