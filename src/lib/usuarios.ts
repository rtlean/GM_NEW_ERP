import "server-only";
import { obterClienteServidor } from "./supabase/server";
import type { PerfilAcesso } from "./permissoes";

// Acesso a dados de usuários e permissões (US-2.2). Toda consulta filtra company_id = 1.
const EMPRESA_ID = 1;

/** Perfil de acesso de quem tem este e-mail na empresa; null se não existir ou não pertencer à empresa. */
export async function buscarPerfilPorEmail(email: string): Promise<PerfilAcesso | null> {
  const db = obterClienteServidor();

  const { data: usuario, error } = await db
    .from("users")
    .select("id, role, status")
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
  };
}
