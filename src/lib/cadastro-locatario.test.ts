import { describe, expect, it } from "vitest";
import { validarLocatario, type EntradaLocatario } from "./cadastro-locatario";

const base: EntradaLocatario = {
  nome: "Camilo Santos",
  documento: "529.982.247-25",
  email: "",
  whatsapp: "(27) 99999-8888",
  locadores: ["3", "7", "3"],
};

describe("validarLocatario", () => {
  it("aceita locatário com um ou mais locadores, sem repetir", () => {
    const r = validarLocatario(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.locadorIds).toEqual([3, 7]);
      expect(r.dados.document).toBe("52998224725");
      expect(r.dados.cpf).toBe("52998224725");
      expect(r.dados.phone).toBe("5527999998888");
    }
  });

  it("exige pelo menos um locador", () => {
    const r = validarLocatario({ ...base, locadores: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.locadores).toBeDefined();
  });

  it("aceita CNPJ como documento", () => {
    const r = validarLocatario({ ...base, documento: "11.222.333/0001-81" });
    expect(r.ok && r.dados.document).toBe("11222333000181");
  });

  it("recusa documento inválido", () => {
    const r = validarLocatario({ ...base, documento: "52998224726" });
    expect(r.ok).toBe(false);
  });
});
