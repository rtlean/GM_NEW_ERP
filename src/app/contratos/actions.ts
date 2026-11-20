"use server";

import { redirect } from "next/navigation";
import { exigirAcesso } from "@/lib/acesso";
import { validarLocatario } from "@/lib/cadastro-locatario";
import { criarContrato } from "@/lib/contratos";
import { validarContrato, type EntradaContrato } from "@/lib/contratos-regras";
import { locatarioComDocumento, salvarLocatario } from "@/lib/locatarios";

export type EstadoNovoContrato = { erro?: string; erros?: Partial<Record<string, string>> } | undefined;

/** Grava o contrato escolhido no assistente. Se o locatário for novo, cadastra antes. */
export async function criarContratoAction(_anterior: EstadoNovoContrato, formData: FormData): Promise<EstadoNovoContrato> {
  await exigirAcesso("contratos");

  const locadorId = Number(formData.get("locadorId"));
  const imovelId = Number(formData.get("imovelId"));
  if (!Number.isInteger(locadorId) || locadorId <= 0) return { erro: "Escolha o locador." };
  if (!Number.isInteger(imovelId) || imovelId <= 0) return { erro: "Escolha o imóvel." };

  const entrada: EntradaContrato = {
    aluguel: String(formData.get("aluguel") ?? ""),
    dia: String(formData.get("dia") ?? ""),
    inicio: String(formData.get("inicio") ?? ""),
    fim: String(formData.get("fim") ?? ""),
    indice: String(formData.get("indice") ?? ""),
    garantia: String(formData.get("garantia") ?? ""),
    taxa: String(formData.get("taxa") ?? ""),
  };
  const condicoes = validarContrato(entrada);
  if (!condicoes.ok) return { erro: "Confira os campos destacados.", erros: condicoes.erros };

  let locatarioId = Number(formData.get("locatarioId"));
  if (formData.get("locatarioId") === "novo") {
    const novo = validarLocatario({
      nome: String(formData.get("nomeNovo") ?? ""),
      documento: String(formData.get("documentoNovo") ?? ""),
      rg: "",
      email: "",
      whatsapp: "",
      observacoes: "",
    });
    if (!novo.ok) return { erro: "Confira os dados do novo locatário.", erros: { nomeNovo: novo.erros.nome, documentoNovo: novo.erros.documento } };
    const jaExiste = await locatarioComDocumento(novo.dados.cpf);
    if (jaExiste) return { erro: `Já existe um locatário com este CPF/CNPJ: ${jaExiste.nome}. Escolha-o na lista.` };
    locatarioId = await salvarLocatario(novo.dados);
  }
  if (!Number.isInteger(locatarioId) || locatarioId <= 0) return { erro: "Escolha o locatário." };

  const resultado = await criarContrato({ locadorId, imovelId, locatarioId, dados: condicoes.dados });
  if (!resultado.ok) return { erro: resultado.erro };

  redirect(`/contratos?criado=${resultado.id}`);
}
