import { describe, expect, it } from "vitest";
import { normalizarTaxa, normalizarWhatsApp, validarLocador, type EntradaLocador } from "./cadastro-locador";

const base: EntradaLocador = {
  nome: "Maria Silva",
  documento: "529.982.247-25",
  email: "",
  cidade: "Linhares",
  whatsapp: "(27) 99999-8888",
  taxa: "10",
  formaRepasse: "PIX",
  tipoPix: "CPF",
  chavePix: "529.982.247-25",
  banco: "",
  codigoBanco: "",
  agencia: "",
  conta: "",
  digitoConta: "",
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
  it("aceita vírgula decimal", () => {
    expect(normalizarTaxa("10,5")).toEqual({ ok: true, valor: 1050 });
  });
  it("recusa acima de 100", () => {
    expect(normalizarTaxa("101").ok).toBe(false);
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

  it("exige nome e documento", () => {
    const r = validarLocador({ ...base, nome: " ", documento: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erros.nome).toBeDefined();
      expect(r.erros.documento).toBeDefined();
    }
  });

  it("não aceita CPF inválido", () => {
    const r = validarLocador({ ...base, documento: "52998224726" });
    expect(r.ok).toBe(false);
  });

  it("transferência bancária exige banco, agência, conta e tipo", () => {
    const r = validarLocador({ ...base, formaRepasse: "TRANSFERÊNCIA BANCÁRIA", tipoPix: "", chavePix: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erros.banco).toBeDefined();
      expect(r.erros.agencia).toBeDefined();
      expect(r.erros.conta).toBeDefined();
      expect(r.erros.tipoConta).toBeDefined();
    }
  });

  it("chave de e-mail vira minúscula", () => {
    const r = validarLocador({ ...base, tipoPix: "E-MAIL", chavePix: "Maria@Exemplo.com" });
    expect(r.ok && r.dados.pix_key).toBe("maria@exemplo.com");
  });
});
