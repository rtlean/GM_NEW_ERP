import "server-only";
import { obterClienteServidor } from "./supabase/server";
import { TELAS_LIBERAVEIS, type PerfilAcesso } from "./permissoes";

// Dados e operações de usuários (US-2.2 e US-2.3). Toda consulta filtra company_id = 1.
const EMPRESA_ID = 1;

export type UsuarioLinha = {
  id: number;
  nome: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "inactive";
  telas: string[];
  trocarSenha: boolean;
};

/** Perfil de acesso de quem tem este e-mail na empresa; null se não existir ou não pertencer à empresa. */
export async function buscarPerfilPorEmail(email: string): Promise<PerfilAcesso | null> {
  const db = obterClienteServidor();

  const { data: usuario, error } = await db
    .from("users")
    .select("id, role, status, must_change_password, sessions_invalidated_at")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw error;
  if (!usuario) return null;

  const { data: vinculo, error: erroVinculo } = await db
    .from("company_users")
    .select("user_id")
    .eq("company_id", EMPRESA_ID)
    .eq("user_id", usuario.id)
    .maybeSingle();
  if (erroVinculo) throw erroVinculo;
  if (!vinculo) return null;

  const { data: telas, error: erroTelas } = await db
    .from("user_screen_permissions")
    .select("screen_key")
    .eq("company_id", EMPRESA_ID)
    .eq("user_id", usuario.id);
  if (erroTelas) throw erroTelas;

  return {
    role: usuario.role,
    status: usuario.status,
    telas: (telas ?? []).map((t) => t.screen_key),
    trocarSenha: usuario.must_change_password,
    sessoesInvalidadasEm: usuario.sessions_invalidated_at,
  };
}

/** Todos os usuários da empresa, com as telas de cada um. */
export async function listarUsuarios(): Promise<UsuarioLinha[]> {
  const db = obterClienteServidor();

  const { data: vinculos, error: erroVinculos } = await db
    .from("company_users")
    .select("user_id")
    .eq("company_id", EMPRESA_ID);
  if (erroVinculos) throw erroVinculos;
  const ids = (vinculos ?? []).map((v) => v.user_id);
  if (ids.length === 0) return [];

  const { data: usuarios, error: erroUsuarios } = await db
    .from("users")
    .select("id, name, email, role, status, must_change_password")
    .in("id", ids)
    .order("name");
  if (erroUsuarios) throw erroUsuarios;

  const { data: permissoes, error: erroPermissoes } = await db
    .from("user_screen_permissions")
    .select("user_id, screen_key")
    .eq("company_id", EMPRESA_ID)
    .in("user_id", ids);
  if (erroPermissoes) throw erroPermissoes;

  return (usuarios ?? []).map((u) => ({
    id: u.id,
    nome: u.name ?? "",
    email: u.email ?? "",
    role: u.role,
    status: u.status,
    telas: (permissoes ?? []).filter((p) => p.user_id === u.id).map((p) => p.screen_key),
    trocarSenha: u.must_change_password,
  }));
}

/** Um usuário da empresa pelo id; null se não existir ou não pertencer à empresa. */
export async function buscarUsuario(id: number): Promise<UsuarioLinha | null> {
  const lista = await listarUsuarios();
  return lista.find((u) => u.id === id) ?? null;
}

/** Id da conta de login (Supabase Auth) pelo e-mail. Não usa users.open_id, que não é confiável em contas antigas. */
async function idDaContaDeLogin(email: string): Promise<string> {
  const db = obterClienteServidor();
  const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  const conta = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!conta) throw new Error("Conta de login não encontrada para este e-mail.");
  return conta.id;
}

/** Operações de escrita só valem para o operacional: o admin nunca é restringido, bloqueado ou redefinido aqui. */
async function operacionalDaEmpresa(id: number): Promise<UsuarioLinha> {
  const usuario = await buscarUsuario(id);
  if (!usuario) throw new Error("Usuário não encontrado nesta empresa.");
  if (usuario.role === "admin") throw new Error("O administrador não pode ser alterado aqui.");
  return usuario;
}

/** E-mail já usado por outro usuário (de qualquer empresa) ou não. */
async function emailEmUso(email: string, ignorarId?: number): Promise<boolean> {
  const db = obterClienteServidor();
  const { data, error } = await db.from("users").select("id").eq("email", email).maybeSingle();
  if (error) throw error;
  return !!data && data.id !== ignorarId;
}

/** Cria o acesso operacional: conta no Supabase Auth com senha provisória e vínculo com a empresa. */
export async function criarOperacional(nome: string, email: string, senhaProvisoria: string): Promise<number> {
  const db = obterClienteServidor();
  const emailNormalizado = email.trim().toLowerCase();

  if (await emailEmUso(emailNormalizado)) throw new Error("Este e-mail já tem acesso.");

  const { data: criado, error: erroCriar } = await db.auth.admin.createUser({
    email: emailNormalizado,
    password: senhaProvisoria,
    email_confirm: true,
  });
  if (erroCriar || !criado.user) throw new Error("Não foi possível criar o acesso. Tente de novo.");
  const authId = criado.user.id;

  try {
    const { data: linha, error: erroUsuario } = await db
      .from("users")
      .insert({
        open_id: authId,
        name: nome.trim(),
        email: emailNormalizado,
        login_method: "email",
        role: "user",
        status: "active",
        must_change_password: true,
      })
      .select("id")
      .single();
    if (erroUsuario) throw erroUsuario;

    const { error: erroVinculo } = await db
      .from("company_users")
      .insert({ company_id: EMPRESA_ID, user_id: linha.id, role: "user", status: "active" });
    if (erroVinculo) throw erroVinculo;

    return linha.id;
  } catch (erro) {
    // Se o banco recusou, desfaz a conta criada no Supabase Auth para não ficar acesso órfão.
    await db.auth.admin.deleteUser(authId);
    throw erro;
  }
}

/** Redefine a senha do operacional: senha provisória, troca obrigatória e sessões antigas encerradas. */
export async function redefinirSenha(id: number, senhaProvisoria: string): Promise<void> {
  const usuario = await operacionalDaEmpresa(id);
  const db = obterClienteServidor();

  const authId = await idDaContaDeLogin(usuario.email);
  const { error: erroSenha } = await db.auth.admin.updateUserById(authId, { password: senhaProvisoria });
  if (erroSenha) throw new Error("Não foi possível redefinir a senha. Tente de novo.");

  const { error } = await db
    .from("users")
    .update({ must_change_password: true, sessions_invalidated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Bloqueia ou libera o operacional. Bloquear também encerra as sessões abertas. */
export async function definirBloqueio(id: number, bloqueado: boolean): Promise<void> {
  await operacionalDaEmpresa(id);
  const db = obterClienteServidor();
  const agora = new Date().toISOString();
  const { error } = await db
    .from("users")
    .update({
      status: bloqueado ? "inactive" : "active",
      ...(bloqueado ? { sessions_invalidated_at: agora } : {}),
      updated_at: agora,
    })
    .eq("id", id);
  if (error) throw error;
}

/** Edita nome e e-mail do operacional. Mudar o e-mail manda confirmação para o novo endereço (padrão do Supabase Auth). */
export async function editarContato(id: number, nome: string, email: string): Promise<void> {
  const usuario = await operacionalDaEmpresa(id);
  const emailNormalizado = email.trim().toLowerCase();
  if (!nome.trim()) throw new Error("Informe o nome.");
  if (await emailEmUso(emailNormalizado, id)) throw new Error("Este e-mail já pertence a outro usuário.");

  const db = obterClienteServidor();
  if (emailNormalizado !== usuario.email) {
    const authId = await idDaContaDeLogin(usuario.email);
    const { error: erroAuth } = await db.auth.admin.updateUserById(authId, { email: emailNormalizado });
    if (erroAuth) throw new Error("Não foi possível alterar o e-mail. Tente de novo.");
  }
  const { error } = await db
    .from("users")
    .update({ name: nome.trim(), email: emailNormalizado, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Salva as telas liberadas (substitui a lista inteira). Só telas conhecidas são aceitas. */
export async function salvarTelas(id: number, telas: string[]): Promise<void> {
  await operacionalDaEmpresa(id);
  const permitidas = telas.filter((t) => TELAS_LIBERAVEIS.includes(t));
  const db = obterClienteServidor();

  const { error: erroApagar } = await db
    .from("user_screen_permissions")
    .delete()
    .eq("company_id", EMPRESA_ID)
    .eq("user_id", id);
  if (erroApagar) throw erroApagar;

  if (permitidas.length > 0) {
    const { error } = await db
      .from("user_screen_permissions")
      .insert(permitidas.map((screen_key) => ({ company_id: EMPRESA_ID, user_id: id, screen_key })));
    if (error) throw error;
  }
}

/** Marca que o próprio usuário trocou a senha no primeiro acesso. */
export async function concluirTrocaDeSenha(email: string): Promise<void> {
  const db = obterClienteServidor();
  const { error } = await db
    .from("users")
    .update({ must_change_password: false, updated_at: new Date().toISOString() })
    .eq("email", email.trim().toLowerCase());
  if (error) throw error;
}
