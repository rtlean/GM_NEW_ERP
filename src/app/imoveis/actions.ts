"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAcesso } from "@/lib/acesso";
import { validarImovel, type EntradaImovel } from "@/lib/cadastro-imovel";
import { salvarImovel } from "@/lib/imoveis-cadastro";

// Cadastro e edição de imóvel. Confere o acesso no servidor antes de gravar.

export type EstadoImovel = {
  erroGeral?: string;
  erros?: Partial<Record<keyof EntradaImovel, string>>;
};

export async function salvarImovelAction(_anterior: EstadoImovel | undefined, formData: FormData): Promise<EstadoImovel> {
  await exigirAcesso("imoveis");

  const idTexto = String(formData.get("id") ?? "");
  const id = idTexto ? Number(idTexto) : undefined;
  if (id !== undefined && (!Number.isInteger(id) || id <= 0)) return { erroGeral: "Imóvel inválido." };

  const texto = (campo: string) => String(formData.get(campo) ?? "");
  const situacaoAtual = texto("situacaoAtual") || undefined;
  const resultado = validarImovel(
    {
      ownerId: texto("ownerId"),
      nome: texto("nome"),
      tipo: texto("tipo"),
      finalidade: texto("finalidade"),
      situacao: texto("situacao"),
      cep: texto("cep"),
      endereco: texto("endereco"),
      numero: texto("numero"),
      complemento: texto("complemento"),
      bairro: texto("bairro"),
      cidade: texto("cidade"),
      uf: texto("uf"),
      matricula: texto("matricula"),
      inscricaoIptu: texto("inscricaoIptu"),
      quartos: texto("quartos"),
      suites: texto("suites"),
      banheiros: texto("banheiros"),
      vagas: texto("vagas"),
      areaUtil: texto("areaUtil"),
      areaTotal: texto("areaTotal"),
      andar: texto("andar"),
      mobilia: texto("mobilia"),
      pets: texto("pets"),
      comodidades: formData.getAll("comodidades").map(String),
      aluguel: texto("aluguel"),
      valorVenda: texto("valorVenda"),
      condominio: texto("condominio"),
      iptu: texto("iptu"),
    },
    situacaoAtual,
  );
  if (!resultado.ok) return { erros: resultado.erros };

  let gravadoId: number;
  try {
    gravadoId = await salvarImovel(resultado.dados, id);
  } catch (erro) {
    return { erroGeral: erro instanceof Error ? erro.message : "Não foi possível salvar. Tente de novo." };
  }

  revalidatePath("/imoveis");
  redirect(`/imoveis?id=${gravadoId}&salvo=1`);
}
