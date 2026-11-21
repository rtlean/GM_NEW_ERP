import "server-only";
import { obterClienteServidor } from "./supabase/server";
import type { DadosLocador } from "./cadastro-locador";

// Acesso a dados do cadastro de locadores (US-3.2). Toda consulta filtra company_id = 1.
// Não apaga nada: a exclusão de registros de negócio não existe no sistema.

const EMPRESA_ID = 1;

export type LocadorParaEdicao = DadosLocador & { id: number };

export type LocadorExistente = { id: number; nome: string };

/** Procura outro locador com o mesmo CPF/CNPJ. Usado para mostrar "Já existe: <nome>". */
export async function buscarLocadorPorDocumento(documento: string, ignorarId?: number): Promise<LocadorExistente | null> {
  let consulta = obterClienteServidor()
    .from("owners")
    .select("id, full_name")
    .eq("company_id", EMPRESA_ID)
    .eq("document", documento)
    .limit(1);
  if (ignorarId) consulta = consulta.neq("id", ignorarId);

  const { data, error } = await consulta;
  if (error) throw new Error("Não foi possível verificar o CPF/CNPJ. Tente de novo.");
  const linha = data?.[0];
  return linha ? { id: linha.id, nome: linha.full_name } : null;
}

/** Busca um locador para o formulário de edição. Retorna null se não existir na empresa. */
export async function buscarLocadorParaEdicao(id: number): Promise<LocadorParaEdicao | null> {
  const { data, error } = await obterClienteServidor()
    .from("owners")
    .select(
      "id, full_name, document, email, city, state, phone, admin_fee_percent_basis_points, preferred_repass_method, pix_type, pix_key, bank_name, bank_code, bank_agency, bank_account, bank_account_digit, account_type",
    )
    .eq("company_id", EMPRESA_ID)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o locador. Tente de novo.");
  if (!data) return null;
  return {
    id: data.id,
    full_name: data.full_name,
    document: data.document ?? "",
    email: data.email,
    city: data.city,
    state: data.state,
    phone: data.phone,
    admin_fee_percent_basis_points: data.admin_fee_percent_basis_points,
    preferred_repass_method: data.preferred_repass_method,
    pix_type: data.pix_type,
    pix_key: data.pix_key,
    bank_name: data.bank_name,
    bank_code: data.bank_code,
    bank_agency: data.bank_agency,
    bank_account: data.bank_account,
    bank_account_digit: data.bank_account_digit,
    account_type: data.account_type,
  };
}

/** Cria ou atualiza um locador da empresa. Devolve o id gravado. */
export async function salvarLocador(dados: DadosLocador, id?: number): Promise<number> {
  const cliente = obterClienteServidor();
  if (id) {
    const { error } = await cliente.from("owners").update(dados).eq("company_id", EMPRESA_ID).eq("id", id);
    if (error) throw new Error("Não foi possível salvar as alterações. Tente de novo.");
    return id;
  }
  const { data, error } = await cliente
    .from("owners")
    .insert({ ...dados, company_id: EMPRESA_ID })
    .select("id")
    .single();
  if (error || !data) throw new Error("Não foi possível cadastrar o locador. Tente de novo.");
  return data.id;
}

/** Lista de locadores para escolher em um locatário (id e nome, em ordem de nome). */
export async function listarOpcoesDeLocador(): Promise<{ id: number; nome: string }[]> {
  const { data, error } = await obterClienteServidor()
    .from("owners")
    .select("id, full_name")
    .eq("company_id", EMPRESA_ID)
    .order("full_name", { ascending: true });
  if (error) throw new Error("Não foi possível carregar os locadores.");
  return (data ?? []).map((l) => ({ id: l.id, nome: l.full_name }));
}
