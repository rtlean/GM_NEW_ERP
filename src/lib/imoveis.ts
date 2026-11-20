import "server-only";
import { obterClienteServidor } from "./supabase/server";

// Leitura de imóveis para outros módulos (docs/historias/fatia-3-cadastros.md).
// Só leitura por enquanto: o cadastro de imóveis é a US-3.4. Toda consulta filtra company_id = 1.

const EMPRESA_ID = 1;

export type ImovelLinha = {
  id: number;
  codigo: string | null;
  tipo: string | null;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  aluguelCentavos: number;
};

export type ResumoImoveis = { quantidade: number; totalAluguelCentavos: number };

/** Quantos imóveis e o total de aluguel de cada locador (chave = id do locador). */
export async function resumoImoveisPorLocador(): Promise<Map<number, ResumoImoveis>> {
  const { data, error } = await obterClienteServidor()
    .from("properties")
    .select("owner_id, rent_cents")
    .eq("company_id", EMPRESA_ID);
  if (error) throw new Error(`Não foi possível carregar os imóveis: ${error.message}`);

  const resumo = new Map<number, ResumoImoveis>();
  for (const imovel of data ?? []) {
    if (imovel.owner_id === null) continue;
    const atual = resumo.get(imovel.owner_id) ?? { quantidade: 0, totalAluguelCentavos: 0 };
    resumo.set(imovel.owner_id, {
      quantidade: atual.quantidade + 1,
      totalAluguelCentavos: atual.totalAluguelCentavos + (imovel.rent_cents ?? 0),
    });
  }
  return resumo;
}

/** Imóveis de um locador, em ordem de código. */
export async function listarImoveisDoLocador(ownerId: number): Promise<ImovelLinha[]> {
  const { data, error } = await obterClienteServidor()
    .from("properties")
    .select("id, code, type, address, city, state, rent_cents")
    .eq("company_id", EMPRESA_ID)
    .eq("owner_id", ownerId)
    .order("code", { ascending: true });
  if (error) throw new Error(`Não foi possível carregar os imóveis: ${error.message}`);

  return (data ?? []).map((i) => ({
    id: i.id,
    codigo: i.code,
    tipo: i.type,
    endereco: i.address,
    cidade: i.city,
    uf: i.state,
    aluguelCentavos: i.rent_cents ?? 0,
  }));
}

export type ImovelResumo = { codigo: string; tipo: string | null; ownerId: number | null };

/** Código, tipo e locador de cada imóvel pelo id. Imóvel que não existe na empresa não aparece no mapa. */
export async function imoveisPorIds(ids: number[]): Promise<Map<number, ImovelResumo>> {
  const mapa = new Map<number, ImovelResumo>();
  if (ids.length === 0) return mapa;

  const { data, error } = await obterClienteServidor()
    .from("properties")
    .select("id, code, type, owner_id")
    .eq("company_id", EMPRESA_ID)
    .in("id", ids);
  if (error) throw new Error("Não foi possível carregar os imóveis.");

  for (const i of data ?? []) mapa.set(i.id, { codigo: i.code, tipo: i.type, ownerId: i.owner_id });
  return mapa;
}

export type ImovelParaPainel = { id: number; tipo: string | null; ownerId: number | null; aluguelCentavos: number };

/** Todos os imóveis da empresa com tipo, locador e aluguel cadastrado, para o painel (Dashboard). Só leitura. */
export async function listarImoveisParaPainel(): Promise<ImovelParaPainel[]> {
  const { data, error } = await obterClienteServidor()
    .from("properties")
    .select("id, type, owner_id, rent_cents")
    .eq("company_id", EMPRESA_ID);
  if (error) throw new Error("Não foi possível carregar os imóveis.");

  return (data ?? []).map((i) => ({ id: i.id, tipo: i.type, ownerId: i.owner_id, aluguelCentavos: i.rent_cents ?? 0 }));
}

export type ImovelParaSelecao = { id: number; codigo: string | null; tipo: string | null; endereco: string | null; ownerId: number | null };

/** Todos os imóveis da empresa para escolher em um contrato (com código, tipo, endereço e locador). Só leitura. */
export async function listarImoveisParaSelecao(): Promise<ImovelParaSelecao[]> {
  const { data, error } = await obterClienteServidor()
    .from("properties")
    .select("id, code, type, address, owner_id")
    .eq("company_id", EMPRESA_ID)
    .order("code", { ascending: true });
  if (error) throw new Error("Não foi possível carregar os imóveis.");

  return (data ?? []).map((i) => ({ id: i.id, codigo: i.code, tipo: i.type, endereco: i.address, ownerId: i.owner_id }));
}
