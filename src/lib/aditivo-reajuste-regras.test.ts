import { describe, expect, it } from "vitest";
import { dataBR, dataPorExtenso, documentoFormatado, lerObservacaoReajuste, montarLinhasAditivo } from "./aditivo-reajuste-regras";

const base = {
  contratoId: 12,
  locadorNome: "Carla Casagrande",
  locadorDocumento: "12345678909",
  locatarioNome: "Marina Couto",
  locatarioDocumento: "98765432100",
  imovel: "Apartamento · 0003",
  indice: "IPCA",
  percentual: "4,50",
  anteriorCentavos: 280000,
  novoCentavos: 292600,
  dataEfetiva: "2026-12-01",
};

describe("aditivo de reajuste", () => {
  it("formata datas e documentos", () => {
    expect(dataBR("2026-12-01")).toBe("01/12/2026");
    expect(dataPorExtenso("2026-12-01")).toBe("1 de dezembro de 2026");
    expect(documentoFormatado("12345678909")).toBe("123.456.789-09");
    expect(documentoFormatado("55816252000185")).toBe("55.816.252/0001-85");
    expect(documentoFormatado(null)).toBe("");
  });
  it("monta cláusula com valores e data", () => {
    const texto = montarLinhasAditivo(base).map((l) => l.texto).join("\n");
    expect(texto).toContain("Cláusula 1ª");
    expect(texto).toContain("R$ 2.800,00");
    expect(texto).toContain("R$ 2.926,00");
    expect(texto).toContain("01/12/2026");
    expect(texto).toContain("IPCA de 4,50%");
    expect(texto).toContain("CNPJ 55.816.252/0001-85");
    expect(texto).toContain("Rio Bananal/ES, 1 de dezembro de 2026");
  });
  it("não tem testemunhas", () => {
    const texto = montarLinhasAditivo(base).map((l) => l.texto).join("\n");
    expect(texto.toLowerCase()).not.toContain("testemunha");
  });
  it("lê índice e percentual da observação do reajuste", () => {
    expect(lerObservacaoReajuste("Reajuste IGP-M 3,20%")).toEqual({ indice: "IGP-M", percentual: "3,20" });
    expect(lerObservacaoReajuste("Alteração manual")).toBeNull();
    expect(lerObservacaoReajuste(null)).toBeNull();
  });
});
