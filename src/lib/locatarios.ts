import "server-only";
import { obterClienteServidor } from "./supabase/server";
import { contarContratosAtivosPorLocatario } from "./contratos";
import type { DadosLocatario } from "./cadastro-locatario";

// Regras e acesso a dados dos locatários (US-3.3). Toda consulta filtra company_id = 1.
// Não apaga nada. Os vínculos com locadores só são adicionados, nunca removidos nesta versão.

const EMPRESA_ID = 1;

export type LocatarioLinha = {
  id: number;
  nome: string;
  documento: string | null;
  telefone: string | null;
  email: string | null;
  locadores: { id: number; nome: string }[];
  contratosAtivos: number;
};

export type FiltrosLocatarios = { busca?: string };

function filtroBusca(busca: string): string | null {
  const termo = busca.trim().replace(/[,()%*]/g, "");
  if (!termo) return null;
  const condicoes = [`full_name.ilike.%${termo}%`];
  const documento = termo.replace(/[^0-9A-Za-z]/g, "");
  if (/[0-9]/.test(documento)) condicoes.push(`document.ilike.%${documento}%`);
  return condicoes.join(",");
}

async function locadoresDosLocatarios(ids: number[]): Promise<Map<number, { id: number; nome: string }[]>> {
  const mapa = new Map<number, { id: number; nome: string }[]>();
  if (ids.length === 0) return mapa;
  const cliente = obterClienteServidor();
  const { data: vinculos, error } = await cliente
    .from("tenant_owners")
    .select("tenant_id, owner_id")
    .eq("company_id", EMPRESA_ID)
    .in("tenant_id", ids);
  if (error) throw new Error("Não foi possível carregar os locadores do locatário.");

  const ownerIds = [...new Set((vinculos ?? []).map((v) => v.owner_id))];
  const nomes = new Map<number, string>();
  if (ownerIds.length > 0) {
    const { data: owners, error: erroOwners } = await cliente
      .from("owners")
      .select("id, full_name")
      .eq("company_id", EMPRESA_ID)
      .in("id", ownerIds);
    if (erroOwners) throw new Error("Não foi possível carregar os locadores do locatário.");
    for (const o of owners ?? []) nomes.set(o.id, o.full_name);
  }

  for (const v of vinculos ?? []) {
    const lista = mapa.get(v.tenant_id) ?? [];
    lista.push({ id: v.owner_id, nome: nomes.get(v.owner_id) ?? "Locador" });
    mapa.set(v.tenant_id, lista);
  }
  return mapa;
}

/** Lista os locatários da empresa com a busca por nome ou CPF/CNPJ. */
export async function listarLocatarios(filtros: FiltrosLocatarios = {}): Promise<LocatarioLinha[]> {
  let consulta = obterClienteServidor()
    .from("tenants")
    .select("id, full_name, document, phone, email")
    .eq("company_id", EMPRESA_ID)
    .order("full_name", { ascending: true });
  const filtro = filtroBusca(filtros.busca ?? "");
  if (filtro) consulta = consulta.or(filtro);

  const { data, error } = await consulta;
  if (error) throw new Error("Não foi possível carregar os locatários.");
  const linhas = data ?? [];
  const ids = linhas.map((l) => l.id);

  const [locadores, contratos] = await Promise.all([locadoresDosLocatarios(ids), contarContratosAtivosPorLocatario(ids)]);

  return linhas.map((l) => ({
    id: l.id,
    nome: l.full_name,
    documento: l.document,
    telefone: l.phone,
    email: l.email,
    locadores: locadores.get(l.id) ?? [],
    contratosAtivos: contratos.get(l.id) ?? 0,
  }));
}

/** Locatário pelo id, com os locadores ligados. Null se não existir na empresa. */
export async function buscarLocatario(id: number) {
  const { data, error } = await obterClienteServidor()
    .from("tenants")
    .select("id, full_name, document, cpf, email, phone")
    .eq("company_id", EMPRESA_ID)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o locatário.");
  if (!data) return null;
  const locadores = (await locadoresDosLocatarios([id])).get(id) ?? [];
  return { ...data, locadores };
}

/** Outro locatário com o mesmo CPF/CNPJ, se existir. */
export async function locatarioComDocumento(documento: string, ignorarId?: number): Promise<{ id: number; nome: string } | null> {
  let consulta = obterClienteServidor()
    .from("tenants")
    .select("id, full_name")
    .eq("company_id", EMPRESA_ID)
    .eq("document", documento)
    .limit(1);
  if (ignorarId) consulta = consulta.neq("id", ignorarId);
  const { data, error } = await consulta;
  if (error) throw new Error("Não foi possível verificar o CPF/CNPJ.");
  const linha = data?.[0];
  return linha ? { id: linha.id, nome: linha.full_name } : null;
}

/** Cria ou atualiza o locatário e adiciona os vínculos com os locadores escolhidos. */
export async function salvarLocatario(dados: DadosLocatario, locadorIds: number[], id?: number): Promise<number> {
  const cliente = obterClienteServidor();
  let tenantId = id;
  if (id) {
    const { error } = await cliente.from("tenants").update(dados).eq("company_id", EMPRESA_ID).eq("id", id);
    if (error) throw new Error("Não foi possível salvar as alterações.");
  } else {
    const { data, error } = await cliente
      .from("tenants")
      .insert({ ...dados, company_id: EMPRESA_ID, owner_id: locadorIds[0] })
      .select("id")
      .single();
    if (error || !data) throw new Error("Não foi possível cadastrar o locatário.");
    tenantId = data.id;
  }

  const { error: erroVinculo } = await cliente
    .from("tenant_owners")
    .upsert(
      locadorIds.map((owner_id) => ({ company_id: EMPRESA_ID, tenant_id: tenantId!, owner_id })),
      { onConflict: "company_id,tenant_id,owner_id", ignoreDuplicates: true },
    );
  if (erroVinculo) throw new Error("Não foi possível salvar os locadores do locatário.");

  return tenantId!;
}
