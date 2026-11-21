import "server-only";
import { obterClienteServidor } from "./supabase/server";
import { ehEtapa, type Etapa, type NovoLead, type TipoNegocio } from "./pipeline-regras";

// Pipeline (US-P.1). Toda consulta filtra company_id = 1. Nada é apagado: um negócio só muda de etapa.

const EMPRESA_ID = 1;

export type Negocio = {
  id: number;
  nome: string;
  tipo: TipoNegocio;
  imovel: string | null;
  valorCentavos: number;
  etapa: Etapa;
  proximoPasso: string | null;
  urgente: boolean;
};

export async function listarNegocios(): Promise<Negocio[]> {
  const { data, error } = await obterClienteServidor()
    .from("pipeline_negocios")
    .select("id, nome, tipo, imovel, valor_centavos, etapa, proximo_passo, urgente")
    .eq("company_id", EMPRESA_ID)
    .order("criado_em", { ascending: false });
  if (error) throw new Error("Não foi possível carregar o pipeline.");

  return (data ?? []).flatMap((linha) => {
    // Etapa fora das cinco colunas não deve existir (o banco impede); se existir, o cartão não é mostrado com etapa inventada.
    if (!ehEtapa(linha.etapa)) return [];
    return [
      {
        id: linha.id,
        nome: linha.nome,
        tipo: linha.tipo as TipoNegocio,
        imovel: linha.imovel,
        valorCentavos: linha.valor_centavos,
        etapa: linha.etapa,
        proximoPasso: linha.proximo_passo,
        urgente: linha.urgente,
      },
    ];
  });
}

/** Cria o lead na primeira etapa (Prospecção). Quem criou fica registrado. */
export async function criarNegocio(lead: NovoLead, usuarioId: number): Promise<number> {
  const cliente = obterClienteServidor();
  const { data, error } = await cliente
    .from("pipeline_negocios")
    .insert({
      company_id: EMPRESA_ID,
      nome: lead.nome,
      tipo: lead.tipo,
      imovel: lead.imovel,
      valor_centavos: lead.valorCentavos,
      etapa: "Prospecção",
      urgente: true,
      proximo_passo: "Fazer primeiro contato",
      criado_por: usuarioId,
      atualizado_por: usuarioId,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("Não foi possível salvar o lead. Tente de novo.");

  await registrarAuditoria({ acao: "pipeline.criado", entidadeId: data.id, usuarioId, metadata: { etapa: "Prospecção" } });
  return data.id;
}

/** Muda a etapa de um negócio. Mesma etapa não grava nada. */
export async function moverNegocio({ id, para, usuarioId }: { id: number; para: Etapa; usuarioId: number }): Promise<void> {
  const cliente = obterClienteServidor();
  const { data: atual, error: erroBusca } = await cliente
    .from("pipeline_negocios")
    .select("etapa")
    .eq("company_id", EMPRESA_ID)
    .eq("id", id)
    .maybeSingle();
  if (erroBusca) throw new Error("Não foi possível carregar o negócio.");
  if (!atual || !ehEtapa(atual.etapa)) throw new Error("Negócio não encontrado.");
  if (atual.etapa === para) return;

  const { error } = await cliente
    .from("pipeline_negocios")
    .update({ etapa: para, atualizado_em: new Date().toISOString(), atualizado_por: usuarioId })
    .eq("company_id", EMPRESA_ID)
    .eq("id", id);
  if (error) throw new Error("Não foi possível mover o negócio. Tente de novo.");

  await registrarAuditoria({ acao: "pipeline.movido", entidadeId: id, usuarioId, metadata: { de: atual.etapa, para } });
}

/** Auditoria: tenta duas vezes. Se falhar nas duas, a alteração fica gravada e a tela avisa. */
async function registrarAuditoria({
  acao,
  entidadeId,
  usuarioId,
  metadata,
}: {
  acao: "pipeline.criado" | "pipeline.movido";
  entidadeId: number;
  usuarioId: number;
  metadata: Record<string, string>;
}): Promise<void> {
  const cliente = obterClienteServidor();
  const evento = {
    company_id: EMPRESA_ID,
    user_id: usuarioId,
    entity: "pipeline",
    entity_id: entidadeId,
    action: acao,
    metadata: JSON.stringify(metadata),
  };
  const primeira = await cliente.from("audit_events").insert(evento);
  if (!primeira.error) return;
  const segunda = await cliente.from("audit_events").insert(evento);
  if (segunda.error) throw new Error("A alteração foi salva, mas não foi possível registrar na auditoria. Avise o dono do projeto.");
}
