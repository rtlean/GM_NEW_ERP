import { describe, expect, it } from "vitest";
import { calcularRepasse, podeLiberar, TAXA_PADRAO_BPS } from "./repasses-regras";

describe("calcularRepasse", () => {
  it("usa 10% sobre o aluguel quando o locador não tem taxa própria", () => {
    expect(calcularRepasse({ recebidoCentavos: 280000, aluguelPagoCentavos: 280000, taxaBps: null, despesasCentavos: 0 })).toEqual({ taxaCentavos: 28000, repasseCentavos: 252000, taxaBps: TAXA_PADRAO_BPS });
  });
  it("não cobra taxa sobre multa e seguro", () => {
    // Recebeu 300.000 no total, mas só 280.000 é aluguel: taxa 28.000, repasse 272.000
    expect(calcularRepasse({ recebidoCentavos: 300000, aluguelPagoCentavos: 280000, taxaBps: 1000, despesasCentavos: 0 })).toMatchObject({ taxaCentavos: 28000, repasseCentavos: 272000 });
  });
  it("desconta despesas cobradas do locador", () => {
    expect(calcularRepasse({ recebidoCentavos: 280000, aluguelPagoCentavos: 280000, taxaBps: 1000, despesasCentavos: 15050 })).toMatchObject({ taxaCentavos: 28000, repasseCentavos: 236950 });
  });
  it("arredonda a taxa para o centavo", () => {
    expect(calcularRepasse({ recebidoCentavos: 100001, aluguelPagoCentavos: 100001, taxaBps: 1000, despesasCentavos: 0 }).taxaCentavos).toBe(10000);
  });
  it("aceita taxa própria do locador", () => {
    expect(calcularRepasse({ recebidoCentavos: 100000, aluguelPagoCentavos: 100000, taxaBps: 800, despesasCentavos: 0 }).taxaCentavos).toBe(8000);
  });
});

describe("podeLiberar", () => {
  it("bloqueia quando já tem repasse", () => {
    expect(podeLiberar(1000, true)).toMatchObject({ ok: false });
  });
  it("bloqueia valor zero ou negativo", () => {
    expect(podeLiberar(0, false)).toMatchObject({ ok: false });
    expect(podeLiberar(-50, false)).toMatchObject({ ok: false });
  });
  it("libera valor positivo sem repasse", () => {
    expect(podeLiberar(1, false)).toEqual({ ok: true });
  });
});
