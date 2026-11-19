"use server";

import { redirect } from "next/navigation";
import { criarClienteSessao } from "@/lib/supabase/sessao";

/** Entra com e-mail e senha. Qualquer erro mostra a mesma mensagem (não revela se o e-mail existe). */
export async function entrar(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  const supabase = await criarClienteSessao();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) redirect("/login?erro=1");
  redirect("/dashboard");
}

/** Encerra a sessão e volta para a tela de login. */
export async function sair() {
  const supabase = await criarClienteSessao();
  await supabase.auth.signOut();
  redirect("/login");
}
