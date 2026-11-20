import { describe, expect, it } from "vitest";
import { paraEntrada, reaisParaCentavos, validarImovel, type EntradaImovel, type LinhaImovel } from "./cadastro-imovel";

const base: EntradaImovel = {
  ownerId: "19",
  nome: "",
  tipo: "Apartamento",
  finalidade: "Locação",
  situacao: "vacant",
  cep: "29700-000",
  endereco: "Rua Inêz Francisqueto Quitiba",
  numero: "120",
  complemento: "",
  bairro: "Centro",
  cidade: "Linhares",
  uf: "es",
  matricula: "",
  inscricaoIptu: "",
  quartos: "",
  suites: "",
  banheiros: "",
  vagas: "",
  areaUtil: "",
  areaTotal: "",
  andar: "",
  mobilia: "",
  pets: "",
  comodidades: [],
  aluguel: "1.200,50",
  valorVenda: "",
  condominio: "",
  iptu: "",
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
      expect(r.dados.sale_value_cents).toBeNull();
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
    expect(validarImovel({ ...base, situacao: "occupied" }).ok).toBe(false);
  });

  it("mantém 'alugado' só quando já estava alugado", () => {
    const r = validarImovel({ ...base, situacao: "occupied" }, "occupied");
    expect(r.ok && r.dados.occupancy_status).toBe("occupied");
  });

  it("CEP incompleto é recusado", () => {
    expect(validarImovel({ ...base, cep: "29700" }).ok).toBe(false);
  });

  it("aceita 'Vendido' e tipo Consultório", () => {
    const r = validarImovel({ ...base, situacao: "sold", tipo: "Consultório" });
    expect(r.ok && r.dados.occupancy_status).toBe("sold");
  });

  it("grava quantidades, áreas e valores opcionais", () => {
    const r = validarImovel({
      ...base,
      quartos: "2",
      suites: "1",
      banheiros: "2",
      vagas: "1",
      areaUtil: "65,5",
      areaTotal: "80",
      valorVenda: "250.000",
      condominio: "350",
      iptu: "1.200,00",
      comodidades: ["Elevador", "Inventada"],
      mobilia: "Mobiliado",
      pets: "Sim",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.dados.bedrooms).toBe(2);
      expect(r.dados.useful_area_m2).toBe(65.5);
      expect(r.dados.sale_value_cents).toBe(25000000);
      expect(r.dados.condominium_cents).toBe(35000);
      expect(r.dados.iptu_cents).toBe(120000);
      expect(r.dados.amenities).toEqual(["Elevador"]);
    }
  });

  it("recusa números inválidos", () => {
    const r = validarImovel({ ...base, quartos: "dois", areaUtil: "abc" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erros.quartos).toBeDefined();
      expect(r.erros.areaUtil).toBeDefined();
    }
  });
});

describe("paraEntrada", () => {
  it("converte a linha do banco para o formulário", () => {
    const linha: LinhaImovel = {
      owner_id: 19, name: "Sala 08", type: "Sala comercial", finality: "Locação", occupancy_status: "vacant",
      zip_code: "29700000", address: "Rua X", numero: "1", complemento: null, bairro: "Centro", city: "Linhares", state: "ES",
      matricula: "123", iptu_registration: "456", bedrooms: 2, suites: null, bathrooms: 1, parking_spots: null,
      useful_area_m2: 65.5, total_area_m2: null, floor: null, furnishing: "Mobiliado", pets_allowed: "Sim", amenities: ["Elevador"],
      rent_cents: 120050, sale_value_cents: null, condominium_cents: null, iptu_cents: 99000,
    };
    const e = paraEntrada(linha);
    expect(e.aluguel).toBe("1.200,50");
    expect(e.areaUtil).toBe("65,5");
    expect(e.iptu).toBe("990,00");
    expect(e.comodidades).toEqual(["Elevador"]);
  });
});
