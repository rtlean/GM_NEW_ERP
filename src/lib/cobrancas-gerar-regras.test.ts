import { describe, expect, it } from "vitest";
import { DIA_VENCIMENTO, planejarCobrancas, vencimentoDaCompetencia, type ContratoParaCobranca } from "./cobrancas-gerar-regras";

const contrato = (id: number, aluguelCentavos: number): ContratoParaCobranca => ({
  id,
  ownerId: 30,
  tenantId: 7,
  propertyId: 100 + id,
  aluguelCentavos,
});

describe("vencimento", () => {
  it("usa sempre o dia 10 da competência", () => {
    expect(DIA_VENCIMENTO).toBe(10);
    expect(vencimentoDaCompetencia("2026-12")).toBe("2026-12-10");
  });
});

describe("planejarCobrancas", () => {
  it("cria uma cobrança por contrato sem cobrança no mês, com o aluguel informado", () => {
    const r = planejarCobrancas([contrato(1, 150000), contrato(2, 200050)], "2026-12", new Set());
    expect(r).toEqual({
      ok: true,
      plano: {
        criar: [
          { contratoId: 1, ownerId: 30, tenantId: 7, propertyId: 101, competencia: "2026-12", vencimento: "2026-12-10", aluguelCentavos: 150000 },
          { contratoId: 2, ownerId: 30, tenantId: 7, propertyId: 102, competencia: "2026-12", vencimento: "2026-12-10", aluguelCentavos: 200050 },
        ],
        jaExistentes: 0,
        totalCentavos: 350050,
      },
    });
  });

  it("não cria de novo para contrato que já tem cobrança naquele mês (não duplica)", () => {
    const r = planejarCobrancas([contrato(1, 150000), contrato(2, 200000)], "2026-11", new Set([1]));
    expect(r).toMatchObject({ ok: true, plano: { jaExistentes: 1, totalCentavos: 200000 } });
    if (r.ok) expect(r.plano.criar.map((c) => c.contratoId)).toEqual([2]);
  });

  it("gerar de novo quando tudo já existe não cria nada", () => {
    const r = planejarCobrancas([contrato(1, 150000)], "2026-11", new Set([1]));
    expect(r).toMatchObject({ ok: true, plano: { criar: [], jaExistentes: 1, totalCentavos: 0 } });
  });

  it("aluguel zero ou inválido não gera cobrança", () => {
    const r = planejarCobrancas([contrato(1, 0), contrato(2, -100), contrato(3, 12.5), contrato(4, 90000)], "2026-12", new Set());
    if (r.ok) expect(r.plano.criar.map((c) => c.contratoId)).toEqual([4]);
  });

  it("recusa competência inválida", () => {
    expect(planejarCobrancas([contrato(1, 1000)], "2026-13", new Set())).toEqual({ ok: false, erro: "Competência inválida." });
  });
});
