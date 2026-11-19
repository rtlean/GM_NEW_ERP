import { describe, expect, it } from "vitest";
import { aluguelVigente, type MudancaAluguel } from "./aluguel";

const contrato = { rent_cents: 100000, start_date: "2026-01-10" };
const aumento: MudancaAluguel = { id: 1, rent_cents: 120000, effective_date: "2027-03-01" };

describe("aluguelVigente", () => {
  it("usa o aluguel original quando não há mudança", () => {
    expect(aluguelVigente(contrato, [], "2026-06")).toBe(100000);
  });

  it("mantém o valor antigo antes da mudança e troca no mês inteiro da mudança", () => {
    expect(aluguelVigente(contrato, [aumento], "2027-02")).toBe(100000);
    expect(aluguelVigente(contrato, [aumento], "2027-03")).toBe(120000);
    expect(aluguelVigente(contrato, [aumento], "2027-04")).toBe(120000);
  });

  it("aceita mudança com data no meio do mês, valendo a partir do mês seguinte à data", () => {
    const meio = { id: 2, rent_cents: 130000, effective_date: "2027-03-15" };
    expect(aluguelVigente(contrato, [meio], "2027-03")).toBe(100000);
    expect(aluguelVigente(contrato, [meio], "2027-04")).toBe(130000);
  });

  it("usa a mudança mais recente quando há mais de uma", () => {
    const segundo = { id: 3, rent_cents: 150000, effective_date: "2027-09-01" };
    expect(aluguelVigente(contrato, [segundo, aumento], "2027-08")).toBe(120000);
    expect(aluguelVigente(contrato, [segundo, aumento], "2027-10")).toBe(150000);
  });

  it("em datas iguais, vale a mudança cadastrada por último", () => {
    const outra = { id: 9, rent_cents: 125000, effective_date: "2027-03-01" };
    expect(aluguelVigente(contrato, [aumento, outra], "2027-03")).toBe(125000);
  });

  it("devolve sem valor para meses anteriores ao início do contrato", () => {
    expect(aluguelVigente(contrato, [], "2025-12")).toBeNull();
  });

  it("aceita início do contrato como data com horário (fuso de São Paulo)", () => {
    const comHorario = { rent_cents: 100000, start_date: "2026-01-10T03:00:00.000Z" };
    expect(aluguelVigente(comHorario, [], "2026-01")).toBe(100000);
  });

  it("recusa competência fora do formato AAAA-MM", () => {
    expect(() => aluguelVigente(contrato, [], "03/2027")).toThrow(/AAAA-MM/);
    expect(() => aluguelVigente(contrato, [], "2027-13")).toThrow(/AAAA-MM/);
  });
});
