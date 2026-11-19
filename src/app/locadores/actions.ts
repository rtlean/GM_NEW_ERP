"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAcesso } from "@/lib/acesso";
import { validarLocador, type EntradaLocador } from "@/lib/cadastro-locador";
import { buscarLocadorPorDocumento, salvarLocador } from "@/lib/locadores-cadastro";

// Ação de cadastro e edição de locador. Confere o acesso no servidor antes de qualquer gravação.

export type EstadoLocador = {
  erroGeral?: string;
  erros?: Partial<Record<keyof EntradaLocador, string>>;
  duplicado?: { id: number; nome: string };
};

function lerEntrada(formData: FormData): EntradaLocador {
  const texto = (campo: string) => String(formData.get(campo) ?? "");
  return {
    nome: texto("nome"),
    documento: texto("documento"),
    email: texto("email"),
    cidade: texto("cidade"),
    whatsapp: texto("whatsapp"),
    taxa: texto("taxa"),
    formaRepasse: texto("formaRepasse"),
    tipoPix: texto("tipoPix"),
    chavePix: texto("chavePix"),
    banco: texto("banco"),
    codigoBanco: texto("codigoBanco"),
    agencia: texto("agencia"),
    conta: texto("conta"),
    digitoConta: texto("digitoConta"),
    tipoConta: texto("tipoConta"),
  };
}

export async function salvarLocadorAction(_anterior: EstadoLocador | undefined, formData: FormData): Promise<EstadoLocador> {
  await exigirAcesso("locadores");

  const idTexto = String(formData.get("id") ?? "");
  const id = idTexto ? Number(idTexto) : undefined;
  if (id !== undefined && (!Number.isInteger(id) || id <= 0)) return { erroGeral: "Locador inválido." };

  const resultado = validarLocador(lerEntrada(formData));
  if (!resultado.ok) return { erros: resultado.erros };

  let gravadoId: number;
  try {
    const existente = await buscarLocadorPorDocumento(resultado.dados.document, id);
    if (existente) return { erros: { documento: `Já existe: ${existente.nome}` }, duplicado: existente };
    gravadoId = await salvarLocador(resultado.dados, id);
  } catch (erro) {
    return { erroGeral: erro instanceof Error ? erro.message : "Não foi possível salvar. Tente de novo." };
  }

  revalidatePath("/locadores");
  redirect(`/locadores?id=${gravadoId}`);
}
