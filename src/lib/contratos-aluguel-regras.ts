// Regras puras da alteração de aluguel (US-3.7). Sem banco. Competência no formato AAAA-MM.
import { reaisParaCentavos } from "./cadastro-imovel";

const FORMATO_COMPETENCIA = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Mês atual no fuso de São Paulo, no formato AAAA-MM. */
export function competenciaAtual(agora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).formatToParts(agora);
  const ano = partes.find((p) => p.type === "year")?.value ?? "";
  const mes = partes.find((p) => p.type === "month")?.value ?? "";
  return `${ano}-${mes}`;
}

/** "2027-03" -> "03/2027" (texto para a tela). */
export function competenciaParaTexto(competencia: string): string {
  const [ano, mes] = competencia.split("-");
  return `${mes}/${ano}`;
}

export type EntradaAlteracaoAluguel = { competencia: string; valor: string; observacao: string };

export type AlteracaoAluguel = { competencia: string; efetivaEm: string; rentCents: number; observacao: string | null };

export type ResultadoAlteracaoAluguel =
  | { ok: true; dados: AlteracaoAluguel }
  | { ok: false; erros: Partial<Record<keyof EntradaAlteracaoAluguel, string>> };

/** Confere mês (não pode ser anterior ao atual) e valor (maior que zero, em centavos). */
export function validarAlteracaoAluguel(entrada: EntradaAlteracaoAluguel, mesAtual: string): ResultadoAlteracaoAluguel {
  const erros: Partial<Record<keyof EntradaAlteracaoAluguel, string>> = {};

  let competencia = "";
  if (!FORMATO_COMPETENCIA.test(entrada.competencia)) erros.competencia = "Escolha o mês.";
  else if (entrada.competencia < mesAtual) erros.competencia = "Não é possível alterar um mês anterior ao atual.";
  else competencia = entrada.competencia;

  let rentCents = 0;
  const valor = reaisParaCentavos(entrada.valor);
  if (!valor.ok) erros.valor = valor.erro;
  else if (valor.valor <= 0) erros.valor = "Informe um aluguel maior que zero.";
  else rentCents = valor.valor;

  const observacao = entrada.observacao.trim().slice(0, 300);
  if (Object.keys(erros).length > 0) return { ok: false, erros };
  return {
    ok: true,
    dados: { competencia, efetivaEm: `${competencia}-01`, rentCents, observacao: observacao || null },
  };
}
