import "server-only";
import { obterClienteServidor } from "./supabase/server";
import { listarImoveisParaSelecao } from "./imoveis";
import { listarContratosAtivosNaCompetencia } from "./contratos";
import { planejarCobrancas, type CobrancaPlanejada } from "./cobrancas-gerar-regras";

// Gerar cobranças do mês (US-4.1). Grava em monthly_entries (uma linha por contrato e competência).
// Nunca altera nem apaga linha existente. Toda consulta filtra company_id = 1.

const EMPRESA_ID = 1;
const TAMANHO_LOTE = 100;

export type ResumoGeracao = { criadas: number; jaExistentes: number; totalCentavos: number };

export type EntradaGerar = {
  competencia: string;
  usuarioId: number;
  /** Lista opcional de contratos (US-4.9). Sem lista, gera para todos os contratos ativos, como na US-4.1. */
  contratoIds?: number[];
};

export async function gerarCobrancasDoMes({ competencia, usuarioId, contratoIds }: EntradaGerar): Promise<ResumoGeracao> {
  const db = obterClienteServidor();
  const [contratosTodos, imoveis] = await Promise.all([listarContratosAtivosNaCompetencia(competencia), listarImoveisParaSelecao()]);
  const escolhidos = contratoIds ? new Set(contratoIds) : null;
  const contratos = escolhidos ? contratosTodos.filter((c) => escolhidos.has(c.id)) : contratosTodos;
  const locadorDoImovel = new Map(imoveis.map((i) => [i.id, i.ownerId]));

  const { data: existentes, error: erroExistentes } = await db
    .from("monthly_entries")
    .select("contract_id")
    .eq("company_id", EMPRESA_ID)
    .eq("competence", competencia)
    .not("contract_id", "is", null);
  if (erroExistentes) throw new Error("Não foi possível verificar as cobranças do mês.");
  const comCobranca = new Set((existentes ?? []).map((e) => e.contract_id as number));

  const validos = contratos.filter((c) => c.tenantId !== null && c.propertyId !== null);
  const semLocador = validos.filter((c) => !locadorDoImovel.get(c.propertyId as number));
  if (semLocador.length > 0) {
    throw new Error(`Há contrato sem locador no imóvel (contrato ${semLocador[0].id}). Corrija o imóvel antes de gerar.`);
  }

  const resultado = planejarCobrancas(
    validos.map((c) => ({
      id: c.id,
      ownerId: locadorDoImovel.get(c.propertyId as number) as number,
      tenantId: c.tenantId as number,
      propertyId: c.propertyId as number,
      aluguelCentavos: c.aluguelCentavos,
    })),
    competencia,
    comCobranca,
  );
  if (!resultado.ok) throw new Error(resultado.erro);
  const { plano } = resultado;

  for (let i = 0; i < plano.criar.length; i += TAMANHO_LOTE) {
    const lote = plano.criar.slice(i, i + TAMANHO_LOTE);
    // Trava única já existe no banco (contract_id, competence). Se outro clique gravou antes, a linha é ignorada, sem erro.
    const { error } = await db
      .from("monthly_entries")
      .upsert(lote.map((c) => linhaDaCobranca(c, usuarioId)), { onConflict: "contract_id,competence", ignoreDuplicates: true });
    if (error) {
      const detalhe = `${error.message}${error.details ? ` | ${error.details}` : ""}${error.hint ? ` | dica: ${error.hint}` : ""}`;
      if (i === 0) {
        throw new Error(`Nenhuma cobrança foi gravada. Motivo do banco: ${detalhe}`);
      }
      throw new Error(
        `Parte das cobranças foi gravada (${i} de ${plano.criar.length}) e a geração parou. Motivo do banco: ${detalhe}. Confira o mês antes de gerar de novo. Avise o dono do projeto.`,
      );
    }
  }

  const evento = {
    company_id: EMPRESA_ID,
    user_id: usuarioId,
    entity: "charge",
    entity_id: null,
    action: "charges.generated",
    metadata: JSON.stringify({ competencia, criadas: plano.criar.length, jaExistentes: plano.jaExistentes, totalCentavos: plano.totalCentavos }),
  };
  // Regra do projeto: não apagar registro de negócio. Se a auditoria falhar duas vezes, as cobranças ficam gravadas e o erro avisa.
  const primeira = await db.from("audit_events").insert(evento);
  if (primeira.error) {
    const segunda = await db.from("audit_events").insert(evento);
    if (segunda.error) throw new Error("As cobranças foram geradas, mas não foi possível registrar na auditoria. Avise o dono do projeto.");
  }

  return { criadas: plano.criar.length, jaExistentes: plano.jaExistentes, totalCentavos: plano.totalCentavos };
}

function linhaDaCobranca(c: CobrancaPlanejada, usuarioId: number) {
  return {
    company_id: EMPRESA_ID,
    contract_id: c.contratoId,
    owner_id: c.ownerId,
    tenant_id: c.tenantId,
    property_id: c.propertyId,
    competence: c.competencia,
    due_date: c.vencimento,
    rent_cents: c.aluguelCentavos,
    paid_cents: 0,
    pending_cents: c.aluguelCentavos,
    status: "open" as const,
    created_by: usuarioId,
  };
}

/**
 * Recebido por locador na competência: total pago e a parte que é aluguel.
 * Aluguel pago = min(pago, aluguel da cobrança): assume que o pagamento cobre o aluguel antes de multa e seguro.
 * Só leitura, para o módulo de Repasses.
 */
export async function recebidoPorLocador(competencia: string): Promise<Map<number, { totalCentavos: number; aluguelCentavos: number }>> {
  const { data, error } = await obterClienteServidor()
    .from("monthly_entries")
    .select("owner_id, paid_cents, rent_cents")
    .eq("company_id", EMPRESA_ID)
    .eq("competence", competencia);
  if (error) throw new Error("Não foi possível carregar os recebimentos do mês.");
  const mapa = new Map<number, { totalCentavos: number; aluguelCentavos: number }>();
  for (const linha of data ?? []) {
    if (linha.owner_id == null) continue;
    const atual = mapa.get(linha.owner_id) ?? { totalCentavos: 0, aluguelCentavos: 0 };
    atual.totalCentavos += linha.paid_cents;
    atual.aluguelCentavos += Math.min(linha.paid_cents, linha.rent_cents);
    mapa.set(linha.owner_id, atual);
  }
  return mapa;
}

/** Contratos que já têm cobrança na competência (US-4.9 mostra e bloqueia). Só leitura. */
export async function contratosComCobrancaNaCompetencia(competencia: string): Promise<Set<number>> {
  const { data, error } = await obterClienteServidor()
    .from("monthly_entries")
    .select("contract_id")
    .eq("company_id", EMPRESA_ID)
    .eq("competence", competencia)
    .not("contract_id", "is", null);
  if (error) throw new Error("Não foi possível verificar as cobranças do mês.");
  return new Set((data ?? []).map((e) => e.contract_id as number));
}

/**
 * Inquilinos com saldo em aberto em competência anterior (US-4.9: "Inquilino em atraso").
 * Regra usada: alguma cobrança de mês anterior com pending_cents > 0.
 */
export async function inquilinosEmAtrasoAte(competencia: string): Promise<Set<number>> {
  const { data, error } = await obterClienteServidor()
    .from("monthly_entries")
    .select("tenant_id")
    .eq("company_id", EMPRESA_ID)
    .lt("competence", competencia)
    .gt("pending_cents", 0)
    .not("tenant_id", "is", null);
  if (error) throw new Error("Não foi possível verificar os atrasos.");
  return new Set((data ?? []).map((e) => e.tenant_id as number));
}
