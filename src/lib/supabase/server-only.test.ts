import { describe, expect, it } from "vitest";

// Sem simulação: importar o cliente fora do servidor precisa falhar.
describe("proteção do cliente do banco", () => {
  it("não pode ser importado por código de navegador", async () => {
    await expect(import("./server")).rejects.toThrow();
  });
});
