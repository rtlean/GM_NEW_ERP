"use server";

import { redirect } from "next/navigation";
import { exigirAcesso, idUsuarioAtual } from "@/lib/acesso";
import { anexarDocumento } from "@/lib/contratos-documentos";

export type EstadoAnexo = { erro?: string } | undefined;

/** Anexa (ou substitui) o PDF/Word do contrato. Quem tem a tela de contratos pode anexar. */
export async function anexarDocumentoAction(_anterior: EstadoAnexo, formData: FormData): Promise<EstadoAnexo> {
  await exigirAcesso("contratos");

  const contratoId = Number(formData.get("contratoId"));
  if (!Number.isInteger(contratoId) || contratoId <= 0) return { erro: "Contrato inválido." };

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) return { erro: "Escolha um arquivo .pdf ou .docx." };

  const usuarioId = await idUsuarioAtual();
  if (!usuarioId) return { erro: "Sua sessão expirou. Entre de novo." };

  let versao: number;
  try {
    ({ versao } = await anexarDocumento({ contratoId, arquivo, usuarioId }));
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Não foi possível anexar o arquivo." };
  }
  redirect(`/contratos/${contratoId}?anexado=${versao}`);
}
