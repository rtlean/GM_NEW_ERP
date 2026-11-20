"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAcesso } from "@/lib/acesso";
import { gerarSenhaProvisoria, senhaAtendeRegras } from "@/lib/senha";
import { buscarUsuario, criarOperacional, definirBloqueio, editarContato, redefinirSenha, salvarTelas } from "@/lib/usuarios";
import { GRUPOS_DE_TELAS, MODELOS_DE_ACESSO } from "@/lib/permissoes";

// Todas as ações conferem o acesso no servidor: só o admin passa por exigirAcesso("usuarios").

const MENSAGEM_PADRAO = "Não foi possível concluir. Tente de novo.";

function mensagemDeErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : MENSAGEM_PADRAO;
}

function idDoFormulario(formData: FormData): number {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Usuário inválido.");
  return id;
}

export type EstadoCriar = { erro?: string; senha?: string; id?: number; nome?: string };

/** Cria o operacional com a senha provisória do formulário (gerada no botão "Gerar"); ela aparece uma única vez. */
export async function criarUsuarioAction(_anterior: EstadoCriar | undefined, formData: FormData): Promise<EstadoCriar> {
  await exigirAcesso("usuarios");
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  if (!nome) return { erro: "Informe o nome." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erro: "Informe um e-mail válido." };
  if (!senhaAtendeRegras(senha)) return { erro: "A senha provisória precisa ter 10 caracteres ou mais, com letras e números." };

  try {
    const id = await criarOperacional(nome, email, senha);
    revalidatePath("/usuarios");
    return { senha, id, nome };
  } catch (erro) {
    return { erro: mensagemDeErro(erro) };
  }
}

export type EstadoSenha = { erro?: string; senha?: string };

/** Redefine a senha e mostra a nova senha provisória uma única vez. */
export async function redefinirSenhaAction(_anterior: EstadoSenha | undefined, formData: FormData): Promise<EstadoSenha> {
  await exigirAcesso("usuarios");
  try {
    const senha = gerarSenhaProvisoria();
    await redefinirSenha(idDoFormulario(formData), senha);
    revalidatePath("/usuarios");
    return { senha };
  } catch (erro) {
    return { erro: mensagemDeErro(erro) };
  }
}

function voltarPara(id: number, params: string): never {
  redirect(`/usuarios?u=${id}&${params}`);
}

export async function salvarContatoAction(formData: FormData) {
  await exigirAcesso("usuarios");
  const id = idDoFormulario(formData);
  try {
    await editarContato(id, String(formData.get("nome") ?? ""), String(formData.get("email") ?? ""));
  } catch (erro) {
    voltarPara(id, `erro=${encodeURIComponent(mensagemDeErro(erro))}`);
  }
  revalidatePath("/usuarios");
  voltarPara(id, "ok=dados");
}

export async function bloquearAction(formData: FormData) {
  await exigirAcesso("usuarios");
  const id = idDoFormulario(formData);
  const bloquear = formData.get("bloqueado") === "1";
  try {
    await definirBloqueio(id, bloquear);
  } catch (erro) {
    voltarPara(id, `erro=${encodeURIComponent(mensagemDeErro(erro))}`);
  }
  revalidatePath("/usuarios");
  voltarPara(id, bloquear ? "ok=bloqueado" : "ok=liberado");
}

/** Salva as telas marcadas, ou aplica "Liberar todas" / "Restringir todas" de um grupo (grupo=liberar:chave ou restringir:chave). */
export async function salvarTelasAction(formData: FormData) {
  await exigirAcesso("usuarios");
  const id = idDoFormulario(formData);
  try {
    const grupo = String(formData.get("grupo") ?? "");
    let telas: string[];
    const modelo = String(formData.get("modelo") ?? "");
    if (modelo) {
      const escolhido = MODELOS_DE_ACESSO.find((m) => m.chave === modelo);
      if (!escolhido) throw new Error("Modelo de acesso não encontrado.");
      telas = escolhido.telas;
    } else if (grupo) {
      const [acao, chave] = grupo.split(":");
      const usuario = await buscarUsuario(id);
      if (!usuario) throw new Error("Usuário não encontrado nesta empresa.");
      const doGrupo = GRUPOS_DE_TELAS.find((g) => g.chave === chave)?.telas.map((t) => t.chave) ?? [];
      const atuais = usuario.telas.filter((t) => !doGrupo.includes(t));
      telas = acao === "liberar" ? [...atuais, ...doGrupo] : atuais;
    } else {
      telas = formData.getAll("tela").map(String);
    }
    await salvarTelas(id, telas);
  } catch (erro) {
    voltarPara(id, `erro=${encodeURIComponent(mensagemDeErro(erro))}`);
  }
  revalidatePath("/usuarios");
  voltarPara(id, "ok=telas");
}
