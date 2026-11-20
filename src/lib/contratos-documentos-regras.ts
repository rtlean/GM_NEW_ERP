// Regras puras do arquivo do contrato (US-3.6). Sem acesso ao banco nem ao Storage, para serem testadas.

export const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024;

export type TipoDocumento = "pdf" | "docx";

export const TIPOS: Record<TipoDocumento, { extensao: string; mime: string }> = {
  pdf: { extensao: "pdf", mime: "application/pdf" },
  docx: { extensao: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
};

/** Tipo pelo nome do arquivo (extensão). Null se não for PDF nem Word. */
export function tipoPorNome(nome: string): TipoDocumento | null {
  const extensao = nome.trim().toLowerCase().split(".").pop() ?? "";
  if (extensao === "pdf") return "pdf";
  if (extensao === "docx") return "docx";
  return null;
}

/** Tipo pelo tipo MIME guardado no banco. */
export function tipoPorMime(mime: string): TipoDocumento | null {
  if (mime === TIPOS.pdf.mime) return "pdf";
  if (mime === TIPOS.docx.mime) return "docx";
  return null;
}

const ASSINATURA_PDF = [0x25, 0x50, 0x44, 0x46]; // "%PDF"
const ASSINATURA_ZIP = [0x50, 0x4b, 0x03, 0x04]; // "PK.." (o .docx é um pacote compactado)
const MARCA_WORD = "word/document.xml";

function comecaCom(bytes: Uint8Array, assinatura: number[]): boolean {
  return assinatura.every((b, i) => bytes[i] === b);
}

/** Confere se o conteúdo é mesmo do tipo declarado, não só a extensão. */
export function conteudoConfere(tipo: TipoDocumento, bytes: Uint8Array): boolean {
  if (tipo === "pdf") return comecaCom(bytes, ASSINATURA_PDF);
  if (!comecaCom(bytes, ASSINATURA_ZIP)) return false;
  const marca = new TextEncoder().encode(MARCA_WORD);
  return procurarSequencia(bytes, marca);
}

function procurarSequencia(bytes: Uint8Array, alvo: Uint8Array): boolean {
  for (let i = 0; i + alvo.length <= bytes.length; i++) {
    let igual = true;
    for (let j = 0; j < alvo.length; j++) {
      if (bytes[i + j] !== alvo[j]) {
        igual = false;
        break;
      }
    }
    if (igual) return true;
  }
  return false;
}

export type ResultadoDocumento = { ok: true; tipo: TipoDocumento } | { ok: false; erro: string };

/** Valida o arquivo enviado: tipo, tamanho e conteúdo. */
export function validarDocumento(entrada: { nome: string; bytes: Uint8Array }): ResultadoDocumento {
  const tipo = tipoPorNome(entrada.nome);
  if (!tipo) return { ok: false, erro: "Envie um arquivo .pdf ou .docx." };
  if (entrada.bytes.length === 0) return { ok: false, erro: "O arquivo está vazio." };
  if (entrada.bytes.length > TAMANHO_MAXIMO_BYTES) return { ok: false, erro: "O arquivo passa de 10 MB." };
  if (!conteudoConfere(tipo, entrada.bytes)) {
    return { ok: false, erro: `O arquivo não é um ${tipo === "pdf" ? "PDF" : "Word (.docx)"} válido.` };
  }
  return { ok: true, tipo };
}

/** Nome seguro para o Storage: sem acento, sem espaços, sem a extensão, até 60 caracteres. */
export function nomeLimpo(nome: string): string {
  const semExtensao = nome.replace(/\.[^.]*$/, "");
  const limpo = semExtensao
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return limpo || "contrato";
}

/** Caminho no bucket: supabase/contracts/<empresa>/<contrato>/v<versão>-<nome>.<ext>. Versões antigas nunca são apagadas. */
export function caminhoDocumento(empresaId: number, contratoId: number, versao: number, nome: string, tipo: TipoDocumento): string {
  return `supabase/contracts/${empresaId}/${contratoId}/v${versao}-${nomeLimpo(nome)}.${TIPOS[tipo].extensao}`;
}
