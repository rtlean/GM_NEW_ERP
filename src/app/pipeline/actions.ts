"use server";

import { revalidatePath } from "next/cache";
import { exigirAcesso, idUsuarioAtual } from "@/lib/acesso";
import { criarNegocio, moverNegocio } from "@/lib/pipeline";
import { ehEtapa, validarNovoLead, type CampoLead, type EntradaNovoLead } from "@/lib/pipeline-regras";

export type EstadoNovoLead =
  | { ok: true; nome: string }
  | { ok: false; erroGeral?: string; erros?: Partial<Record<CampoLead, string>> }
  | undefined;

/** Cria um lead em Prospecção (US-P.1). Valida de novo no servidor, não confia só na tela. */
export async function criarLeadAction(_anterior: EstadoNovoLead, formData: FormData): Promise<EstadoNovoLead> {
  await exigirAcesso("pipeline");

  const entrada: EntradaNovoLead = {
    nome: String(formData.get("nome") ?? ""),
    tipo: String(formData.get("tipo") ?? ""),
    valor: String(formData.get("valor") ?? ""),
    imovel: String(formData.get("imovel") ?? ""),
    telefone: String(formData.get("telefone") ?? ""),
    email: String(formData.get("email") ?? ""),
    origem: String(formData.get("origem") ?? ""),
    cidade: String(formData.get("cidade") ?? ""),
  };
  const checagem = validarNovoLead(entrada);
  if (!checagem.ok) return { ok: false, erros: checagem.erros };

  const usuarioId = await idUsuarioAtual();
  if (!usuarioId) return { ok: false, erroGeral: "Sua sessão expirou. Entre de novo." };

  try {
    await criarNegocio(checagem.lead, usuarioId);
  } catch (erro) {
    return { ok: false, erroGeral: erro instanceof Error ? erro.message : "Não foi possível salvar o lead." };
  }
  revalidatePath("/pipeline");
  return { ok: true, nome: checagem.lead.nome };
}

/** Muda a etapa de um negócio. Só aceita uma das cinco colunas (quatro de venda e Lead Frio). */
export async function moverNegocioAction(id: number, etapa: string): Promise<{ erro?: string }> {
  await exigirAcesso("pipeline");

  if (!Number.isInteger(id) || id <= 0 || !ehEtapa(etapa)) return { erro: "Não foi possível mover o negócio." };

  const usuarioId = await idUsuarioAtual();
  if (!usuarioId) return { erro: "Sua sessão expirou. Entre de novo." };

  try {
    await moverNegocio({ id, para: etapa, usuarioId });
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Não foi possível mover o negócio." };
  }
  revalidatePath("/pipeline");
  return {};
}
