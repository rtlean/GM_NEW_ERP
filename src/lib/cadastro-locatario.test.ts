import { describe, expect, it } from "vitest";
import { distanciaEntreTextos, nomesParecidos, validarLocatario, type EntradaLocatario } from "./cadastro-locatario";

const base: EntradaLocatario = {
  nome: "Camilo Santos",
  documento: "529.982.247-25",
  rg: "",
  email: "",
  whatsapp: "(27) 99999-8888",
  observacoes: "",
};

describe("validarLocatario", () => {
  it("aceita locatário sem locador, que nasce depois no contrato", () => {
    const r = validarLocatario(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.dados.full_name).toBe("CAMILO SANTOS");
      expect(r.dados.document).toBe("52998224725");
      expect(r.dados.cpf).toBe("52998224725");
      expect(r.dados.phone).toBe("5527999998888");
      expect(r.dados.rg).toBeNull();
      expect(r.dados.notes).toBeNull();
    }
  });

  it("guarda RG e observações quando preenchidos", () => {
    const r = validarLocatario({ ...base, rg: " 1234567 ", observacoes: " Paga até dia 10 " });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.dados.rg).toBe("1234567");
      expect(r.dados.notes).toBe("Paga até dia 10");
    }
  });

  it("aceita CNPJ como documento", () => {
    const r = validarLocatario({ ...base, documento: "11.222.333/0001-81" });
    expect(r.ok && r.dados.document).toBe("11222333000181");
  });

  it("recusa documento inválido e nome vazio", () => {
    const doc = validarLocatario({ ...base, documento: "52998224726" });
    expect(doc.ok).toBe(false);
    const nome = validarLocatario({ ...base, nome: "  " });
    expect(!nome.ok && nome.erros.nome).toBeDefined();
  });

  it("recusa e-mail inválido e telefone sem DDD", () => {
    const r = validarLocatario({ ...base, email: "x@", whatsapp: "99999-8888" });
    expect(!r.ok && r.erros.email).toBe("E-mail inválido.");
    expect(!r.ok && r.erros.whatsapp).toBeDefined();
  });
});

describe("nomesParecidos", () => {
  const existentes = [
    { id: 1, nome: "ELECNO DO BRASIL" },
    { id: 2, nome: "VANI DIAS" },
    { id: 3, nome: "ELECNOR DO BRASIL LTDA" },
  ];

  it("encontra nome com até 2 letras de diferença, ignorando LTDA", () => {
    const achados = nomesParecidos("ELECNOR DO BRASIL LTDA", existentes, 3);
    expect(achados.map((a) => a.id)).toEqual([1]);
  });

  it("não compara o locatário com ele mesmo", () => {
    expect(nomesParecidos("VANI DIAS", existentes, 2)).toEqual([]);
  });

  it("ignora nomes curtos e nomes diferentes", () => {
    expect(nomesParecidos("ANA LIMA", existentes)).toEqual([]);
    expect(nomesParecidos("GABRIEL PEREIRA", existentes)).toEqual([]);
  });

  it("mostra nome igual de outro cadastro como parecido", () => {
    expect(nomesParecidos("VANI DIAS", existentes).map((a) => a.id)).toEqual([2]);
  });
});

describe("distanciaEntreTextos", () => {
  it("conta trocas, inclusões e remoções de letra", () => {
    expect(distanciaEntreTextos("ELECNOR", "ELECNO")).toBe(1);
    expect(distanciaEntreTextos("ABC", "ABC")).toBe(0);
    expect(distanciaEntreTextos("ABC", "XYZ")).toBe(3);
  });
});
