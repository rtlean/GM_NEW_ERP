"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAcesso } from "@/lib/acesso";
import { validarLocatario, type EntradaLocatario } from "@/lib/cadastro-locatario";
import { locatarioComDocumento, locatarioComNome, salvarLocatario } from "@/lib/locatarios";

// Cadastro e edição de locatário. Confere o acesso no servidor antes de gravar.

export type EstadoLocatario = {
  erroGeral?: string;
  erros?: Partial<Record<keyof EntradaLocatario, string>>;
};

function lerEntrada(formData: FormData): EntradaLocatario {
  const texto = (campo: string) => String(formData.get(campo) ?? "");
  return {
    nome: texto("nome"),
    documento: texto("documento"),
    rg: texto("rg"),
    email: texto("email"),
    whatsapp: texto("whatsapp"),
    observacoes: texto("observacoes"),
  };
}

export async function salvarLocatarioAction(_anterior: EstadoLocatario | undefined, formData: FormData): Promise<EstadoLocatario> {
  await exigirAcesso("locatarios");

  const idTexto = String(formData.get("id") ?? "");
  const id = idTexto ? Number(idTexto) : undefined;
  if (id !== undefined && (!Number.isInteger(id) || id <= 0)) return { erroGeral: "Locatário inválido." };

  const resultado = validarLocatario(lerEntrada(formData));
  if (!resultado.ok) return { erros: resultado.erros };

  let gravadoId: number;
  try {
    const duplicadoDocumento = await locatarioComDocumento(resultado.dados.document, id);
    if (duplicadoDocumento) {
      return { erros: { documento: `Este CPF ou CNPJ já pertence a ${duplicadoDocumento.nome}. Use o cadastro existente.` } };
    }
    // Regra do design: nome repetido não cria outro cadastro na inclusão. Na edição, não é checado.
    if (!id) {
      const duplicadoNome = await locatarioComNome(resultado.dados.full_name);
      if (duplicadoNome) {
        return { erros: { nome: "Já existe um locatário com este nome. Confira se é a mesma pessoa antes de criar outro." } };
      }
    }
    gravadoId = await salvarLocatario(resultado.dados, id);
  } catch (erro) {
    return { erroGeral: erro instanceof Error ? erro.message : "Não foi possível salvar. Tente de novo." };
  }

  revalidatePath("/locatarios");
  redirect(`/locatarios?id=${gravadoId}&salvo=${id ? "editado" : "criado"}`);
}
