"use server";

import { redirect } from "next/navigation";
import { criarClienteSessao } from "@/lib/supabase/sessao";
import { perfilAtual } from "@/lib/acesso";
import { podeEntrar, primeiraRotaPermitida } from "@/lib/permissoes";

/** Entra com e-mail e senha. Qualquer erro mostra a mesma mensagem (não revela se o e-mail existe). */
export async function entrar(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  const supabase = await criarClienteSessao();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) redirect("/login?erro=1");

  // Conta sem vínculo com a empresa, bloqueada ou sem telas liberadas não entra.
  const perfil = await perfilAtual();
  if (!perfil) {
    await supabase.auth.signOut();
    redirect("/login?erro=1");
  }
  if (!podeEntrar(perfil)) {
    await supabase.auth.signOut();
    redirect("/login?erro=bloqueado");
  }
  const primeira = primeiraRotaPermitida(perfil);
  if (!primeira) {
    await supabase.auth.signOut();
    redirect("/login?erro=sem-telas");
  }
  redirect(`/${primeira.rota}`);
}

/** Encerra a sessão e volta para a tela de login. */
export async function sair() {
  const supabase = await criarClienteSessao();
  await supabase.auth.signOut();
  redirect("/login");
}
