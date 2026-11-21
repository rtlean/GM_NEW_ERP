// Pipeline (docs/historias/fatia-pipeline.md, US-P.1). Funções puras: sem banco, sem cookies.
// Só quatro etapas, sem comissão e sem probabilidade (decisão do dono, 21/11/2026).

export const ETAPAS = ["Prospecção", "Visita", "Proposta", "Fechamento"] as const;
export type Etapa = (typeof ETAPAS)[number];

export const TIPOS_NEGOCIO = ["Locação", "Venda"] as const;
export type TipoNegocio = (typeof TIPOS_NEGOCIO)[number];

export const LIMITE_NOME = 120;
export const LIMITE_IMOVEL = 160;
/** Teto de segurança do valor (R$ 10 milhões em centavos): evita número fora do que o banco aceita. */
export const LIMITE_VALOR_CENTAVOS = 1_000_000_000;

export function ehEtapa(valor: string): valor is Etapa {
  return (ETAPAS as readonly string[]).includes(valor);
}

/** Etapa anterior (-1) ou próxima (+1); null quando já está na primeira ou na última. */
export function etapaVizinha(etapa: Etapa, direcao: 1 | -1): Etapa | null {
  const posicao = ETAPAS.indexOf(etapa) + direcao;
  return posicao < 0 || posicao >= ETAPAS.length ? null : ETAPAS[posicao];
}

export type EntradaNovoLead = {
  nome: string;
  tipo: string;
  /** Texto do campo de valor (aluguel ou valor do imóvel), como o usuário digitou. */
  valor: string;
  imovel?: string;
};

export type NovoLead = {
  nome: string;
  tipo: TipoNegocio;
  valorCentavos: number;
  imovel: string | null;
};

export type ResultadoNovoLead = { ok: true; lead: NovoLead } | { ok: false; erros: Partial<Record<"nome" | "tipo" | "valor" | "imovel", string>> };

/**
 * Converte "2500", "2500,5" ou "2500.50" em centavos inteiros. Null se não for um valor positivo com até 2 casas.
 * Nunca usa ponto flutuante para guardar o valor: a conversão é feita a partir do texto.
 */
export function valorParaCentavos(texto: string): number | null {
  const limpo = texto.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return null;
  const [reais, centavos = ""] = limpo.split(".");
  const total = Number(reais) * 100 + Number(centavos.padEnd(2, "0"));
  if (!Number.isSafeInteger(total) || total <= 0 || total > LIMITE_VALOR_CENTAVOS) return null;
  return total;
}

export function validarNovoLead(entrada: EntradaNovoLead): ResultadoNovoLead {
  const erros: Partial<Record<"nome" | "tipo" | "valor" | "imovel", string>> = {};

  const nome = entrada.nome.trim();
  if (!nome) erros.nome = "Informe o nome do cliente.";
  else if (nome.length > LIMITE_NOME) erros.nome = `Use até ${LIMITE_NOME} caracteres.`;

  const tipo = entrada.tipo.trim();
  if (!(TIPOS_NEGOCIO as readonly string[]).includes(tipo)) erros.tipo = "Escolha Locação ou Venda.";

  const valorCentavos = valorParaCentavos(entrada.valor);
  if (valorCentavos === null) erros.valor = "Informe um valor maior que zero, com até 2 casas decimais.";

  const imovel = (entrada.imovel ?? "").trim();
  if (imovel.length > LIMITE_IMOVEL) erros.imovel = `Use até ${LIMITE_IMOVEL} caracteres.`;

  if (Object.keys(erros).length > 0 || valorCentavos === null) return { ok: false, erros };
  return {
    ok: true,
    lead: { nome, tipo: tipo as TipoNegocio, valorCentavos, imovel: imovel || null },
  };
}

/** Quantidade de negócios e soma dos valores (em centavos). */
export function resumoPipeline(negocios: { valorCentavos: number }[]): { quantidade: number; totalCentavos: number } {
  return {
    quantidade: negocios.length,
    totalCentavos: negocios.reduce((soma, n) => soma + n.valorCentavos, 0),
  };
}

/** Busca por cliente ou imóvel, sem diferença de maiúsculas e acentos. Busca vazia devolve tudo. */
export function filtrarPorBusca<T extends { nome: string; imovel: string | null }>(negocios: T[], busca: string): T[] {
  const termo = normalizar(busca.trim());
  if (!termo) return negocios;
  return negocios.filter((n) => normalizar(`${n.nome} ${n.imovel ?? ""}`).includes(termo));
}

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
