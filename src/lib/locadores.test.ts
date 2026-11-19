import { describe, expect, it, vi } from "vitest";

// Simula o ambiente do servidor: o pacote "server-only" só bloqueia navegador.
vi.mock("server-only", () => ({}));

import { formatarTelefone, mascararDocumento, montarFiltroBusca } from "./locadores";

describe("mascararDocumento", () => {
  it("mostra só os dois últimos dígitos do CPF", () => {
    expect(mascararDocumento("123.456.789-09")).toBe("***.***.***-09");
    expect(mascararDocumento("12345678909")).toBe("***.***.***-09");
  });

  it("mostra só os dois últimos caracteres do CNPJ", () => {
    expect(mascararDocumento("12.345.678/0001-05")).toBe("**.***.***/****-05");
  });

  it("aceita CNPJ alfanumérico", () => {
    expect(mascararDocumento("12.ABC.345/01DE-35")).toBe("**.***.***/****-35");
  });

  it("mostra traço quando não há documento ou o tamanho é inválido", () => {
    expect(mascararDocumento(null)).toBe("—");
    expect(mascararDocumento("123")).toBe("—");
  });
});

describe("formatarTelefone", () => {
  it("formata celular no padrão (DDD) 99999-9999", () => {
    expect(formatarTelefone("5527999998888")).toBe("(27) 99999-8888");
  });

  it("formata fixo ou celular sem o 9 no padrão (DDD) 9999-9999", () => {
    expect(formatarTelefone("552735211234")).toBe("(27) 3521-1234");
  });

  it("mostra traço quando não há telefone", () => {
    expect(formatarTelefone(null)).toBe("—");
  });

  it("mostra o valor original quando não está no formato esperado", () => {
    expect(formatarTelefone("999")).toBe("999");
  });
});

describe("montarFiltroBusca", () => {
  it("não filtra quando a busca está vazia", () => {
    expect(montarFiltroBusca("   ")).toBeNull();
  });

  it("busca só pelo nome quando o termo não tem números", () => {
    expect(montarFiltroBusca("Maria")).toBe("full_name.ilike.%Maria%");
  });

  it("busca também pelo documento, sem pontos e traços", () => {
    expect(montarFiltroBusca("123.456")).toBe(
      "full_name.ilike.%123.456%,document.ilike.%123456%",
    );
  });

  it("remove caracteres que quebrariam o filtro", () => {
    expect(montarFiltroBusca("Ana,(x)%")).toBe("full_name.ilike.%Anax%");
  });
});
