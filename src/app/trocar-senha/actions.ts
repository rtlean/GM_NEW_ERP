"use server";

import { redirect } from "next/navigation";
import { exigirSessaoAtiva } from "@/lib/acesso";
import { senhaAtendeRegras } from "@/lib/senha";
import { concluirTrocaDeSenha } from "@/lib/usuarios";
import { criarClienteSessao } from "@/lib/supabase/sessao";

/** Troca a senha provisória pela senha escolhida pelo próprio usuário. */
export async function trocarSenhaAction(_estadoAnterior: { erro?: string } | undefined, formData: FormData) {
  await exigirSessaoAtiva();
  const nova = String(formData.get("nova") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  if (!senhaAtendeRegras(nova)) return { erro: "A senha precisa ter 10 caracteres ou mais, com letras e números." };
  if (nova !== confirmacao) return { erro: "As senhas não são iguais." };

  const supabase = await criarClienteSessao();
  const { error } = await supabase.auth.updateUser({ password: nova });
  if (error) return { erro: "Não foi possível trocar a senha. Tente de novo." };

  const { data } = await supabase.auth.getUser();
  if (data.user?.email) await concluirTrocaDeSenha(data.user.email);

  redirect("/dashboard");
}
