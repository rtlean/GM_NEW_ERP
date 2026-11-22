import { describe, expect, it } from "vitest";
import { ATALHOS, MENU, TODAS_AS_ROTAS, grupoDoCaminho } from "./menu";
import { MODELOS_DE_ACESSO, TELAS_LIBERAVEIS, atalhosPermitidos, menuPermitido, podeAbrirTela } from "./permissoes";

describe("menu do design", () => {
  it("tem os grupos do design na mesma ordem", () => {
    expect(MENU.map((g) => g.rotulo)).toEqual([
      "Dashboard",
      "Pipeline",
      "Imóveis",
      "Locação",
      "Financeiro",
      "Conta digital",
      "Fiscal",
      "Proteção",
      "Crédito",
      "Integrações",
      "Usuários",
    ]);
  });

  it("marca como em construção só o que está fora da v1 ou ainda não existe", () => {
    const emConstrucao = (rota: string) => TODAS_AS_ROTAS.find((i) => i.rota === rota)?.emConstrucao === true;
    expect(emConstrucao("pipeline")).toBe(false);
    expect(emConstrucao("faturamento")).toBe(false);
    expect(emConstrucao("hoje")).toBe(true);
    expect(emConstrucao("imoveis")).toBe(false);
    expect(emConstrucao("locadores")).toBe(false);
    expect(emConstrucao("sicredi")).toBe(false);
  });

  it("Pipeline é exclusivo do dono: admin abre, operacional com a tela liberada não abre", () => {
    const admin = { role: "admin" as const, status: "active" as const, telas: [] };
    const operacional = { role: "user" as const, status: "active" as const, telas: ["pipeline", "imoveis"] };
    expect(podeAbrirTela(admin, "pipeline")).toBe(true);
    expect(podeAbrirTela(operacional, "pipeline")).toBe(false);
    expect(menuPermitido(operacional).flatMap((g) => g.itens).map((i) => i.rota)).not.toContain("pipeline");
  });

  it("tem o botão Hoje como atalho, fora dos grupos", () => {
    expect(ATALHOS.map((a) => a.rota)).toEqual(["hoje"]);
    expect(grupoDoCaminho("/hoje")).toBeUndefined();
  });

  it("acha o grupo pelo caminho, inclusive subpáginas", () => {
    expect(grupoDoCaminho("/locadores")?.rotulo).toBe("Locação");
    expect(grupoDoCaminho("/contratos/15")?.rotulo).toBe("Locação");
    expect(grupoDoCaminho("/imoveis")?.rotulo).toBe("Imóveis");
    expect(grupoDoCaminho("/nao-existe")).toBeUndefined();
  });

  it("oferece as 26 telas para liberar, e não inclui Usuários nem Pipeline (só o dono)", () => {
    expect(TELAS_LIBERAVEIS).toHaveLength(26);
    expect(TELAS_LIBERAVEIS).not.toContain("usuarios");
    expect(TELAS_LIBERAVEIS).not.toContain("pipeline");
  });

  it("modelo Secretária libera as telas do design, e Nenhuma tela libera nada", () => {
    const secretaria = MODELOS_DE_ACESSO.find((m) => m.chave === "secretaria");
    expect(secretaria?.telas).toContain("locadores");
    expect(secretaria?.telas).not.toContain("pipeline");
    expect(secretaria?.telas).toHaveLength(10);
    expect(MODELOS_DE_ACESSO.find((m) => m.chave === "nenhuma")?.telas).toEqual([]);
  });

  it("atalho Hoje só aparece para quem tem a tela liberada", () => {
    const sem = { role: "user" as const, status: "active" as const, telas: [] };
    const com = { ...sem, telas: ["hoje"] };
    expect(atalhosPermitidos(sem, ATALHOS)).toEqual([]);
    expect(atalhosPermitidos(com, ATALHOS).map((a) => a.rota)).toEqual(["hoje"]);
    expect(menuPermitido(com)).toEqual([]);
  });
});
