import { describe, expect, it } from "vitest";
import { iatDoToken, rotaPublica } from "./sessao";

function tokenComIat(iat: number): string {
  const corpo = Buffer.from(JSON.stringify({ sub: "x", iat })).toString("base64url");
  return `cabecalho.${corpo}.assinatura`;
}

describe("rotaPublica", () => {
  it("deixa a tela de login e a verificação de status abertas", () => {
    expect(rotaPublica("/login")).toBe(true);
    expect(rotaPublica("/api/health")).toBe(true);
  });

  it("deixa arquivos estáticos e do próprio Next abertos", () => {
    expect(rotaPublica("/logo.png")).toBe(true);
    expect(rotaPublica("/_next/static/chunk.js")).toBe(true);
  });

  it("exige login nas telas do ERP", () => {
    expect(rotaPublica("/")).toBe(false);
    expect(rotaPublica("/dashboard")).toBe(false);
    expect(rotaPublica("/locadores?busca=ana")).toBe(false);
    expect(rotaPublica("/loginx")).toBe(false);
  });
});

describe("iatDoToken", () => {
  it("lê a hora de emissão do token", () => {
    expect(iatDoToken(tokenComIat(1700000000))).toBe(1700000000);
  });

  it("devolve null para token ausente ou inválido", () => {
    expect(iatDoToken(undefined)).toBeNull();
    expect(iatDoToken("nao-e-jwt")).toBeNull();
    expect(iatDoToken("a.%%%.c")).toBeNull();
  });
});
