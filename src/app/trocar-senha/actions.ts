"use server";

import { redirect } from "next/navigation";
import { exigirSessaoAtiva } from "@/lib/acesso";
import { senhaAtendeRegras } from "@/lib/senha";
import { concluirTrocaDeSenha } from "@/lib/usuarios";
import { criarClienteSessao } from "@/lib/supabase/sessao";

/**
 * Troca a senha do próprio usuário.
 * - Troca obrigatória (senha provisória): só pede a nova senha.
 * - Troca voluntária ("Minha senha"): pede a senha atual antes, para que quem deixou o computador aberto não troque a senha de outra pessoa.
 */
export async function trocarSenhaAction(_estadoAnterior: { erro?: string; ok?: boolean } | undefined, formData: FormData) {
  await exigirSessaoAtiva();
  const voluntaria = formData.get("voluntaria") === "1";
  const atual = String(formData.get("atual") ?? "");
  const nova = String(formData.get("nova") ?? "");

  if (!senhaAtendeRegras(nova)) return { erro: "A senha precisa ter 10 caracteres ou mais, com letras e números." };

  const supabase = await criarClienteSessao();
  const { data: usuario } = await supabase.auth.getUser();
  const email = usuario.user?.email;
  if (!email) return { erro: "Sua sessão expirou. Entre de novo." };

  if (voluntaria) {
    if (!atual) return { erro: "Informe sua senha atual." };
    const { error: erroAtual } = await supabase.auth.signInWithPassword({ email, password: atual });
    if (erroAtual) return { erro: "A senha atual não confere." };
  }

  const { error } = await supabase.auth.updateUser({ password: nova });
  if (error) return { erro: "Não foi possível trocar a senha. Tente de novo." };

  await concluirTrocaDeSenha(email);

  if (voluntaria) return { ok: true };
  redirect("/dashboard");
}
