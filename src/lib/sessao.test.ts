import { describe, expect, it } from "vitest";
import { rotaPublica } from "./sessao";

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
