import "server-only";
import { obterClienteServidor } from "./supabase/server";
import { listarImoveisParaSelecao } from "./imoveis";
import { listarLocatariosParaPainel } from "./locatarios";
import { dataDoBanco, hojeSaoPaulo, validarEncerramento } from "./contratos-encerrar-regras";

// Encerramento de contrato (US-3.8). Muda só o status e a data de fim. Nada é apagado.
// Toda consulta filtra company_id = 1.

const EMPRESA_ID = 1;

export type DadosParaEncerrar = {
  contratoId: number;
  status: string;
  inicio: string;
  locatarioNome: string;
  enderecoImovel: string | null;
};

/** Dados que a tela mostra para confirmar o encerramento (locatário, endereço e situação). */
export async function buscarParaEncerrar(contratoId: number): Promise<DadosParaEncerrar | null> {
  const { data, error } = await obterClienteServidor()
    .from("contracts")
    .select("id, tenant_id, property_id, status, start_date")
    .eq("company_id", EMPRESA_ID)
    .eq("id", contratoId)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o contrato.");
  if (!data) return null;

  const [locatarios, imoveis] = await Promise.all([listarLocatariosParaPainel(), listarImoveisParaSelecao()]);
  const locatario = locatarios.find((l) => l.id === data.tenant_id);
  const imovel = imoveis.find((i) => i.id === data.property_id);
  return {
    contratoId: data.id,
    status: data.status,
    inicio: data.start_date,
    locatarioNome: locatario?.nome ?? "",
    enderecoImovel: imovel?.endereco ?? null,
  };
}

export type EntradaEncerrar = { contratoId: number; dataFim: string; nomeDigitado: string; usuarioId: number };

/** Encerra o contrato: status vira "ended" e a data de fim é a escolhida. Só para contrato ativo. */
export async function encerrarContrato({ contratoId, dataFim, nomeDigitado, usuarioId }: EntradaEncerrar): Promise<{ ultimoMesCobrado: string }> {
  const dados = await buscarParaEncerrar(contratoId);
  if (!dados) throw new Error("Contrato não encontrado.");

  const conferido = validarEncerramento(
    { dataFim, nomeDigitado },
    { hoje: hojeSaoPaulo(), inicio: dataDoBanco(dados.inicio), nomeLocatario: dados.locatarioNome, status: dados.status },
  );
  if (!conferido.ok) {
    const primeiro = Object.values(conferido.erros)[0];
    throw new Error(primeiro ?? "Não foi possível encerrar o contrato.");
  }

  const db = obterClienteServidor();
  const { data: atualizado, error } = await db
    .from("contracts")
    .update({ status: "ended", end_date: `${conferido.dataFim}T00:00:00-03:00` })
    .eq("company_id", EMPRESA_ID)
    .eq("id", contratoId)
    .eq("status", "active")
    .select("id");
  if (error) throw new Error("Não foi possível encerrar o contrato. Tente de novo.");
  if (!atualizado || atualizado.length === 0) throw new Error("Este contrato já não está ativo.");

  const evento = {
    company_id: EMPRESA_ID,
    user_id: usuarioId,
    entity: "contract",
    entity_id: contratoId,
    action: "contract.ended",
    metadata: JSON.stringify({ dataFim: conferido.dataFim, ultimoMesCobrado: conferido.ultimoMesCobrado }),
  };
  // Regra do projeto: não apagar registro. Se a auditoria falhar duas vezes, o encerramento fica e a tela avisa.
  const primeira = await db.from("audit_events").insert(evento);
  if (primeira.error) {
    const segunda = await db.from("audit_events").insert(evento);
    if (segunda.error) {
      throw new Error("O contrato foi encerrado, mas não foi possível registrar na auditoria. Avise o dono do projeto.");
    }
  }
  return { ultimoMesCobrado: conferido.ultimoMesCobrado };
}
