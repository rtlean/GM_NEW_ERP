import "server-only";
import { obterClienteServidor } from "./supabase/server";
import { aluguelVigente, type MudancaAluguel } from "./aluguel";
import type { AlteracaoAluguel } from "./contratos-aluguel-regras";

// Alteração de aluguel por mês (US-3.7). Cada alteração é uma linha nova em contract_rent_changes.
// Nada é alterado nem apagado. Toda consulta filtra company_id = 1.

const EMPRESA_ID = 1;

export type ContratoComAluguel = { id: number; rent_cents: number; start_date: string };

export type LinhaHistorico = {
  id: number;
  efetivaEm: string;
  anteriorCentavos: number | null;
  novoCentavos: number;
  observacao: string | null;
  feitoPor: string;
  feitoEm: string;
};

/** Histórico de alterações do contrato, da mais recente para a mais antiga. */
export async function listarHistoricoAluguel(contratoId: number): Promise<LinhaHistorico[]> {
  const db = obterClienteServidor();
  const { data, error } = await db
    .from("contract_rent_changes")
    .select("id, rent_cents, previous_rent_cents, effective_date, note, created_by, created_at")
    .eq("company_id", EMPRESA_ID)
    .eq("contract_id", contratoId)
    .order("effective_date", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw new Error("Não foi possível carregar o histórico de aluguel.");

  const ids = [...new Set((data ?? []).map((l) => l.created_by))];
  const nomes = new Map<number, string>();
  if (ids.length > 0) {
    const { data: usuarios } = await db.from("users").select("id, name, email").in("id", ids);
    for (const u of usuarios ?? []) nomes.set(u.id, u.name || u.email || "Usuário");
  }

  return (data ?? []).map((l) => ({
    id: l.id,
    efetivaEm: l.effective_date,
    anteriorCentavos: l.previous_rent_cents,
    novoCentavos: l.rent_cents,
    observacao: l.note,
    feitoPor: nomes.get(l.created_by) ?? "Usuário",
    feitoEm: l.created_at,
  }));
}

/**
 * Aluguel que vale no mês para cada contrato (regra do mês inteiro, em src/lib/aluguel.ts).
 * Lê todas as alterações de uma vez, para a lista e o Dashboard não fazerem uma consulta por contrato.
 */
export async function aluguelNoMesPorContrato(contratos: ContratoComAluguel[], competencia: string): Promise<Map<number, number>> {
  const mapa = new Map<number, number>();
  if (contratos.length === 0) return mapa;

  const { data, error } = await obterClienteServidor()
    .from("contract_rent_changes")
    .select("id, contract_id, rent_cents, effective_date")
    .eq("company_id", EMPRESA_ID)
    .in("contract_id", contratos.map((c) => c.id));
  if (error) throw new Error("Não foi possível carregar as alterações de aluguel.");

  const porContrato = new Map<number, MudancaAluguel[]>();
  for (const m of data ?? []) {
    const lista = porContrato.get(m.contract_id) ?? [];
    lista.push({ id: m.id, rent_cents: m.rent_cents, effective_date: m.effective_date });
    porContrato.set(m.contract_id, lista);
  }

  for (const c of contratos) {
    const vigente = aluguelVigente(
      { rent_cents: c.rent_cents, start_date: c.start_date },
      porContrato.get(c.id) ?? [],
      competencia,
    );
    // Mês antes do início do contrato: vale o aluguel original do contrato.
    mapa.set(c.id, vigente ?? c.rent_cents);
  }
  return mapa;
}

export type EntradaRegistro = { contratoId: number; dados: AlteracaoAluguel; usuarioId: number };

/** Grava a alteração de aluguel a partir do mês escolhido. Só para contrato ativo. */
export async function registrarAlteracaoAluguel({ contratoId, dados, usuarioId }: EntradaRegistro): Promise<void> {
  const db = obterClienteServidor();
  const { data: contrato, error: erroContrato } = await db
    .from("contracts")
    .select("id, rent_cents, start_date, status")
    .eq("company_id", EMPRESA_ID)
    .eq("id", contratoId)
    .maybeSingle();
  if (erroContrato) throw new Error("Não foi possível carregar o contrato.");
  if (!contrato) throw new Error("Contrato não encontrado.");
  if (contrato.status !== "active") throw new Error("Só é possível alterar o aluguel de contrato ativo.");

  const { data: mudancas, error: erroMudancas } = await db
    .from("contract_rent_changes")
    .select("id, rent_cents, effective_date")
    .eq("company_id", EMPRESA_ID)
    .eq("contract_id", contratoId);
  if (erroMudancas) throw new Error("Não foi possível carregar o histórico de aluguel.");

  const anterior = aluguelVigente(
    { rent_cents: contrato.rent_cents ?? 0, start_date: contrato.start_date },
    mudancas ?? [],
    dados.competencia,
  );
  if (anterior === null) throw new Error("Este mês é anterior ao início do contrato.");

  const { data: registro, error: erroRegistro } = await db
    .from("contract_rent_changes")
    .insert({
      company_id: EMPRESA_ID,
      contract_id: contratoId,
      rent_cents: dados.rentCents,
      previous_rent_cents: anterior,
      effective_date: dados.efetivaEm,
      note: dados.observacao,
      created_by: usuarioId,
    })
    .select("id")
    .single();
  if (erroRegistro || !registro) throw new Error("Não foi possível gravar a alteração. Tente de novo.");

  const evento = {
    company_id: EMPRESA_ID,
    user_id: usuarioId,
    entity: "contract",
    entity_id: contratoId,
    action: "contract.rent_changed",
    metadata: JSON.stringify({ competencia: dados.competencia, anteriorCentavos: anterior, novoCentavos: dados.rentCents, observacao: dados.observacao }),
  };
  // Regra do projeto: não apagar registro de negócio. Se a auditoria falhar duas vezes, a alteração fica gravada e o erro avisa.
  const primeira = await db.from("audit_events").insert(evento);
  if (!primeira.error) return;
  const segunda = await db.from("audit_events").insert(evento);
  if (segunda.error) {
    throw new Error(
      `A alteração foi gravada (registro ${registro.id}), mas não foi possível registrar na auditoria. Avise o dono do projeto.`,
    );
  }
}
