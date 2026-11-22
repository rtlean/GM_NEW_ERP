// Pipeline (docs/historias/fatia-pipeline.md, US-P.1). Funções puras: sem banco, sem cookies.
// Quatro etapas de venda e a coluna final "Lead Frio" (oportunidade perdida), sem comissão e sem probabilidade
// (decisões do dono, 21/11/2026).

export const ETAPAS = ["Prospecção", "Visita", "Proposta", "Fechamento", "Lead Frio"] as const;
export const ETAPA_FRIA = "Lead Frio";
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

export const ORIGENS_LEAD = ["Indicação", "Portal", "WhatsApp", "Site", "Redes sociais", "Outro"] as const;
export type OrigemLead = (typeof ORIGENS_LEAD)[number];
export const LIMITE_EMAIL = 160;
export const LIMITE_CIDADE = 80;

export type EntradaNovoLead = {
  nome: string;
  tipo: string;
  /** Texto do campo de valor (aluguel ou valor do imóvel), como o usuário digitou. */
  valor: string;
  imovel?: string;
  telefone: string;
  email?: string;
  origem?: string;
  cidade?: string;
};

export type NovoLead = {
  nome: string;
  tipo: TipoNegocio;
  valorCentavos: number;
  imovel: string | null;
  /** Só dígitos, com DDI 55 (ex.: 5527999998888), como o projeto guarda telefones. */
  telefone: string;
  email: string | null;
  origem: OrigemLead | null;
  cidade: string | null;
};

export type CampoLead = "nome" | "tipo" | "valor" | "imovel" | "telefone" | "email" | "origem" | "cidade" | "proximoPasso";
export type ResultadoNovoLead = { ok: true; lead: NovoLead } | { ok: false; erros: Partial<Record<CampoLead, string>> };

/**
 * Converte o telefone digitado em formato WhatsApp: só dígitos, com DDI 55.
 * Aceita "27999998888", "(27) 99999-8888" ou "+55 27 99999-8888". Null se não couber no formato.
 */
export function telefoneParaE164(texto: string): string | null {
  const digitos = texto.replace(/\D/g, "");
  const comDdi = digitos.length === 10 || digitos.length === 11 ? `55${digitos}` : digitos;
  return /^55\d{10,11}$/.test(comDdi) ? comDdi : null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const erros: Partial<Record<CampoLead, string>> = {};

  const nome = entrada.nome.trim();
  if (!nome) erros.nome = "Informe o nome do cliente.";
  else if (nome.length > LIMITE_NOME) erros.nome = `Use até ${LIMITE_NOME} caracteres.`;

  const tipo = entrada.tipo.trim();
  if (!(TIPOS_NEGOCIO as readonly string[]).includes(tipo)) erros.tipo = "Escolha Locação ou Venda.";

  const valorCentavos = valorParaCentavos(entrada.valor);
  if (valorCentavos === null) erros.valor = "Informe um valor maior que zero, com até 2 casas decimais.";

  const imovel = (entrada.imovel ?? "").trim();
  if (imovel.length > LIMITE_IMOVEL) erros.imovel = `Use até ${LIMITE_IMOVEL} caracteres.`;

  const telefone = telefoneParaE164(entrada.telefone);
  if (!telefone) erros.telefone = "Informe o telefone com DDD, por exemplo (27) 99999-8888.";

  const email = (entrada.email ?? "").trim();
  if (email && (email.length > LIMITE_EMAIL || !EMAIL.test(email))) erros.email = "Informe um e-mail válido.";

  const origem = (entrada.origem ?? "").trim();
  if (origem && !(ORIGENS_LEAD as readonly string[]).includes(origem)) erros.origem = "Escolha uma origem da lista.";

  const cidade = (entrada.cidade ?? "").trim();
  if (cidade.length > LIMITE_CIDADE) erros.cidade = `Use até ${LIMITE_CIDADE} caracteres.`;

  if (Object.keys(erros).length > 0 || valorCentavos === null || telefone === null) return { ok: false, erros };
  return {
    ok: true,
    lead: {
      nome,
      tipo: tipo as TipoNegocio,
      valorCentavos,
      imovel: imovel || null,
      telefone,
      email: email || null,
      origem: (origem || null) as OrigemLead | null,
      cidade: cidade || null,
    },
  };
}

export const LIMITE_PROXIMO_PASSO = 160;

export type EntradaEdicao = EntradaNovoLead & { proximoPasso?: string; urgente?: boolean };
export type EdicaoNegocio = NovoLead & { proximoPasso: string | null; urgente: boolean };

/** Edição de um negócio: mesmas regras do cadastro, mais próximo passo e urgência. A etapa não muda aqui. */
export function validarEdicaoNegocio(entrada: EntradaEdicao): { ok: true; edicao: EdicaoNegocio } | { ok: false; erros: Partial<Record<CampoLead, string>> } {
  const r = validarNovoLead(entrada);
  const erros: Partial<Record<CampoLead, string>> = r.ok ? {} : { ...r.erros };
  const proximoPasso = (entrada.proximoPasso ?? "").trim();
  if (proximoPasso.length > LIMITE_PROXIMO_PASSO) erros.proximoPasso = `Use até ${LIMITE_PROXIMO_PASSO} caracteres.`;
  if (!r.ok || Object.keys(erros).length > 0) return { ok: false, erros };
  return { ok: true, edicao: { ...r.lead, proximoPasso: proximoPasso || null, urgente: entrada.urgente === true } };
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
