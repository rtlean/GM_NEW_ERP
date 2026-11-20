import { describe, expect, it } from "vitest";
import { dataValida, percentualParaBps, taxaPadrao, validarContrato, type EntradaContrato } from "./contratos-regras";

const base: EntradaContrato = { aluguel: "1.500,00", dia: "10", inicio: "2027-03-01", fim: "", indice: "IGP-M", garantia: "Caução", taxa: "10" };

describe("dataValida", () => {
  it("aceita data real e rejeita data que não existe", () => {
    expect(dataValida("2027-02-28")).toBe(true);
    expect(dataValida("2026-02-30")).toBe(false);
    expect(dataValida("28/02/2027")).toBe(false);
  });
});

describe("percentualParaBps", () => {
  it("converte percentual para basis points", () => {
    expect(percentualParaBps("10")).toEqual({ ok: true, bps: 1000 });
    expect(percentualParaBps("7,5")).toEqual({ ok: true, bps: 750 });
    expect(percentualParaBps("0")).toEqual({ ok: true, bps: 0 });
  });
  it("rejeita valor acima de 100 e texto", () => {
    expect(percentualParaBps("101").ok).toBe(false);
    expect(percentualParaBps("dez").ok).toBe(false);
  });
});

describe("taxaPadrao", () => {
  it("usa a do locador, depois a do locatário, depois 10%", () => {
    expect(taxaPadrao(500, 800)).toBe(500);
    expect(taxaPadrao(0, 800)).toBe(800);
    expect(taxaPadrao(null, null)).toBe(1000);
    expect(taxaPadrao(0, 0)).toBe(1000);
  });
});

describe("validarContrato", () => {
  it("aceita um contrato completo e converte valores", () => {
    const r = validarContrato(base);
    expect(r).toEqual({
      ok: true,
      dados: { rentCents: 150000, dueDay: 10, inicio: "2027-03-01", fim: null, indice: "IGP-M", garantia: "Caução", taxaBps: 1000 },
    });
  });

  it("exige aluguel maior que zero e dia de 1 a 28", () => {
    const r = validarContrato({ ...base, aluguel: "0", dia: "29" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erros.aluguel).toBeDefined();
      expect(r.erros.dia).toBe("O dia do vencimento vai de 1 a 28.");
    }
  });

  it("não aceita fim antes do início", () => {
    const r = validarContrato({ ...base, fim: "2027-02-01" });
    expect(!r.ok && r.erros.fim).toBe("A data de fim não pode ser antes do início.");
  });

  it("aceita fim igual ao início e garantia/índice vazios", () => {
    const r = validarContrato({ ...base, fim: "2027-03-01", indice: "", garantia: "" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.dados.indice).toBeNull();
  });

  it("rejeita índice ou garantia fora da lista", () => {
    const r = validarContrato({ ...base, indice: "Selic", garantia: "Pix" });
    expect(!r.ok && Object.keys(r.erros)).toEqual(expect.arrayContaining(["indice", "garantia"]));
  });
});
