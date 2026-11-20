import { describe, expect, it } from "vitest";
import { bpsParaTexto, dentroDaJanela, novoAluguelCentavos, percentualParaBps, proximoAniversario, validarReajuste } from "./reajustes-regras";

describe("proximoAniversario", () => {
  it("usa o mesmo dia do início no mês atual, se ainda não passou", () => {
    expect(proximoAniversario("2024-12-10", "2026-11-20")).toBe("2026-12-10");
  });
  it("vai para o próximo mês quando o dia já passou", () => {
    expect(proximoAniversario("2024-05-05", "2026-11-20")).toBe("2026-12-05");
  });
  it("vai para o ano seguinte em dezembro", () => {
    expect(proximoAniversario("2024-03-02", "2026-12-20")).toBe("2027-01-02");
  });
  it("dia 31 cai no último dia de mês curto", () => {
    expect(proximoAniversario("2024-01-31", "2026-02-01")).toBe("2026-02-28");
  });
  it("hoje é o próprio aniversário", () => {
    expect(proximoAniversario("2024-11-20", "2026-11-20")).toBe("2026-11-20");
  });
});

describe("percentual e novo valor", () => {
  it("aceita vírgula e ponto, converte para basis points", () => {
    expect(percentualParaBps("4,5")).toEqual({ ok: true, bps: 450 });
    expect(percentualParaBps("4,50")).toEqual({ ok: true, bps: 450 });
    expect(percentualParaBps("3.20")).toEqual({ ok: true, bps: 320 });
  });
  it("recusa valor zero, negativo, grande demais ou com texto", () => {
    expect(percentualParaBps("0")).toMatchObject({ ok: false });
    expect(percentualParaBps("101")).toMatchObject({ ok: false });
    expect(percentualParaBps("abc")).toMatchObject({ ok: false });
    expect(percentualParaBps("4,123")).toMatchObject({ ok: false });
  });
  it("formata o percentual de volta", () => {
    expect(bpsParaTexto(450)).toBe("4,50");
  });
  it("calcula o novo aluguel em centavos, arredondado", () => {
    expect(novoAluguelCentavos(280000, 450)).toBe(292600);
    expect(novoAluguelCentavos(195000, 450)).toBe(203775);
    expect(novoAluguelCentavos(100001, 0)).toBe(100001);
  });
});

describe("validarReajuste", () => {
  it("calcula valor, data e competência pelo próximo aniversário", () => {
    const r = validarReajuste({ percentual: "4,50", indice: "IPCA" }, { aluguelCentavos: 280000, inicio: "2024-12-01" }, "2026-11-20");
    expect(r).toEqual({
      ok: true,
      dados: {
        percentualBps: 450,
        indice: "IPCA",
        anteriorCentavos: 280000,
        novoCentavos: 292600,
        dataEfetiva: "2026-12-01",
        competencia: "2026-12",
        observacao: "Reajuste IPCA 4,50%",
      },
    });
  });
  it("recusa índice desconhecido e contrato sem aluguel", () => {
    expect(validarReajuste({ percentual: "4", indice: "Outro índice" }, { aluguelCentavos: 1000, inicio: "2024-12-01" }, "2026-11-20")).toMatchObject({ ok: false, erros: { indice: expect.any(String) } });
    expect(validarReajuste({ percentual: "4", indice: "IPCA" }, { aluguelCentavos: 0, inicio: "2024-12-01" }, "2026-11-20")).toMatchObject({ ok: false });
  });
});

describe("janela da lista", () => {
  it("mostra aniversário em até 60 dias, inclusive hoje", () => {
    expect(dentroDaJanela("2026-11-20", "2026-11-20")).toBe(true);
    expect(dentroDaJanela("2027-01-19", "2026-11-20")).toBe(true);
    expect(dentroDaJanela("2027-01-20", "2026-11-20")).toBe(false);
  });
});
