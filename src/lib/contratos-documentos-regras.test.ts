import { describe, expect, it } from "vitest";
import {
  caminhoDocumento,
  conteudoConfere,
  nomeLimpo,
  tipoPorMime,
  tipoPorNome,
  TAMANHO_MAXIMO_BYTES,
  validarDocumento,
} from "./contratos-documentos-regras";

const texto = (s: string) => new TextEncoder().encode(s);
const pdf = texto("%PDF-1.7\n%conteudo qualquer");
const docx = texto("PK\u0003\u0004 cabecalho ... word/document.xml ... fim");
const zipSemWord = texto("PK\u0003\u0004 outro pacote qualquer");

describe("tipoPorNome e tipoPorMime", () => {
  it("reconhece PDF e Word pela extensão, sem diferenciar maiúsculas", () => {
    expect(tipoPorNome("Contrato.PDF")).toBe("pdf");
    expect(tipoPorNome("contrato-assinado.docx")).toBe("docx");
    expect(tipoPorNome("foto.jpg")).toBeNull();
    expect(tipoPorNome("semextensao")).toBeNull();
  });
  it("reconhece o tipo pelo MIME guardado", () => {
    expect(tipoPorMime("application/pdf")).toBe("pdf");
    expect(tipoPorMime("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe("docx");
    expect(tipoPorMime("image/png")).toBeNull();
  });
});

describe("conteudoConfere", () => {
  it("aceita PDF que começa com %PDF", () => {
    expect(conteudoConfere("pdf", pdf)).toBe(true);
  });
  it("recusa PDF renomeado com outro conteúdo", () => {
    expect(conteudoConfere("pdf", texto("<html>nao sou pdf</html>"))).toBe(false);
  });
  it("aceita Word que é pacote zip com word/document.xml", () => {
    expect(conteudoConfere("docx", docx)).toBe(true);
  });
  it("recusa zip que não é Word e PDF renomeado para .docx", () => {
    expect(conteudoConfere("docx", zipSemWord)).toBe(false);
    expect(conteudoConfere("docx", pdf)).toBe(false);
  });
});

describe("validarDocumento", () => {
  it("aceita PDF e Word válidos e devolve o tipo", () => {
    expect(validarDocumento({ nome: "contrato.pdf", bytes: pdf })).toEqual({ ok: true, tipo: "pdf" });
    expect(validarDocumento({ nome: "contrato.docx", bytes: docx })).toEqual({ ok: true, tipo: "docx" });
  });
  it("recusa extensão que não é PDF nem Word", () => {
    const r = validarDocumento({ nome: "planilha.xlsx", bytes: docx });
    expect(r.ok).toBe(false);
  });
  it("recusa arquivo vazio e arquivo acima de 10 MB", () => {
    expect(validarDocumento({ nome: "a.pdf", bytes: new Uint8Array(0) }).ok).toBe(false);
    const grande = new Uint8Array(TAMANHO_MAXIMO_BYTES + 1);
    grande.set(pdf.slice(0, 4));
    const r = validarDocumento({ nome: "a.pdf", bytes: grande });
    expect(r).toEqual({ ok: false, erro: "O arquivo passa de 10 MB." });
  });
  it("aceita exatamente 10 MB", () => {
    const limite = new Uint8Array(TAMANHO_MAXIMO_BYTES);
    limite.set(pdf.slice(0, 4));
    expect(validarDocumento({ nome: "a.pdf", bytes: limite }).ok).toBe(true);
  });
});

describe("nomeLimpo e caminhoDocumento", () => {
  it("tira acento, espaço e símbolo do nome", () => {
    expect(nomeLimpo("Contrato Locação João & Maria (assinado).pdf")).toBe("Contrato-Locacao-Joao-Maria-assinado");
  });
  it("usa um nome padrão quando sobra só símbolo", () => {
    expect(nomeLimpo("!!!.docx")).toBe("contrato");
  });
  it("monta o caminho com empresa, contrato, versão e extensão", () => {
    expect(caminhoDocumento(1, 42, 3, "Contrato Final.docx", "docx")).toBe("supabase/contracts/1/42/v3-Contrato-Final.docx");
    expect(caminhoDocumento(1, 42, 1, "scan.pdf", "pdf")).toBe("supabase/contracts/1/42/v1-scan.pdf");
  });
});
