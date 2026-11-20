"use server";

import { redirect } from "next/navigation";
import { exigirAcesso, idUsuarioAtual } from "@/lib/acesso";
import { anexarDocumento } from "@/lib/contratos-documentos";
import { registrarAlteracaoAluguel } from "@/lib/contratos-aluguel";
import { encerrarContrato } from "@/lib/contratos-encerrar";
import { competenciaAtual, validarAlteracaoAluguel } from "@/lib/contratos-aluguel-regras";

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

export type EstadoAluguel = { erro?: string; erros?: Partial<Record<"competencia" | "valor" | "observacao", string>> } | undefined;

/** Altera o aluguel do contrato a partir de um mês (sem retroativo, sem proporcional). */
export async function alterarAluguelAction(_anterior: EstadoAluguel, formData: FormData): Promise<EstadoAluguel> {
  await exigirAcesso("contratos");

  const contratoId = Number(formData.get("contratoId"));
  if (!Number.isInteger(contratoId) || contratoId <= 0) return { erro: "Contrato inválido." };

  const resultado = validarAlteracaoAluguel(
    {
      competencia: String(formData.get("competencia") ?? ""),
      valor: String(formData.get("valor") ?? ""),
      observacao: String(formData.get("observacao") ?? ""),
    },
    competenciaAtual(),
  );
  if (!resultado.ok) return { erro: "Confira os campos destacados.", erros: resultado.erros };

  const usuarioId = await idUsuarioAtual();
  if (!usuarioId) return { erro: "Sua sessão expirou. Entre de novo." };

  try {
    await registrarAlteracaoAluguel({ contratoId, dados: resultado.dados, usuarioId });
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Não foi possível alterar o aluguel." };
  }
  redirect(`/contratos/${contratoId}?aluguel=${resultado.dados.competencia}`);
}

export type EstadoEncerrar = { erro?: string } | undefined;

/** Encerra o contrato com data de fim e confirmação pelo nome do locatário. Nada é apagado. */
export async function encerrarContratoAction(_anterior: EstadoEncerrar, formData: FormData): Promise<EstadoEncerrar> {
  await exigirAcesso("contratos");

  const contratoId = Number(formData.get("contratoId"));
  if (!Number.isInteger(contratoId) || contratoId <= 0) return { erro: "Contrato inválido." };

  const usuarioId = await idUsuarioAtual();
  if (!usuarioId) return { erro: "Sua sessão expirou. Entre de novo." };

  let ultimoMesCobrado: string;
  try {
    ({ ultimoMesCobrado } = await encerrarContrato({
      contratoId,
      dataFim: String(formData.get("dataFim") ?? ""),
      nomeDigitado: String(formData.get("nomeDigitado") ?? ""),
      usuarioId,
    }));
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Não foi possível encerrar o contrato." };
  }
  redirect(`/contratos/${contratoId}?encerrado=${ultimoMesCobrado}`);
}
