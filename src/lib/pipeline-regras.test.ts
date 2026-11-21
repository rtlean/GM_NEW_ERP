import { describe, expect, it } from "vitest";
import { ehEtapa, etapaVizinha, filtrarPorBusca, resumoPipeline, validarNovoLead, valorParaCentavos } from "./pipeline-regras";

describe("valorParaCentavos", () => {
  it("converte texto em centavos sem ponto flutuante", () => {
    expect(valorParaCentavos("2500")).toBe(250000);
    expect(valorParaCentavos("2500,5")).toBe(250050);
    expect(valorParaCentavos("2500.50")).toBe(250050);
    expect(valorParaCentavos("0.10")).toBe(10);
  });

  it("recusa zero, negativo, texto e mais de 2 casas", () => {
    expect(valorParaCentavos("0")).toBeNull();
    expect(valorParaCentavos("-10")).toBeNull();
    expect(valorParaCentavos("abc")).toBeNull();
    expect(valorParaCentavos("10.555")).toBeNull();
    expect(valorParaCentavos("")).toBeNull();
  });
});

describe("validarNovoLead", () => {
  it("aceita um lead completo e devolve centavos", () => {
    const r = validarNovoLead({ nome: "  Renata Souza ", tipo: "Locação", valor: "2500", imovel: " Ap. 2 quartos " });
    expect(r).toEqual({
      ok: true,
      lead: { nome: "Renata Souza", tipo: "Locação", valorCentavos: 250000, imovel: "Ap. 2 quartos" },
    });
  });

  it("imóvel vazio vira null", () => {
    const r = validarNovoLead({ nome: "Bruno", tipo: "Venda", valor: "680000", imovel: "  " });
    expect(r.ok && r.lead.imovel).toBeNull();
  });

  it("aponta cada erro no campo certo", () => {
    const r = validarNovoLead({ nome: "  ", tipo: "Outro", valor: "0" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.erros).sort()).toEqual(["nome", "tipo", "valor"]);
  });

  it("recusa nome com mais de 120 caracteres", () => {
    const r = validarNovoLead({ nome: "a".repeat(121), tipo: "Locação", valor: "100" });
    expect(r.ok).toBe(false);
  });
});

describe("etapaVizinha", () => {
  it("anda uma etapa para frente e para trás", () => {
    expect(etapaVizinha("Prospecção", 1)).toBe("Visita");
    expect(etapaVizinha("Proposta", -1)).toBe("Visita");
  });

  it("não passa da primeira nem da última coluna (Lead Frio)", () => {
    expect(etapaVizinha("Prospecção", -1)).toBeNull();
    expect(etapaVizinha("Lead Frio", 1)).toBeNull();
  });

  it("Lead Frio fica no fim do fluxo: Fechamento avança para ele, e ele volta para Fechamento", () => {
    expect(etapaVizinha("Fechamento", 1)).toBe("Lead Frio");
    expect(etapaVizinha("Lead Frio", -1)).toBe("Fechamento");
    expect(ehEtapa("Lead Frio")).toBe(true);
  });
});

describe("resumoPipeline", () => {
  it("soma quantidade e valor; vazio dá zero", () => {
    expect(resumoPipeline([])).toEqual({ quantidade: 0, totalCentavos: 0 });
    expect(resumoPipeline([{ valorCentavos: 250000 }, { valorCentavos: 120050 }])).toEqual({ quantidade: 2, totalCentavos: 370050 });
  });
});

describe("filtrarPorBusca", () => {
  const negocios = [
    { nome: "Renata Souza", imovel: "Ap. 2 quartos, Centro" },
    { nome: "José Mendes", imovel: null },
  ];

  it("busca sem diferença de maiúsculas e acentos, no cliente ou no imóvel", () => {
    expect(filtrarPorBusca(negocios, "RENATA")).toHaveLength(1);
    expect(filtrarPorBusca(negocios, "jose")).toHaveLength(1);
    expect(filtrarPorBusca(negocios, "centro")).toHaveLength(1);
  });

  it("busca vazia devolve tudo", () => {
    expect(filtrarPorBusca(negocios, "   ")).toHaveLength(2);
  });
});
