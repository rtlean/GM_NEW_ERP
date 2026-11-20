import { describe, expect, it } from "vitest";
import { barrasOrdenadas, categoriaDoTipo, montarPainel } from "./dashboard-regras";

describe("categoriaDoTipo", () => {
  it("agrupa tipos digitados de jeitos diferentes", () => {
    expect(categoriaDoTipo("KITNET")).toBe("Kitnet");
    expect(categoriaDoTipo("kitnet")).toBe("Kitnet");
    expect(categoriaDoTipo("APARTAMENTO 204 A")).toBe("Apartamento");
    expect(categoriaDoTipo("CASA DUPLEX")).toBe("Casa");
    expect(categoriaDoTipo("LOJA DE MOTOS ELETRICAS ( LOJA 01)")).toBe("Loja e ponto comercial");
    expect(categoriaDoTipo("PONTO COMERCIAL PADARIA")).toBe("Loja e ponto comercial");
    expect(categoriaDoTipo("SALA COMERCIAL 10")).toBe("Sala comercial");
    expect(categoriaDoTipo("GALPÃO 01")).toBe("Galpão");
    expect(categoriaDoTipo("GARAGEM 02")).toBe("Garagem");
  });

  it("tipo que não se encaixa vai para Outro, e tipo vazio para Não informado", () => {
    expect(categoriaDoTipo("BARBEARIA")).toBe("Outro");
    expect(categoriaDoTipo("CONSULTÓRIO ODONTOLÓGICO")).toBe("Outro");
    expect(categoriaDoTipo(null)).toBe("Não informado");
    expect(categoriaDoTipo("  ")).toBe("Não informado");
  });
});

describe("barrasOrdenadas", () => {
  it("ordena do maior para o menor e calcula a largura relativa", () => {
    const grupos = new Map([
      ["Casa", { centavos: 100, quantidade: 1 }],
      ["Galpão", { centavos: 400, quantidade: 2 }],
    ]);
    expect(barrasOrdenadas(grupos)).toEqual([
      { nome: "Galpão", centavos: 400, quantidade: 2, percentual: 100 },
      { nome: "Casa", centavos: 100, quantidade: 1, percentual: 25 },
    ]);
  });
});

describe("montarPainel", () => {
  const entrada = {
    imoveis: [
      { id: 1, tipo: "APARTAMENTO", ownerId: 10, aluguelCentavos: 100000 },
      { id: 2, tipo: "", ownerId: 10, aluguelCentavos: 0 },
      { id: 3, tipo: "GALPAO", ownerId: 11, aluguelCentavos: 500000 },
    ],
    locadores: [
      { id: 10, nome: "Maria Silva", taxaPropria: true, taxaBps: 500 },
      { id: 11, nome: "Carlos Souza", taxaPropria: false, taxaBps: null },
    ],
    locatarios: [
      { id: 100, nome: "Joao Pedro Lima", telefone: "5527999998888", taxaBps: null },
      { id: 101, nome: "João Pedro Lima", telefone: null, taxaBps: null },
      { id: 102, nome: "Ana Costa", telefone: "5527988887777", taxaBps: null },
    ],
    contratos: [
      { locatarioId: 100, propertyId: 1, aluguelCentavos: 100000, taxaPropria: false },
      { locatarioId: 101, propertyId: 3, aluguelCentavos: 450000, taxaPropria: false },
      { locatarioId: 102, propertyId: 1, aluguelCentavos: 0, taxaPropria: true },
    ],
  };

  it("soma só os contratos ativos recebidos e conta locadores", () => {
    const p = montarPainel(entrada);
    expect(p.totalCentavos).toBe(550000);
    expect(p.quantidadeContratos).toBe(3);
    expect(p.quantidadeLocadores).toBe(2);
  });

  it("aponta valores a conferir: aluguel diferente do imóvel e aluguel zerado", () => {
    const valores = montarPainel(entrada).acoes.find((a) => a.titulo === "Valores a conferir");
    expect(valores?.quantidade).toBe(2);
    expect(valores?.descricao).toBe("1 contratos com aluguel diferente do imóvel. 1 sem valor.");
  });

  it("aponta possíveis duplicidades por nome parecido e cadastros incompletos", () => {
    const p = montarPainel(entrada);
    expect(p.acoes.find((a) => a.titulo === "Possíveis duplicidades")?.quantidade).toBe(2);
    expect(p.acoes.find((a) => a.titulo === "Cadastros incompletos")?.descricao).toBe("1 locatários sem telefone e 1 imóveis sem tipo.");
  });

  it("conta contratos sem taxa em nenhum cadastro e os que usam a taxa do locador", () => {
    const taxa = montarPainel(entrada).acoes.find((a) => a.titulo === "Taxa de administração");
    expect(taxa?.descricao).toBe("1 contratos sem taxa em nenhum cadastro. 1 usam a taxa do locador.");
  });

  it("agrupa tipos por categoria e ranqueia locadores pelo aluguel", () => {
    const p = montarPainel(entrada);
    expect(p.tipos.map((t) => t.nome)).toEqual(["Galpão", "Apartamento"]);
    expect(p.tipos[0].percentual).toBe(100);
    expect(p.locadoresTop.map((l) => [l.nome, l.centavos])).toEqual([
      ["Carlos Souza", 450000],
      ["Maria Silva", 100000],
    ]);
  });

  it("registros a revisar soma os itens das ações", () => {
    const p = montarPainel(entrada);
    expect(p.registrosARevisar).toBe(2 + 2 + 1 + 1);
  });
});
