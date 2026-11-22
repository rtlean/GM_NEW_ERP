import { describe, expect, it } from "vitest";
import { AUTOMACOES, MODELOS_MENSAGEM, PROVEDORES, validarConexao, type EntradaConexao } from "./whatsapp-regras";

const metaOk: EntradaConexao = { provedor: "meta", numero: "(27) 99999-9999", nomeExibido: "Soluções Imobiliárias", idNumero: "123456", token: "abc", url: "" };

describe("validarConexao", () => {
  it("aceita a conexão pela Meta com número, ID e token", () => {
    expect(validarConexao(metaOk)).toEqual({ ok: true });
  });

  it("exige DDD no número (10 a 13 dígitos)", () => {
    const r = validarConexao({ ...metaOk, numero: "99999-9999" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.numero).toBe("Informe o número com DDD.");
  });

  it("pela Meta exige ID do número e token", () => {
    const r = validarConexao({ ...metaOk, idNumero: " ", token: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erros.idNumero).toBeTruthy();
      expect(r.erros.token).toBe("Informe o token de acesso.");
    }
  });

  it("pela Evolution exige https e chave da API, e não pede ID da Meta", () => {
    const sem = validarConexao({ ...metaOk, provedor: "evolution", idNumero: "", url: "http://servidor.com", token: "" });
    expect(sem.ok).toBe(false);
    if (!sem.ok) {
      expect(sem.erros.url).toBe("A URL do servidor precisa começar com https://");
      expect(sem.erros.token).toBe("Informe a chave da API.");
      expect(sem.erros.idNumero).toBeUndefined();
    }
    expect(validarConexao({ ...metaOk, provedor: "evolution", idNumero: "", url: "https://servidor.com", token: "k" })).toEqual({ ok: true });
  });
});

describe("dados do design", () => {
  it("tem os dois provedores, com a Meta recomendada", () => {
    expect(PROVEDORES.map((p) => p.id)).toEqual(["meta", "evolution"]);
    expect(PROVEDORES.find((p) => p.recomendado)?.id).toBe("meta");
  });

  it("tem os 5 modelos e as 6 automações do design", () => {
    expect(MODELOS_MENSAGEM).toHaveLength(5);
    expect(AUTOMACOES).toHaveLength(6);
  });
});
