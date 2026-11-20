import { describe, expect, it } from "vitest";
import { CAMPOS_DO_PROGRESSO, camposFaltando, percentualDoCadastro, type CampoProgresso } from "./cadastro-imovel";

const tudo = Object.fromEntries(CAMPOS_DO_PROGRESSO.map((c) => [c, true])) as Record<CampoProgresso, boolean>;

describe("progresso do cadastro", () => {
  it("100% quando todos os campos estão preenchidos", () => {
    expect(percentualDoCadastro(tudo)).toBe(100);
    expect(camposFaltando(tudo)).toEqual([]);
  });
  it("lista o que falta em português, na ordem do design", () => {
    const parcial = { ...tudo, cep: false, aluguel: false };
    expect(camposFaltando(parcial)).toEqual(["CEP", "valor"]);
    expect(percentualDoCadastro(parcial)).toBe(83);
  });
});
