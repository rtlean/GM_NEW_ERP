import { describe, expect, it } from "vitest";
import { reaisParaCentavos, validarImovel, type EntradaImovel } from "./cadastro-imovel";

const base: EntradaImovel = {
  ownerId: "19",
  tipo: "Apartamento",
  situacao: "vacant",
  endereco: "Rua Inêz Francisqueto Quitiba",
  numero: "120",
  complemento: "",
  bairro: "Centro",
  cep: "29700-000",
  cidade: "Linhares",
  uf: "es",
  aluguel: "1.200,50",
  caracteristicas: "",
};

describe("reaisParaCentavos", () => {
  it("converte valor com milhar e centavos", () => {
    expect(reaisParaCentavos("1.200,50")).toEqual({ ok: true, valor: 120050 });
  });
  it("vazio vira zero", () => {
    expect(reaisParaCentavos("")).toEqual({ ok: true, valor: 0 });
  });
  it("recusa texto", () => {
    expect(reaisParaCentavos("mil").ok).toBe(false);
  });
});

describe("validarImovel", () => {
  it("aceita imóvel com locador, endereço e aluguel", () => {
    const r = validarImovel(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.dados.owner_id).toBe(19);
      expect(r.dados.state).toBe("ES");
      expect(r.dados.zip_code).toBe("29700000");
      expect(r.dados.rent_cents).toBe(120050);
      expect(r.dados.occupancy_status).toBe("vacant");
    }
  });

  it("exige locador, tipo, endereço e cidade", () => {
    const r = validarImovel({ ...base, ownerId: "", tipo: "Outro-x", endereco: " ", cidade: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erros.ownerId).toBeDefined();
      expect(r.erros.tipo).toBeDefined();
      expect(r.erros.endereco).toBeDefined();
      expect(r.erros.cidade).toBeDefined();
    }
  });

  it("não aceita 'alugado' escolhido à mão", () => {
    const r = validarImovel({ ...base, situacao: "occupied" });
    expect(r.ok).toBe(false);
  });

  it("mantém 'alugado' só quando já estava alugado", () => {
    const r = validarImovel({ ...base, situacao: "occupied" }, "occupied");
    expect(r.ok && r.dados.occupancy_status).toBe("occupied");
  });

  it("CEP incompleto é recusado", () => {
    const r = validarImovel({ ...base, cep: "29700" });
    expect(r.ok).toBe(false);
  });
});
