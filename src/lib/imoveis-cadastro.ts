import "server-only";
import { obterClienteServidor } from "./supabase/server";
import { listarOpcoesDeLocador } from "./locadores-cadastro";
import type { DadosImovel, LinhaImovel } from "./cadastro-imovel";

// Cadastro e leitura de imóveis (US-3.4 e ajuste de layout). Toda consulta filtra company_id = 1.
// Não apaga imóveis. Código novo = próximo número da sequência (0001, 0002, ...).

const EMPRESA_ID = 1;

export type ImovelLista = LinhaImovel & { id: number; code: string; locadorNome: string };

const CAMPOS =
  "id, code, name, type, finality, occupancy_status, zip_code, address, numero, complemento, bairro, city, state, matricula, iptu_registration, bedrooms, suites, bathrooms, parking_spots, useful_area_m2, total_area_m2, floor, furnishing, pets_allowed, amenities, rent_cents, sale_value_cents, condominium_cents, iptu_cents, owner_id";

/** Lista todos os imóveis da empresa (ordenados por código). A busca é feita na tela, com poucos registros. */
export async function listarImoveis(): Promise<ImovelLista[]> {
  const { data, error } = await obterClienteServidor()
    .from("properties")
    .select(CAMPOS)
    .eq("company_id", EMPRESA_ID)
    .order("code", { ascending: true });
  if (error) throw new Error("Não foi possível carregar os imóveis.");

  const locadores = new Map((await listarOpcoesDeLocador()).map((o) => [o.id, o.nome]));
  return (data ?? []).map((i) => ({
    ...(i as unknown as LinhaImovel),
    id: i.id,
    code: i.code,
    locadorNome: i.owner_id ? (locadores.get(i.owner_id) ?? "Locador") : "Sem locador",
  }));
}

export async function buscarImovel(id: number): Promise<(LinhaImovel & { id: number; code: string }) | null> {
  const { data, error } = await obterClienteServidor()
    .from("properties")
    .select(CAMPOS)
    .eq("company_id", EMPRESA_ID)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o imóvel.");
  return data ? { ...(data as unknown as LinhaImovel), id: data.id, code: data.code } : null;
}

/** Próximo código da sequência: maior código numérico + 1, com 4 dígitos. */
async function proximoCodigo(): Promise<string> {
  const { data, error } = await obterClienteServidor().from("properties").select("code").eq("company_id", EMPRESA_ID);
  if (error) throw new Error("Não foi possível gerar o código do imóvel.");
  const maior = (data ?? []).reduce((m, l) => (/^\d+$/.test(l.code) ? Math.max(m, Number(l.code)) : m), 0);
  return String(maior + 1).padStart(4, "0");
}

export async function salvarImovel(dados: DadosImovel, id?: number): Promise<number> {
  const cliente = obterClienteServidor();
  if (id) {
    const { error } = await cliente.from("properties").update(dados).eq("company_id", EMPRESA_ID).eq("id", id);
    if (error) throw new Error("Não foi possível salvar as alterações do imóvel.");
    return id;
  }
  const codigo = await proximoCodigo();
  const { data, error } = await cliente
    .from("properties")
    .insert({ ...dados, code: codigo, company_id: EMPRESA_ID })
    .select("id")
    .single();
  if (error || !data) throw new Error("Não foi possível cadastrar o imóvel.");
  return data.id;
}
