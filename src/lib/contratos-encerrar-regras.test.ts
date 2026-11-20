import { describe, expect, it } from "vitest";
import { dataDoBanco, normalizarNome, validarEncerramento } from "./contratos-encerrar-regras";

const contexto = { hoje: "2026-11-20", inicio: "2026-03-01", nomeLocatario: "João da Silva", status: "active" };

describe("validarEncerramento", () => {
  it("aceita data de hoje ou futura com nome igual e informa o último mês cobrado", () => {
    expect(validarEncerramento({ dataFim: "2026-11-20", nomeDigitado: "João da Silva" }, contexto)).toEqual({
      ok: true,
      dataFim: "2026-11-20",
      ultimoMesCobrado: "2026-11",
    });
    expect(validarEncerramento({ dataFim: "2027-02-28", nomeDigitado: "João da Silva" }, contexto)).toMatchObject({ ok: true, ultimoMesCobrado: "2027-02" });
  });

  it("recusa data anterior a hoje (sem retroativo)", () => {
    const r = validarEncerramento({ dataFim: "2026-11-19", nomeDigitado: "João da Silva" }, contexto);
    expect(r).toMatchObject({ ok: false, erros: { dataFim: "A data de fim não pode ser anterior a hoje." } });
  });

  it("recusa data inexistente e data antes do início do contrato", () => {
    expect(validarEncerramento({ dataFim: "2026-02-30", nomeDigitado: "João da Silva" }, contexto)).toMatchObject({ ok: false, erros: { dataFim: expect.any(String) } });
    const antesDoInicio = { ...contexto, hoje: "2026-01-01" };
    expect(validarEncerramento({ dataFim: "2026-02-10", nomeDigitado: "João da Silva" }, antesDoInicio)).toMatchObject({
      ok: false,
      erros: { dataFim: "A data de fim não pode ser anterior ao início do contrato." },
    });
  });

  it("recusa nome diferente e aceita mesmo nome com outra caixa e espaços", () => {
    expect(validarEncerramento({ dataFim: "2027-01-31", nomeDigitado: "Maria da Silva" }, contexto)).toMatchObject({ ok: false, erros: { nomeDigitado: expect.any(String) } });
    expect(validarEncerramento({ dataFim: "2027-01-31", nomeDigitado: "  JOÃO   da silva " }, contexto)).toMatchObject({ ok: true });
  });

  it("só encerra contrato ativo", () => {
    expect(validarEncerramento({ dataFim: "2027-01-31", nomeDigitado: "João da Silva" }, { ...contexto, status: "ended" })).toMatchObject({
      ok: false,
      erros: { status: "Só é possível encerrar contrato ativo." },
    });
  });
});

describe("normalizarNome e dataDoBanco", () => {
  it("normaliza espaço, acento e caixa", () => {
    expect(normalizarNome("  José   Álvares ")).toBe("jose alvares");
  });
  it("lê data de início como dia de São Paulo", () => {
    expect(dataDoBanco("2026-03-01")).toBe("2026-03-01");
    // 2026-03-01 02:00 UTC ainda é 28/02 em São Paulo.
    expect(dataDoBanco("2026-03-01T02:00:00Z")).toBe("2026-02-28");
  });
});
