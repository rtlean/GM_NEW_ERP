// Regras puras da lista de contratos com o arquivo do contrato (US-3.6 / lista).
import type { TipoDocumento } from "./contratos-documentos-regras";

export type FiltroArquivo = "todos" | "com" | "sem";

/** Aceita só os valores conhecidos da URL; qualquer outra coisa vira "todos". */
export function filtroArquivoValido(valor: string | undefined): FiltroArquivo {
  return valor === "com" || valor === "sem" ? valor : "todos";
}

/** Texto da coluna "Arquivo". */
export function rotuloArquivo(tipo: TipoDocumento | null): string {
  if (tipo === "docx") return "Word";
  if (tipo === "pdf") return "PDF";
  return "Sem arquivo";
}

/** Se o contrato entra no filtro: "com" só quem tem arquivo, "sem" só quem não tem. */
export function passaFiltroArquivo(temArquivo: boolean, filtro: FiltroArquivo): boolean {
  if (filtro === "com") return temArquivo;
  if (filtro === "sem") return !temArquivo;
  return true;
}
