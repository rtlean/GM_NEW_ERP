"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAcesso } from "@/lib/acesso";
import { validarLocatario, type EntradaLocatario } from "@/lib/cadastro-locatario";
import { locatarioComDocumento, salvarLocatario } from "@/lib/locatarios";

// Cadastro e edição de locatário. Confere o acesso no servidor antes de gravar.

export type EstadoLocatario = {
  erroGeral?: string;
  erros?: Partial<Record<keyof EntradaLocatario, string>>;
};

export async function salvarLocatarioAction(_anterior: EstadoLocatario | undefined, formData: FormData): Promise<EstadoLocatario> {
  await exigirAcesso("locatarios");

  const idTexto = String(formData.get("id") ?? "");
  const id = idTexto ? Number(idTexto) : undefined;
  if (id !== undefined && (!Number.isInteger(id) || id <= 0)) return { erroGeral: "Locatário inválido." };

  const texto = (campo: string) => String(formData.get(campo) ?? "");
  const resultado = validarLocatario({
    nome: texto("nome"),
    documento: texto("documento"),
    email: texto("email"),
    whatsapp: texto("whatsapp"),
    locadores: formData.getAll("locadores").map(String),
  });
  if (!resultado.ok) return { erros: resultado.erros };

  let gravadoId: number;
  try {
    const existente = await locatarioComDocumento(resultado.dados.document, id);
    if (existente) return { erros: { documento: `Já existe: ${existente.nome}` } };
    gravadoId = await salvarLocatario(resultado.dados, resultado.locadorIds, id);
  } catch (erro) {
    return { erroGeral: erro instanceof Error ? erro.message : "Não foi possível salvar. Tente de novo." };
  }

  revalidatePath("/locatarios");
  redirect(`/locatarios?id=${gravadoId}`);
}
