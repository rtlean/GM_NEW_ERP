import "server-only";
import { obterClienteServidor } from "./supabase/server";

// Conferência do relatório mensal por locador (US-5.3). Toda consulta filtra company_id = 1.
// Não apaga nada: desmarcar muda o status, e cada alteração fica na auditoria.

const EMPRESA_ID = 1;

export type ConferenciaRelatorio = {
  conferido: boolean;
  /** Nome de quem fez a última alteração. */
  conferidoPor: string | null;
  /** Momento da conferência (null quando desmarcado). */
  conferidoEm: string | null;
};

const NAO_CONFERIDO: ConferenciaRelatorio = { conferido: false, conferidoPor: null, conferidoEm: null };

export async function buscarConferencia(ownerId: number, competencia: string): Promise<ConferenciaRelatorio> {
  const cliente = obterClienteServidor();
  const { data, error } = await cliente
    .from("relatorio_conferencias")
    .select("conferido, conferido_por, conferido_em")
    .eq("company_id", EMPRESA_ID)
    .eq("owner_id", ownerId)
    .eq("competence", competencia)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar a conferência do relatório.");
  if (!data) return NAO_CONFERIDO;

  let nome: string | null = null;
  if (data.conferido_por) {
    const { data: usuario } = await cliente.from("users").select("name").eq("id", data.conferido_por).maybeSingle();
    nome = usuario?.name ?? null;
  }
  return { conferido: data.conferido, conferidoPor: nome, conferidoEm: data.conferido_em };
}

export async function definirConferencia({
  ownerId,
  competencia,
  conferido,
  usuarioId,
}: {
  ownerId: number;
  competencia: string;
  conferido: boolean;
  usuarioId: number;
}): Promise<void> {
  const cliente = obterClienteServidor();
  const agora = new Date().toISOString();
  const { error } = await cliente.from("relatorio_conferencias").upsert(
    {
      company_id: EMPRESA_ID,
      owner_id: ownerId,
      competence: competencia,
      conferido,
      conferido_por: usuarioId,
      conferido_em: conferido ? agora : null,
    },
    { onConflict: "company_id,owner_id,competence" },
  );
  if (error) throw new Error("Não foi possível salvar a conferência. Tente de novo.");

  // Auditoria: quem marcou ou desmarcou, para qual locador e competência. Se falhar duas vezes, avisa.
  const evento = {
    company_id: EMPRESA_ID,
    user_id: usuarioId,
    entity: "relatorio",
    entity_id: null,
    action: conferido ? "relatorio.conferido" : "relatorio.desconferido",
    metadata: JSON.stringify({ ownerId, competencia }),
  };
  const primeira = await cliente.from("audit_events").insert(evento);
  if (primeira.error) {
    const segunda = await cliente.from("audit_events").insert(evento);
    if (segunda.error) throw new Error("A conferência foi salva, mas não foi possível registrar na auditoria. Avise o dono do projeto.");
  }
}
