"use server";

import { redirect } from "next/navigation";
import { exigirAcesso, idUsuarioAtual } from "@/lib/acesso";
import { gravarLancamento, listarCategorias } from "@/lib/lancamentos";
import { competenciaValida, validarLancamento, type EntradaLancamento } from "@/lib/lancamentos-regras";

export type EstadoLancamento = { erro?: string; erros?: Partial<Record<keyof EntradaLancamento, string>> } | undefined;

/** Cria ou edita uma despesa do locador (US-4.4). Sem exclusão. */
export async function gravarLancamentoAction(_anterior: EstadoLancamento, formData: FormData): Promise<EstadoLancamento> {
  await exigirAcesso("lancamentos");

  const ownerId = Number(formData.get("ownerId"));
  const competencia = String(formData.get("competencia") ?? "");
  if (!Number.isInteger(ownerId) || ownerId <= 0) return { erro: "Escolha um locador." };
  if (!competenciaValida(competencia)) return { erro: "Competência inválida." };

  const editandoRaw = String(formData.get("lancamentoId") ?? "");
  const lancamentoId = editandoRaw === "" ? undefined : Number(editandoRaw);
  if (lancamentoId !== undefined && (!Number.isInteger(lancamentoId) || lancamentoId <= 0)) return { erro: "Lançamento inválido." };

  const categoriasAtivas = (await listarCategorias()).map((c) => c.id);
  const resultado = validarLancamento(
    {
      categoriaId: String(formData.get("categoriaId") ?? ""),
      imovelId: String(formData.get("imovelId") ?? ""),
      valor: String(formData.get("valor") ?? ""),
      data: String(formData.get("data") ?? ""),
      cobrarDe: String(formData.get("cobrarDe") ?? ""),
      descricao: String(formData.get("descricao") ?? ""),
      observacao: String(formData.get("observacao") ?? ""),
    },
    categoriasAtivas,
  );
  if (!resultado.ok) return { erro: "Confira os campos destacados.", erros: resultado.erros };

  const usuarioId = await idUsuarioAtual();
  if (!usuarioId) return { erro: "Sua sessão expirou. Entre de novo." };

  let id: number;
  try {
    id = await gravarLancamento({ ownerId, competencia, dados: resultado.dados, usuarioId, lancamentoId });
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Não foi possível gravar o lançamento." };
  }
  redirect(`/lancamentos?locador=${ownerId}&comp=${competencia}&salvo=${lancamentoId === undefined ? "novo" : "editado"}&id=${id}`);
}
