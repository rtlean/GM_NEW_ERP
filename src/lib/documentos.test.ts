import { describe, expect, it } from "vitest";
import { cnpjValido, cpfValido, validarDocumento } from "./documentos";

describe("CPF", () => {
  it("aceita CPF com dígitos corretos", () => {
    expect(cpfValido("52998224725")).toBe(true);
  });
  it("recusa CPF com dígito errado", () => {
    expect(cpfValido("52998224726")).toBe(false);
  });
  it("recusa sequência repetida", () => {
    expect(cpfValido("11111111111")).toBe(false);
  });
});

describe("CNPJ", () => {
  it("aceita CNPJ numérico válido", () => {
    expect(cnpjValido("11222333000181")).toBe(true);
  });
  it("aceita CNPJ alfanumérico com dígitos corretos", () => {
    // Mesma regra do numérico, com letras nas 12 primeiras posições.
    expect(cnpjValido("12ABC34501DE35")).toBe(true);
  });
  it("recusa CNPJ com dígito errado", () => {
    expect(cnpjValido("11222333000182")).toBe(false);
  });
});

describe("validarDocumento", () => {
  it("limpa pontuação e identifica CPF", () => {
    expect(validarDocumento("529.982.247-25")).toEqual({ ok: true, tipo: "CPF", valor: "52998224725" });
  });
  it("identifica CNPJ com máscara", () => {
    expect(validarDocumento("11.222.333/0001-81")).toEqual({ ok: true, tipo: "CNPJ", valor: "11222333000181" });
  });
  it("pede o documento quando está vazio", () => {
    expect(validarDocumento("  ")).toEqual({ ok: false, erro: "Informe o CPF ou CNPJ." });
  });
  it("recusa tamanho errado", () => {
    expect(validarDocumento("1234").ok).toBe(false);
  });
});
