import "server-only";
import { obterClienteServidor } from "./supabase/server";
import {
  caminhoDocumento,
  tipoPorMime,
  TIPOS,
  validarDocumento,
  type TipoDocumento,
} from "./contratos-documentos-regras";

// Arquivo do contrato (US-3.6): PDF ou Word guardado no bucket privado "contract-documents".
// Cada envio vira uma nova versão em contract_documents; a versão anterior nunca é apagada.
// Toda consulta filtra company_id = 1.

const EMPRESA_ID = 1;
const BUCKET = "contract-documents";

export type DocumentoAtual = {
  id: number;
  versao: number;
  nomeArquivo: string;
  tipo: TipoDocumento;
  criadoEm: string;
};

/** Arquivo atual do contrato (maior versão). Null se o contrato ainda não tem arquivo. */
export async function documentoAtual(contratoId: number): Promise<DocumentoAtual | null> {
  const { data, error } = await obterClienteServidor()
    .from("contract_documents")
    .select("id, version, file_name, mime_type, created_at")
    .eq("company_id", EMPRESA_ID)
    .eq("contract_id", contratoId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o arquivo do contrato.");
  if (!data) return null;

  const tipo = tipoPorMime(data.mime_type);
  if (!tipo) return null;
  return { id: data.id, versao: data.version, nomeArquivo: data.file_name, tipo, criadoEm: data.created_at };
}

/** Chave no Storage do arquivo atual (uso interno do servidor). */
async function chaveDoArquivoAtual(contratoId: number, versao: number): Promise<string | null> {
  const { data } = await obterClienteServidor()
    .from("contract_documents")
    .select("storage_key")
    .eq("company_id", EMPRESA_ID)
    .eq("contract_id", contratoId)
    .eq("version", versao)
    .maybeSingle();
  return data?.storage_key ?? null;
}

export type EntradaAnexo = { contratoId: number; arquivo: File; usuarioId: number };

/** Anexa um PDF ou Word ao contrato. Se já existir arquivo, cria a versão seguinte e registra na auditoria. */
export async function anexarDocumento({ contratoId, arquivo, usuarioId }: EntradaAnexo): Promise<{ versao: number; substituiu: boolean }> {
  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const conferencia = validarDocumento({ nome: arquivo.name, bytes });
  if (!conferencia.ok) throw new Error(conferencia.erro);
  const tipo = conferencia.tipo;

  const db = obterClienteServidor();
  const { data: contrato, error: erroContrato } = await db
    .from("contracts")
    .select("id")
    .eq("company_id", EMPRESA_ID)
    .eq("id", contratoId)
    .maybeSingle();
  if (erroContrato) throw new Error("Não foi possível carregar o contrato.");
  if (!contrato) throw new Error("Contrato não encontrado.");

  const anterior = await documentoAtual(contratoId);
  const versao = anterior ? anterior.versao + 1 : 1;
  const chave = caminhoDocumento(EMPRESA_ID, contratoId, versao, arquivo.name, tipo);

  const { error: erroEnvio } = await db.storage.from(BUCKET).upload(chave, bytes, {
    contentType: TIPOS[tipo].mime,
    upsert: false,
  });
  if (erroEnvio) throw new Error("Não foi possível guardar o arquivo. Tente de novo.");

  const { data: registro, error: erroRegistro } = await db
    .from("contract_documents")
    .insert({
      company_id: EMPRESA_ID,
      contract_id: contratoId,
      file_name: arquivo.name.slice(0, 255),
      mime_type: TIPOS[tipo].mime,
      storage_key: chave,
      storage_url: `/api/contratos/${contratoId}/arquivo`,
      version: versao,
      created_by: usuarioId,
      updated_by: usuarioId,
    })
    .select("id")
    .single();
  if (erroRegistro || !registro) {
    await db.storage.from(BUCKET).remove([chave]);
    throw new Error("Não foi possível registrar o arquivo. Tente de novo.");
  }

  const { error: erroAuditoria } = await db.from("audit_events").insert({
    company_id: EMPRESA_ID,
    user_id: usuarioId,
    entity: "contract",
    entity_id: contratoId,
    action: anterior ? "contract.document_replaced" : "contract.document_uploaded",
    metadata: JSON.stringify({ versao, versaoAnterior: anterior?.versao ?? null, arquivo: arquivo.name, tipo }),
  });
  if (erroAuditoria) {
    // Sem registro na auditoria, o envio é desfeito para não ficar arquivo sem histórico.
    await db.from("contract_documents").delete().eq("id", registro.id);
    await db.storage.from(BUCKET).remove([chave]);
    throw new Error("Não foi possível registrar o envio na auditoria. Tente de novo.");
  }

  return { versao, substituiu: anterior !== null };
}

/** Baixa o arquivo atual do contrato para entregar ao usuário logado. Null se não houver arquivo. */
export async function baixarDocumentoAtual(contratoId: number): Promise<{ bytes: Uint8Array; documento: DocumentoAtual } | null> {
  const documento = await documentoAtual(contratoId);
  if (!documento) return null;
  const chave = await chaveDoArquivoAtual(contratoId, documento.versao);
  if (!chave) return null;

  const { data, error } = await obterClienteServidor().storage.from(BUCKET).download(chave);
  if (error || !data) throw new Error("Não foi possível abrir o arquivo do contrato.");
  return { bytes: new Uint8Array(await data.arrayBuffer()), documento };
}
