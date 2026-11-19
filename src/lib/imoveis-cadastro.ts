import "server-only";
import { obterClienteServidor } from "./supabase/server";
import { listarOpcoesDeLocador } from "./locadores-cadastro";
import type { DadosImovel } from "./cadastro-imovel";

// Cadastro e leitura de imóveis (US-3.4). Toda consulta filtra company_id = 1.
// Não apaga imóveis. Código novo = próximo número da sequência (0001, 0002, ...).

const EMPRESA_ID = 1;

export type ImovelLista = {
  id: number;
  codigo: string;
  tipo: string | null;
  endereco: string;
  bairro: string | null;
  cidade: string;
  uf: string;
  aluguelCentavos: number;
  situacao: string;
  locadorId: number | null;
  locadorNome: string;
};

export type FiltrosImoveis = { busca?: string; locadorId?: number; tipo?: string };

const CAMPOS =
  "id, code, type, address, numero, complemento, bairro, zip_code, city, state, rent_cents, occupancy_status, owner_id, caracteristicas";

export async function listarImoveis(filtros: FiltrosImoveis = {}): Promise<ImovelLista[]> {
  let consulta = obterClienteServidor()
    .from("properties")
    .select(CAMPOS)
    .eq("company_id", EMPRESA_ID)
    .order("code", { ascending: true });
  if (filtros.locadorId) consulta = consulta.eq("owner_id", filtros.locadorId);
  if (filtros.tipo) consulta = consulta.eq("type", filtros.tipo);
  const termo = (filtros.busca ?? "").trim().replace(/[,()%*]/g, "");
  if (termo) consulta = consulta.or(`address.ilike.%${termo}%,bairro.ilike.%${termo}%,code.ilike.%${termo}%`);

  const { data, error } = await consulta;
  if (error) throw new Error("Não foi possível carregar os imóveis.");

  const locadores = new Map((await listarOpcoesDeLocador()).map((o) => [o.id, o.nome]));
  return (data ?? []).map((i) => ({
    id: i.id,
    codigo: i.code,
    tipo: i.type,
    endereco: i.address,
    bairro: i.bairro,
    cidade: i.city,
    uf: i.state,
    aluguelCentavos: i.rent_cents,
    situacao: i.occupancy_status,
    locadorId: i.owner_id,
    locadorNome: i.owner_id ? (locadores.get(i.owner_id) ?? "Locador") : "Sem locador",
  }));
}

export async function buscarImovel(id: number) {
  const { data, error } = await obterClienteServidor()
    .from("properties")
    .select(CAMPOS)
    .eq("company_id", EMPRESA_ID)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o imóvel.");
  return data;
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
