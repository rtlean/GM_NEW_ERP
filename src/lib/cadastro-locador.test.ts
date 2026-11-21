import { describe, expect, it } from "vitest";
import { normalizarTaxa, normalizarWhatsApp, paraFormulario, separarContaComDigito, validarLocador, type EntradaLocador } from "./cadastro-locador";

const base: EntradaLocador = {
  nome: "Maria Silva",
  documento: "529.982.247-25",
  email: "",
  cidade: "Linhares",
  uf: "",
  whatsapp: "(27) 99999-8888",
  taxa: "10",
  formaRepasse: "PIX",
  tipoPix: "CPF",
  chavePix: "529.982.247-25",
  banco: "",
  codigoBanco: "",
  agencia: "",
  conta: "",
  tipoConta: "",
};

describe("normalizarWhatsApp", () => {
  it("salva no formato 5527999998888", () => {
    expect(normalizarWhatsApp("(27) 99999-8888")).toEqual({ ok: true, valor: "5527999998888" });
  });
  it("vazio vira null, porque o campo é opcional", () => {
    expect(normalizarWhatsApp("")).toEqual({ ok: true, valor: null });
  });
  it("recusa número sem DDD", () => {
    expect(normalizarWhatsApp("99999-8888").ok).toBe(false);
  });
});

describe("normalizarTaxa", () => {
  it("converte 10 para 1000 centésimos", () => {
    expect(normalizarTaxa("10")).toEqual({ ok: true, valor: 1000 });
  });
  it("aceita vírgula decimal (taxa flexível por locador)", () => {
    expect(normalizarTaxa("8")).toEqual({ ok: true, valor: 800 });
    expect(normalizarTaxa("12,5")).toEqual({ ok: true, valor: 1250 });
  });
  it("recusa acima de 100", () => {
    expect(normalizarTaxa("101").ok).toBe(false);
  });
});

describe("separarContaComDigito", () => {
  it("separa conta e dígito pelo último traço", () => {
    expect(separarContaComDigito("12345-6")).toEqual({ conta: "12345", digito: "6" });
  });
  it("sem traço, tudo é conta", () => {
    expect(separarContaComDigito("123456")).toEqual({ conta: "123456", digito: null });
  });
});

describe("validarLocador", () => {
  it("aceita locador com Pix e monta os dados para gravar", () => {
    const r = validarLocador(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.dados.document).toBe("52998224725");
      expect(r.dados.phone).toBe("5527999998888");
      expect(r.dados.city).toBe("Linhares");
      expect(r.dados.admin_fee_percent_basis_points).toBe(1000);
      expect(r.dados.pix_type).toBe("CPF");
      expect(r.dados.pix_key).toBe("52998224725");
      expect(r.dados.bank_name).toBeNull();
    }
  });

  it("aceita chave Pix aleatória sem alterar o valor", () => {
    const r = validarLocador({ ...base, tipoPix: "ALEATÓRIA", chavePix: "A1b2-C3d4" });
    expect(r.ok && r.dados.pix_key).toBe("A1b2-C3d4");
  });

  it("exige nome e documento", () => {
    const r = validarLocador({ ...base, nome: " ", documento: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erros.nome).toBeDefined();
      expect(r.erros.documento).toBeDefined();
    }
  });

  it("não aceita CPF inválido", () => {
    expect(validarLocador({ ...base, documento: "52998224726" }).ok).toBe(false);
  });

  it("conta bancária exige banco, agência e conta; grava conta e dígito separados", () => {
    const vazio = validarLocador({ ...base, formaRepasse: "TRANSFERÊNCIA BANCÁRIA", tipoPix: "", chavePix: "" });
    expect(vazio.ok).toBe(false);
    if (!vazio.ok) {
      expect(vazio.erros.banco).toBeDefined();
      expect(vazio.erros.agencia).toBeDefined();
      expect(vazio.erros.conta).toBeDefined();
    }
    const ok = validarLocador({ ...base, formaRepasse: "TRANSFERÊNCIA BANCÁRIA", tipoPix: "", chavePix: "", banco: "Sicredi", agencia: "0123", conta: "12345-6" });
    expect(ok.ok && ok.dados.bank_account).toBe("12345");
    expect(ok.ok && ok.dados.bank_account_digit).toBe("6");
  });

  it("chave de e-mail vira minúscula", () => {
    const r = validarLocador({ ...base, tipoPix: "E-MAIL", chavePix: "Maria@Exemplo.com" });
    expect(r.ok && r.dados.pix_key).toBe("maria@exemplo.com");
  });
});

describe("paraFormulario", () => {
  it("novo locador começa com taxa de 10%", () => {
    expect(paraFormulario({}).taxa).toBe("10");
  });
  it("junta conta e dígito no campo Conta com dígito", () => {
    const f = paraFormulario({ bank_account: "12345", bank_account_digit: "6" });
    expect(f.conta).toBe("12345-6");
  });
});

describe("UF do locador", () => {
  it("aceita sigla de 2 letras e grava em maiúsculas", () => {
    const r = validarLocador({ ...base, uf: "es" });
    expect(r.ok && r.dados.state).toBe("ES");
  });

  it("deixa vazio quando não informada", () => {
    const r = validarLocador({ ...base, uf: "" });
    expect(r.ok && r.dados.state).toBe(null);
  });

  it("recusa sigla com mais de 2 letras", () => {
    const r = validarLocador({ ...base, uf: "ESP" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.uf).toBeDefined();
  });
});
