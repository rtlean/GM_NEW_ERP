import { describe, expect, it } from "vitest";
import { formatarReais } from "./dinheiro";

describe("formatarReais", () => {
  it("mostra centavos como reais no padrão brasileiro", () => {
    expect(formatarReais(120000)).toBe("R$ 1.200,00");
    expect(formatarReais(5)).toBe("R$ 0,05");
    expect(formatarReais(0)).toBe("R$ 0,00");
  });
});
