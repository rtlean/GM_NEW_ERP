// Regras puras do encerramento de contrato (US-3.8). Sem banco.
import { dataValida } from "./contratos-regras";

/** Data de hoje em São Paulo, no formato AAAA-MM-DD. */
export function hojeSaoPaulo(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(agora);
}

/** Data de início vinda do banco (texto ou timestamp) como AAAA-MM-DD em São Paulo. */
export function dataDoBanco(valor: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  return hojeSaoPaulo(new Date(valor));
}

/** Nome para comparar: sem espaços extras e sem diferença de maiúsculas e acento. */
export function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export type EntradaEncerramento = { dataFim: string; nomeDigitado: string };

export type ContextoEncerramento = { hoje: string; inicio: string; nomeLocatario: string; status: string };

export type ResultadoEncerramento =
  | { ok: true; dataFim: string; ultimoMesCobrado: string }
  | { ok: false; erros: Partial<Record<keyof EntradaEncerramento | "status", string>> };

/** Confere se o contrato pode ser encerrado: ativo, data de fim válida e não retroativa, e nome digitado igual ao do locatário. */
export function validarEncerramento(entrada: EntradaEncerramento, contexto: ContextoEncerramento): ResultadoEncerramento {
  const erros: Partial<Record<keyof EntradaEncerramento | "status", string>> = {};

  if (contexto.status !== "active") erros.status = "Só é possível encerrar contrato ativo.";

  if (!dataValida(entrada.dataFim)) erros.dataFim = "Escolha uma data de fim válida.";
  else if (entrada.dataFim < contexto.hoje) erros.dataFim = "A data de fim não pode ser anterior a hoje.";
  else if (entrada.dataFim < contexto.inicio) erros.dataFim = "A data de fim não pode ser anterior ao início do contrato.";

  if (normalizarNome(entrada.nomeDigitado) !== normalizarNome(contexto.nomeLocatario)) {
    erros.nomeDigitado = "O nome não confere com o do locatário.";
  }

  if (Object.keys(erros).length > 0) return { ok: false, erros };
  return { ok: true, dataFim: entrada.dataFim, ultimoMesCobrado: entrada.dataFim.slice(0, 7) };
}
