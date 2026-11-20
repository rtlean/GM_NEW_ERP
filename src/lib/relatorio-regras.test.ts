import { describe, expect, it } from "vitest";
import { aluguelPago, classificarCategoria, montarLinhaLocatario, montarRateio, resumoRelatorio, rotuloStatus, taxaDaLinha, type CobrancaRelatorio, type DespesaRelatorio } from "./relatorio-regras";

const cobranca = (over: Partial<CobrancaRelatorio> = {}): CobrancaRelatorio => ({
  contratoId: 1, locatario: "Inquilino A", imovel: "Casa 1", imovelId: 10, aluguelCentavos: 100000, pagoCentavos: 100000,
  pendenciaCentavos: 0, multaCentavos: 0, vencimento: "2026-11-10", dataPagamento: "2026-11-09", status: "paid", ...over,
});

describe("aluguel pago e taxa", () => {
  it("pagamento abate primeiro o aluguel", () => {
    expect(aluguelPago(120000, 100000)).toBe(100000);
    expect(aluguelPago(60000, 100000)).toBe(60000);
  });
  it("taxa de 10% sobre o aluguel pago, arredondada ao centavo", () => {
    expect(taxaDaLinha(185000, 1000)).toBe(18500);
    expect(taxaDaLinha(123455, 1000)).toBe(12346);
  });
  it("taxa 0% (acordo do locador) gera taxa zero", () => {
    expect(taxaDaLinha(100000, 0)).toBe(0);
  });
});

describe("classificarCategoria", () => {
  it("reconhece os nomes do banco, com ou sem acento e maiúscula", () => {
    expect(classificarCategoria("Água")).toBe("agua");
    expect(classificarCategoria("Consumo de Luz")).toBe("luz");
    expect(classificarCategoria("PINTURA")).toBe("pintura");
    expect(classificarCategoria("Condomínio")).toBe("limpeza");
    expect(classificarCategoria("Seguro")).toBe("seguro");
    expect(classificarCategoria("IPTU")).toBe("outra");
  });
});

describe("montarLinhaLocatario", () => {
  it("seguros ficam zerados e pintura vem das despesas do imóvel cobradas do inquilino", () => {
    const despesas: DespesaRelatorio[] = [{ categoria: "pintura", valorCentavos: 5000, imovelId: 10, cobrarDe: "tenant" }];
    const l = montarLinhaLocatario(cobranca(), 1, 1000, despesas);
    expect(l.seguroImovelCentavos).toBe(0);
    expect(l.seguroFiancaCentavos).toBe(0);
    expect(l.pinturaCentavos).toBe(5000);
  });
  it("total da linha = valor pago menos taxa; boleto = aluguel mais multa", () => {
    const l = montarLinhaLocatario(cobranca({ pagoCentavos: 100000, multaCentavos: 2000 }), 1, 1000, []);
    expect(l.taxaCentavos).toBe(10000);
    expect(l.totalCentavos).toBe(90000);
    expect(l.boletoCentavos).toBe(102000);
  });
});

describe("montarRateio", () => {
  it("separa água, luz e limpeza; valor pago para o rateio é o que passa do aluguel", () => {
    const despesas: DespesaRelatorio[] = [
      { categoria: "agua", valorCentavos: 3000, imovelId: 10, cobrarDe: "tenant" },
      { categoria: "luz", valorCentavos: 16387, imovelId: 10, cobrarDe: "tenant" },
    ];
    const r = montarRateio(cobranca({ pagoCentavos: 120000 }), 1, despesas);
    expect(r.aguaCentavos).toBe(3000);
    expect(r.luzCentavos).toBe(16387);
    expect(r.valorPagoCentavos).toBe(20000);
    expect(r.totalCentavos).toBe(119387);
  });
});

describe("resumoRelatorio", () => {
  it("soma previsto, recebido e taxa; a pagar desconta taxa e despesas do locador", () => {
    const linhas = [
      montarLinhaLocatario(cobranca({ aluguelCentavos: 200000, pagoCentavos: 200000 }), 1, 1000, []),
      montarLinhaLocatario(cobranca({ contratoId: 2, aluguelCentavos: 100000, pagoCentavos: 0, pendenciaCentavos: 100000, status: "open", dataPagamento: null }), 2, 1000, []),
    ];
    const r = resumoRelatorio(linhas, 5000, 1000);
    expect(r.totalPrevisto).toBe(300000);
    expect(r.totalRecebido).toBe(200000);
    expect(r.totalPendente).toBe(100000);
    expect(r.totalTaxas).toBe(20000);
    expect(r.totalAPagar).toBe(175000);
    expect(r.adimplentes).toBe(1);
    expect(r.comPendencias).toBe(1);
  });
  it("taxa 0% mantém o repasse igual ao recebido menos despesas", () => {
    const linhas = [montarLinhaLocatario(cobranca({ pagoCentavos: 2980800, aluguelCentavos: 2980800 }), 1, 0, [])];
    expect(resumoRelatorio(linhas, 0, 0).totalAPagar).toBe(2980800);
  });
});

describe("rotuloStatus", () => {
  it("traduz o status do banco", () => {
    expect(rotuloStatus("overdue")).toBe("Atrasado");
    expect(rotuloStatus("paid")).toBe("Pago");
  });
});
