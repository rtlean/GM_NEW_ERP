import { describe, expect, it } from "vitest";
import { MENU, grupoDoCaminho } from "./menu";

describe("menu", () => {
  it("tem só os grupos da v1", () => {
    expect(MENU.map((g) => g.rotulo)).toEqual(["Dashboard", "Imóveis", "Locação", "Usuários"]);
  });

  it("acha o grupo pelo caminho, inclusive subpáginas", () => {
    expect(grupoDoCaminho("/locadores")?.rotulo).toBe("Locação");
    expect(grupoDoCaminho("/contratos/15")?.rotulo).toBe("Locação");
    expect(grupoDoCaminho("/imoveis")?.rotulo).toBe("Imóveis");
    expect(grupoDoCaminho("/nao-existe")).toBeUndefined();
  });
});
