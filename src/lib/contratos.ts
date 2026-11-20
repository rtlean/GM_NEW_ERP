import "server-only";
import { obterClienteServidor } from "./supabase/server";

// Leitura de contratos para outros módulos (US-3.3). Só leitura. Toda consulta filtra company_id = 1.
// A tela de contratos e a criação de contratos ficam na fatia 3 (US-3.5 em diante).

const EMPRESA_ID = 1;

export type ContratoAtivo = { propertyId: number; aluguelCentavos: number };

/** Contratos ativos de cada locatário (imóvel e aluguel). Locatário sem contrato ativo não aparece no mapa. */
export async function contratosAtivosPorLocatario(locatarioIds: number[]): Promise<Map<number, ContratoAtivo[]>> {
  const mapa = new Map<number, ContratoAtivo[]>();
  if (locatarioIds.length === 0) return mapa;

  const { data, error } = await obterClienteServidor()
    .from("contracts")
    .select("tenant_id, property_id, rent_cents")
    .eq("company_id", EMPRESA_ID)
    .eq("status", "active")
    .in("tenant_id", locatarioIds);
  if (error) throw new Error("Não foi possível carregar os contratos.");

  for (const linha of data ?? []) {
    const lista = mapa.get(linha.tenant_id) ?? [];
    lista.push({ propertyId: linha.property_id, aluguelCentavos: linha.rent_cents ?? 0 });
    mapa.set(linha.tenant_id, lista);
  }
  return mapa;
}

export type ContratoParaPainel = { locatarioId: number; propertyId: number; aluguelCentavos: number; taxaPropria: boolean };

/** Todos os contratos ativos com o aluguel do contrato, para o painel (Dashboard). Só leitura. */
export async function listarContratosAtivosParaPainel(): Promise<ContratoParaPainel[]> {
  const { data, error } = await obterClienteServidor()
    .from("contracts")
    .select("tenant_id, property_id, rent_cents, admin_fee_percent_basis_points")
    .eq("company_id", EMPRESA_ID)
    .eq("status", "active");
  if (error) throw new Error("Não foi possível carregar os contratos.");

  return (data ?? []).map((c) => ({
    locatarioId: c.tenant_id,
    propertyId: c.property_id,
    aluguelCentavos: c.rent_cents ?? 0,
    taxaPropria: c.admin_fee_percent_basis_points != null,
  }));
}
