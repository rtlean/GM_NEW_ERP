import { describe, expect, it } from "vitest";
import { competenciaParaTexto, competenciaValida, totalCentavos, validarLancamento, type EntradaLancamento } from "./lancamentos-regras";

const ok: EntradaLancamento = {
  categoriaId: "7",
  imovelId: "",
  valor: "350,50",
  data: "2026-11-10",
  cobrarDe: "locador",
  descricao: "  Troca de torneira  ",
  observacao: "",
};
const ativas = [7, 14];

describe("validarLancamento", () => {
  it("aceita lançamento completo, sem imóvel, e converte para centavos", () => {
    expect(validarLancamento(ok, ativas)).toEqual({
      ok: true,
      dados: { categoriaId: 7, imovelId: null, valorCentavos: 35050, data: "2026-11-10", cobrarDe: "owner", descricao: "Troca de torneira", observacao: null },
    });
  });

  it("converte 'locatário' para tenant e aceita imóvel", () => {
    const r = validarLancamento({ ...ok, imovelId: "42", cobrarDe: "locatario" }, ativas);
    expect(r).toMatchObject({ ok: true, dados: { imovelId: 42, cobrarDe: "tenant" } });
  });

  it("recusa categoria que não está entre as ativas", () => {
    expect(validarLancamento({ ...ok, categoriaId: "99" }, ativas)).toMatchObject({ ok: false, erros: { categoriaId: expect.any(String) } });
  });

  it("recusa valor zero, texto e data inválida", () => {
    expect(validarLancamento({ ...ok, valor: "0" }, ativas)).toMatchObject({ ok: false, erros: { valor: expect.any(String) } });
    expect(validarLancamento({ ...ok, valor: "muito" }, ativas)).toMatchObject({ ok: false, erros: { valor: expect.any(String) } });
    expect(validarLancamento({ ...ok, data: "2026-02-30" }, ativas)).toMatchObject({ ok: false, erros: { data: expect.any(String) } });
  });

  it("recusa 'Imobiliária' e quem paga desconhecido", () => {
    expect(validarLancamento({ ...ok, cobrarDe: "imobiliaria" }, ativas)).toMatchObject({ ok: false, erros: { cobrarDe: expect.any(String) } });
  });

  it("exige descrição e limita tamanho", () => {
    expect(validarLancamento({ ...ok, descricao: "   " }, ativas)).toMatchObject({ ok: false, erros: { descricao: expect.any(String) } });
    expect(validarLancamento({ ...ok, descricao: "x".repeat(201) }, ativas)).toMatchObject({ ok: false, erros: { descricao: expect.any(String) } });
  });
});

describe("competência e totais", () => {
  it("valida AAAA-MM e mostra MM/AAAA", () => {
    expect(competenciaValida("2026-11")).toBe(true);
    expect(competenciaValida("2026-13")).toBe(false);
    expect(competenciaParaTexto("2026-11")).toBe("11/2026");
  });
  it("soma centavos sem arredondar", () => {
    expect(totalCentavos([35050, 1, 99])).toBe(35150);
    expect(totalCentavos([])).toBe(0);
  });
});
