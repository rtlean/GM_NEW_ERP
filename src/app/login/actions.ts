"use server";

import { redirect } from "next/navigation";
import { criarClienteSessao } from "@/lib/supabase/sessao";
import { perfilAtual } from "@/lib/acesso";
import { podeEntrar, precisaTrocarSenha } from "@/lib/permissoes";
import { senhaAtendeRegras } from "@/lib/senha";
import { concluirTrocaDeSenha } from "@/lib/usuarios";

/** Pedido de redefinição: o envio de e-mail está fora da v1, então o administrador redefine a senha em Usuários. */
export async function pedirRedefinicaoAction() {
  redirect("/login?modo=esqueci&aviso=admin");
}

/**
 * Primeiro acesso (design "Primeiro acesso"): entra com a senha provisória, troca pela nova e encerra a sessão.
 * Quem entra depois usa a nova senha na tela de Entrar.
 */
export async function primeiroAcessoAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const provisoria = String(formData.get("provisoria") ?? "");
  const nova = String(formData.get("nova") ?? "");

  if (!senhaAtendeRegras(nova)) redirect("/login?modo=primeiro&erro=regras");

  const supabase = await criarClienteSessao();
  const { error } = await supabase.auth.signInWithPassword({ email, password: provisoria });
  if (error) redirect("/login?modo=primeiro&erro=provisoria");

  const perfil = await perfilAtual();
  if (!perfil) {
    await supabase.auth.signOut();
    redirect("/login?modo=primeiro&erro=provisoria");
  }
  if (!podeEntrar(perfil)) {
    await supabase.auth.signOut();
    redirect("/login?erro=bloqueado");
  }
  if (!precisaTrocarSenha(perfil)) {
    await supabase.auth.signOut();
    redirect("/login?erro=ja-trocada");
  }

  const { error: erroTroca } = await supabase.auth.updateUser({ password: nova });
  if (erroTroca) {
    await supabase.auth.signOut();
    redirect("/login?modo=primeiro&erro=falha");
  }

  const { data } = await supabase.auth.getUser();
  if (data.user?.email) await concluirTrocaDeSenha(data.user.email);
  await supabase.auth.signOut();
  redirect("/login?ok=senha-trocada");
}
