import { describe, expect, it } from "vitest";
import { competenciaAtual, competenciaParaTexto, validarAlteracaoAluguel } from "./contratos-aluguel-regras";

const entrada = (competencia: string, valor: string, observacao = "") => ({ competencia, valor, observacao });

describe("competenciaAtual", () => {
  it("usa o mês de São Paulo, mesmo quando é UTC do mês seguinte", () => {
    // 1º de dezembro às 01:00 UTC ainda é 30 de novembro em São Paulo.
    expect(competenciaAtual(new Date("2026-12-01T01:00:00Z"))).toBe("2026-11");
    expect(competenciaAtual(new Date("2026-12-01T12:00:00Z"))).toBe("2026-12");
  });
});

describe("competenciaParaTexto", () => {
  it("mostra AAAA-MM como MM/AAAA", () => {
    expect(competenciaParaTexto("2027-03")).toBe("03/2027");
  });
});

describe("validarAlteracaoAluguel", () => {
  it("aceita o mês atual e meses futuros e converte o valor para centavos", () => {
    expect(validarAlteracaoAluguel(entrada("2026-11", "1.200,00"), "2026-11")).toEqual({
      ok: true,
      dados: { competencia: "2026-11", efetivaEm: "2026-11-01", rentCents: 120000, observacao: null },
    });
    const futuro = validarAlteracaoAluguel(entrada("2027-03", "1200", "  Reajuste anual  "), "2026-11");
    expect(futuro).toMatchObject({ ok: true, dados: { efetivaEm: "2027-03-01", rentCents: 120000, observacao: "Reajuste anual" } });
  });

  it("recusa mês anterior ao atual (sem retroativo)", () => {
    const r = validarAlteracaoAluguel(entrada("2026-10", "1200"), "2026-11");
    expect(r).toEqual({ ok: false, erros: { competencia: "Não é possível alterar um mês anterior ao atual." } });
  });

  it("recusa mês inválido e valor zero ou texto", () => {
    expect(validarAlteracaoAluguel(entrada("2027-13", "1200"), "2026-11")).toMatchObject({ ok: false, erros: { competencia: expect.any(String) } });
    expect(validarAlteracaoAluguel(entrada("2027-03", "0"), "2026-11")).toMatchObject({ ok: false, erros: { valor: expect.any(String) } });
    expect(validarAlteracaoAluguel(entrada("2027-03", "mil"), "2026-11")).toMatchObject({ ok: false, erros: { valor: expect.any(String) } });
  });

  it("limita a observação a 300 caracteres", () => {
    const r = validarAlteracaoAluguel(entrada("2027-03", "1200", "x".repeat(500)), "2026-11");
    expect(r.ok && r.dados.observacao?.length).toBe(300);
  });
});
