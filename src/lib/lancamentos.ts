import "server-only";
import { obterClienteServidor } from "./supabase/server";
import { listarImoveisDoLocador } from "./imoveis";
import type { DadosLancamento } from "./lancamentos-regras";

// Lançamentos do locador (US-4.4). Tabela monthly_expense_items.
// Sem exclusão nesta etapa: corrigir é editar. Toda consulta filtra company_id = 1.
// Não cobra aluguel, não calcula taxa e não mexe em cobrança do mês (fatia 4).

const EMPRESA_ID = 1;

export type CategoriaLancamento = { id: number; nome: string };

export type LinhaLancamento = {
  id: number;
  descricao: string;
  valorCentavos: number;
  data: string;
  categoriaId: number;
  categoriaNome: string;
  imovelId: number | null;
  cobrarDe: "owner" | "tenant";
  observacao: string | null;
};

/** Contas de controle ativas, usadas como categoria do lançamento. */
export async function listarCategorias(): Promise<CategoriaLancamento[]> {
  const { data, error } = await obterClienteServidor()
    .from("controles_conta")
    .select("id, nome")
    .eq("company_id", EMPRESA_ID)
    .eq("ativo", true)
    .order("ordem_resumo", { ascending: true });
  if (error) throw new Error("Não foi possível carregar as categorias.");
  return (data ?? []).map((c) => ({ id: c.id, nome: c.nome }));
}

/** Lançamentos de um locador numa competência, do mais antigo para o mais recente. */
export async function listarLancamentos(ownerId: number, competencia: string): Promise<LinhaLancamento[]> {
  const db = obterClienteServidor();
  const { data, error } = await db
    .from("monthly_expense_items")
    .select("id, description, amount_cents, expense_date, control_account_id, property_id, charged_to, notes")
    .eq("company_id", EMPRESA_ID)
    .eq("owner_id", ownerId)
    .eq("competence", competencia)
    .order("expense_date", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw new Error("Não foi possível carregar os lançamentos.");

  const categorias = new Map((await listarCategorias()).map((c) => [c.id, c.nome]));
  return (data ?? []).map((l) => ({
    id: l.id,
    descricao: l.description,
    valorCentavos: l.amount_cents,
    data: l.expense_date,
    categoriaId: l.control_account_id,
    categoriaNome: categorias.get(l.control_account_id) ?? "Categoria removida",
    imovelId: l.property_id,
    cobrarDe: l.charged_to === "tenant" ? "tenant" : "owner",
    observacao: l.notes,
  }));
}

/** Confere que o imóvel escolhido é do próprio locador (não grava lançamento em imóvel de outro). */
async function imovelDoLocador(ownerId: number, imovelId: number | null): Promise<void> {
  if (imovelId === null) return;
  const imoveis = await listarImoveisDoLocador(ownerId);
  if (!imoveis.some((i) => i.id === imovelId)) throw new Error("O imóvel escolhido não pertence a este locador.");
}

export type EntradaGravar = {
  ownerId: number;
  competencia: string;
  dados: DadosLancamento;
  usuarioId: number;
  /** Quando informado, é uma edição do lançamento existente. */
  lancamentoId?: number;
};

/** Cria ou edita um lançamento. Edição não muda competência nem apaga nada. */
export async function gravarLancamento({ ownerId, competencia, dados, usuarioId, lancamentoId }: EntradaGravar): Promise<number> {
  const db = obterClienteServidor();
  await imovelDoLocador(ownerId, dados.imovelId);

  const campos = {
    description: dados.descricao,
    amount_cents: dados.valorCentavos,
    expense_date: dados.data,
    control_account_id: dados.categoriaId,
    property_id: dados.imovelId,
    charged_to: dados.cobrarDe,
    notes: dados.observacao,
  };

  let id: number;
  if (lancamentoId === undefined) {
    const { data, error } = await db
      .from("monthly_expense_items")
      .insert({ ...campos, company_id: EMPRESA_ID, owner_id: ownerId, competence: competencia, created_by: usuarioId })
      .select("id")
      .single();
    if (error || !data) throw new Error("Não foi possível gravar o lançamento. Tente de novo.");
    id = data.id;
  } else {
    const { data, error } = await db
      .from("monthly_expense_items")
      .update(campos)
      .eq("company_id", EMPRESA_ID)
      .eq("owner_id", ownerId)
      .eq("competence", competencia)
      .eq("id", lancamentoId)
      .select("id")
      .maybeSingle();
    if (error) throw new Error("Não foi possível alterar o lançamento. Tente de novo.");
    if (!data) throw new Error("Lançamento não encontrado neste locador e competência.");
    id = data.id;
  }

  const evento = {
    company_id: EMPRESA_ID,
    user_id: usuarioId,
    entity: "expense",
    entity_id: id,
    action: lancamentoId === undefined ? "expense.created" : "expense.updated",
    metadata: JSON.stringify({ ownerId, competencia, valorCentavos: dados.valorCentavos, categoriaId: dados.categoriaId, imovelId: dados.imovelId }),
  };
  // Regra do projeto: não apagar registro de negócio. Se a auditoria falhar duas vezes, o lançamento fica gravado e o erro avisa.
  const primeira = await db.from("audit_events").insert(evento);
  if (!primeira.error) return id;
  const segunda = await db.from("audit_events").insert(evento);
  if (segunda.error) {
    throw new Error(`O lançamento foi gravado (registro ${id}), mas não foi possível registrar na auditoria. Avise o dono do projeto.`);
  }
  return id;
}

/** Quantidade de lançamentos de cada locador na competência, numa consulta só (para a lista de locadores). */
export async function contarLancamentosPorLocador(competencia: string): Promise<Map<number, number>> {
  const { data, error } = await obterClienteServidor()
    .from("monthly_expense_items")
    .select("owner_id")
    .eq("company_id", EMPRESA_ID)
    .eq("competence", competencia);
  if (error) throw new Error("Não foi possível contar os lançamentos.");
  const mapa = new Map<number, number>();
  for (const l of data ?? []) mapa.set(l.owner_id, (mapa.get(l.owner_id) ?? 0) + 1);
  return mapa;
}
