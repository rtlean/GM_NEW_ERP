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

export type EntradaGerar = { competencia: string; usuarioId: number };

export async function gerarCobrancasDoMes({ competencia, usuarioId }: EntradaGerar): Promise<ResumoGeracao> {
  const db = obterClienteServidor();
  const [contratos, imoveis] = await Promise.all([listarContratosAtivosNaCompetencia(competencia), listarImoveisParaSelecao()]);
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
    const { error } = await db.from("monthly_entries").insert(lote.map((c) => linhaDaCobranca(c, usuarioId)));
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
