import { describe, expect, it } from "vitest";
import { filtroArquivoValido, passaFiltroArquivo, rotuloArquivo } from "./contratos-lista-regras";

describe("filtroArquivoValido", () => {
  it("aceita com e sem e cai para todos nos demais valores", () => {
    expect(filtroArquivoValido("com")).toBe("com");
    expect(filtroArquivoValido("sem")).toBe("sem");
    expect(filtroArquivoValido("qualquer")).toBe("todos");
    expect(filtroArquivoValido(undefined)).toBe("todos");
  });
});

describe("rotuloArquivo", () => {
  it("mostra Word, PDF ou Sem arquivo", () => {
    expect(rotuloArquivo("docx")).toBe("Word");
    expect(rotuloArquivo("pdf")).toBe("PDF");
    expect(rotuloArquivo(null)).toBe("Sem arquivo");
  });
});

describe("passaFiltroArquivo", () => {
  it("separa contratos com e sem arquivo", () => {
    expect(passaFiltroArquivo(true, "com")).toBe(true);
    expect(passaFiltroArquivo(false, "com")).toBe(false);
    expect(passaFiltroArquivo(false, "sem")).toBe(true);
    expect(passaFiltroArquivo(true, "sem")).toBe(false);
    expect(passaFiltroArquivo(false, "todos")).toBe(true);
  });
});
