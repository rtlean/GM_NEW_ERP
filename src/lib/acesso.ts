import "server-only";
import { notFound, redirect } from "next/navigation";
import { iatDoToken } from "./sessao";
import { podeAbrirTela, podeEntrar, precisaTrocarSenha, sessaoValida, type PerfilAcesso } from "./permissoes";
import { criarClienteSessao } from "./supabase/sessao";
import { buscarPerfilPorEmail, idDoUsuarioPorEmail } from "./usuarios";

/** Perfil de quem está logado agora; null se não há sessão, se a conta não existe na empresa ou se a sessão foi encerrada. */
export async function perfilAtual(): Promise<PerfilAcesso | null> {
  const supabase = await criarClienteSessao();
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) return null;

  const perfil = await buscarPerfilPorEmail(data.user.email);
  if (!perfil) return null;

  const { data: sessao } = await supabase.auth.getSession();
  if (!sessaoValida(perfil, iatDoToken(sessao.session?.access_token))) {
    await supabase.auth.signOut();
    return null;
  }
  return perfil;
}

/** Exige sessão de conta ativa (sem checar tela). Usada pela troca de senha obrigatória. */
export async function exigirSessaoAtiva(): Promise<PerfilAcesso> {
  const perfil = await perfilAtual();
  if (!perfil) redirect("/login");
  if (!podeEntrar(perfil)) {
    const supabase = await criarClienteSessao();
    await supabase.auth.signOut();
    redirect("/login?erro=bloqueado");
  }
  return perfil;
}

/**
 * Confere no servidor se o usuário pode abrir a tela.
 * Antes de tudo: quem precisa trocar a senha só vê a tela de troca.
 * Conta bloqueada é desconectada. Tela sem permissão responde 404 (não revela que existe).
 */
export async function exigirAcesso(tela: string): Promise<void> {
  const perfil = await exigirSessaoAtiva();
  if (precisaTrocarSenha(perfil) && tela !== "trocar-senha") redirect("/trocar-senha");
  if (!podeAbrirTela(perfil, tela)) notFound();
}

/** Id de quem está logado (para a auditoria); null se não há sessão válida. */
export async function idUsuarioAtual(): Promise<number | null> {
  const supabase = await criarClienteSessao();
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) return null;
  return idDoUsuarioPorEmail(data.user.email);
}

/** Confere sem redirecionar: a tela está liberada para quem está logado? Para rotas de arquivo (API). */
export async function telaLiberada(tela: string): Promise<boolean> {
  const perfil = await perfilAtual();
  return !!perfil && !precisaTrocarSenha(perfil) && podeAbrirTela(perfil, tela);
}
