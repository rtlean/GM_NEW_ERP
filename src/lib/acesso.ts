import "server-only";
import { notFound, redirect } from "next/navigation";
import { podeAbrirTela, podeEntrar, type PerfilAcesso } from "./permissoes";
import { criarClienteSessao } from "./supabase/sessao";
import { buscarPerfilPorEmail } from "./usuarios";

/** Perfil de quem está logado agora; null se não há sessão. */
export async function perfilAtual(): Promise<PerfilAcesso | null> {
  const supabase = await criarClienteSessao();
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) return null;
  return buscarPerfilPorEmail(data.user.email);
}

/**
 * Confere no servidor se o usuário pode abrir a tela.
 * Conta bloqueada é desconectada. Tela sem permissão responde 404 (não revela que existe).
 */
export async function exigirAcesso(tela: string): Promise<void> {
  const perfil = await perfilAtual();

  if (perfil && !podeEntrar(perfil)) {
    const supabase = await criarClienteSessao();
    await supabase.auth.signOut();
    redirect("/login?erro=bloqueado");
  }
  if (!podeAbrirTela(perfil, tela)) notFound();
}
