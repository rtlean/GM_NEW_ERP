// Regras puras dos lançamentos do locador (US-4.4). Sem banco. Valores em centavos. Competência AAAA-MM.
import { reaisParaCentavos } from "./cadastro-imovel";
import { dataValida } from "./contratos-regras";

const FORMATO_COMPETENCIA = /^\d{4}-(0[1-9]|1[0-2])$/;

/** "Cobrar de" na tela e o valor gravado no banco (charged_to). Imobiliária não existe no banco. */
export const COBRAR_DE = [
  { valor: "locador", rotulo: "Locador", banco: "owner" },
  { valor: "locatario", rotulo: "Locatário", banco: "tenant" },
] as const;

export type CobrarDeTela = (typeof COBRAR_DE)[number]["valor"];

export function competenciaValida(competencia: string): boolean {
  return FORMATO_COMPETENCIA.test(competencia);
}

/** Texto da competência para tela: "2026-11" -> "11/2026". */
export function competenciaParaTexto(competencia: string): string {
  const [ano, mes] = competencia.split("-");
  return `${mes}/${ano}`;
}

export type EntradaLancamento = {
  categoriaId: string;
  imovelId: string;
  valor: string;
  data: string;
  cobrarDe: string;
  descricao: string;
  observacao: string;
};

export type DadosLancamento = {
  categoriaId: number;
  imovelId: number | null;
  valorCentavos: number;
  data: string;
  cobrarDe: "owner" | "tenant";
  descricao: string;
  observacao: string | null;
};

export type ResultadoLancamento = { ok: true; dados: DadosLancamento } | { ok: false; erros: Partial<Record<keyof EntradaLancamento, string>> };

/** Confere os campos do lançamento. A categoria precisa estar entre as contas de controle ativas. */
export function validarLancamento(entrada: EntradaLancamento, categoriasAtivas: number[]): ResultadoLancamento {
  const erros: Partial<Record<keyof EntradaLancamento, string>> = {};

  const categoriaId = Number(entrada.categoriaId);
  if (!Number.isInteger(categoriaId) || !categoriasAtivas.includes(categoriaId)) erros.categoriaId = "Escolha a categoria.";

  let imovelId: number | null = null;
  if (entrada.imovelId !== "") {
    const id = Number(entrada.imovelId);
    if (!Number.isInteger(id) || id <= 0) erros.imovelId = "Imóvel inválido.";
    else imovelId = id;
  }

  let valorCentavos = 0;
  const valor = reaisParaCentavos(entrada.valor);
  if (!valor.ok) erros.valor = valor.erro;
  else if (valor.valor <= 0) erros.valor = "Informe um valor maior que zero.";
  else valorCentavos = valor.valor;

  if (!dataValida(entrada.data)) erros.data = "Informe a data da despesa.";

  const cobrar = COBRAR_DE.find((c) => c.valor === entrada.cobrarDe);
  if (!cobrar) erros.cobrarDe = "Escolha quem paga.";

  const descricao = entrada.descricao.trim();
  if (!descricao) erros.descricao = "Informe a descrição.";
  else if (descricao.length > 200) erros.descricao = "A descrição passa de 200 caracteres.";

  const observacao = entrada.observacao.trim().slice(0, 300);
  if (Object.keys(erros).length > 0 || !cobrar) return { ok: false, erros };
  return {
    ok: true,
    dados: { categoriaId, imovelId, valorCentavos, data: entrada.data, cobrarDe: cobrar.banco, descricao, observacao: observacao || null },
  };
}

/** Soma de valores em centavos. */
export function totalCentavos(valores: number[]): number {
  return valores.reduce((soma, v) => soma + v, 0);
}
