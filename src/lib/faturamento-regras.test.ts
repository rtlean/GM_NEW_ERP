import { describe, expect, it } from "vitest";
import { situacaoDaLinha, temContatoDeCobranca, totalDaSelecao, validarSelecao, type LinhaFaturamento } from "./faturamento-regras";

const base: LinhaFaturamento = { contratoId: 1, inquilino: "Marina Couto", vencimento: "2026-11-10", aluguelCentavos: 280000, semContato: false, jaGerada: false, emAtraso: false };
const linhas: LinhaFaturamento[] = [
  base,
  { ...base, contratoId: 2, inquilino: "Diego Lima", aluguelCentavos: 365000, emAtraso: true },
  { ...base, contratoId: 3, inquilino: "Nexo Contábil Ltda", aluguelCentavos: 520000, semContato: true },
  { ...base, contratoId: 4, inquilino: "Café Grão Ltda", aluguelCentavos: 440000, jaGerada: true },
];

describe("situacaoDaLinha", () => {
  it("linha pronta começa marcada e liberada", () => {
    expect(situacaoDaLinha(base)).toEqual({ texto: "Pronta", cor: "#4F5B72", bloqueada: false, marcadaInicialmente: true });
  });
  it("inquilino em atraso continua liberado e marcado", () => {
    const s = situacaoDaLinha(linhas[1]);
    expect(s.texto).toBe("Inquilino em atraso");
    expect(s.bloqueada).toBe(false);
    expect(s.marcadaInicialmente).toBe(true);
  });
  it("sem e-mail nem WhatsApp fica bloqueado e desmarcado", () => {
    expect(situacaoDaLinha(linhas[2])).toMatchObject({ texto: "Falta e-mail ou WhatsApp", bloqueada: true, marcadaInicialmente: false });
  });
  it("já gerada fica bloqueada, mesmo que tenha e-mail", () => {
    expect(situacaoDaLinha(linhas[3])).toMatchObject({ texto: "Cobrança já gerada", bloqueada: true, marcadaInicialmente: false });
  });
});

describe("temContatoDeCobranca", () => {
  it("basta ter e-mail ou WhatsApp", () => {
    expect(temContatoDeCobranca("dona@exemplo.com", null)).toBe(true);
    expect(temContatoDeCobranca(null, "5527999998888")).toBe(true);
    expect(temContatoDeCobranca("dona@exemplo.com", "5527999998888")).toBe(true);
  });
  it("sem nenhum dos dois não tem contato", () => {
    expect(temContatoDeCobranca(null, null)).toBe(false);
    expect(temContatoDeCobranca("   ", "")).toBe(false);
  });
});

describe("totalDaSelecao", () => {
  it("soma em centavos só as linhas marcadas", () => {
    expect(totalDaSelecao(linhas, new Set([1, 2]))).toBe(645000);
  });
  it("sem marcação, total zero", () => {
    expect(totalDaSelecao(linhas, new Set())).toBe(0);
  });
});

describe("validarSelecao", () => {
  it("aceita contratos liberados e remove repetidos", () => {
    expect(validarSelecao(linhas, [1, 2, 1])).toEqual({ ok: true, contratoIds: [1, 2] });
  });
  it("recusa seleção vazia", () => {
    expect(validarSelecao(linhas, [])).toMatchObject({ ok: false });
  });
  it("recusa contrato sem e-mail nem WhatsApp mesmo que venha do formulário", () => {
    const r = validarSelecao(linhas, [1, 3]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toContain("não tem e-mail nem WhatsApp");
  });
  it("recusa contrato que já tem cobrança no mês", () => {
    expect(validarSelecao(linhas, [4])).toMatchObject({ ok: false });
  });
  it("recusa contrato que não está na lista", () => {
    expect(validarSelecao(linhas, [99])).toMatchObject({ ok: false });
  });
});
