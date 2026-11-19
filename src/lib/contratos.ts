import "server-only";
import { obterClienteServidor } from "./supabase/server";

// Leitura de contratos para outros módulos (US-3.3). Só leitura. Toda consulta filtra company_id = 1.
// A tela de contratos e a criação de contratos ficam na fatia 3 (US-3.5 em diante).

const EMPRESA_ID = 1;

/** Quantos contratos ativos cada locatário tem. Locatário sem contrato não aparece no mapa. */
export async function contarContratosAtivosPorLocatario(locatarioIds: number[]): Promise<Map<number, number>> {
  const contagem = new Map<number, number>();
  if (locatarioIds.length === 0) return contagem;

  const { data, error } = await obterClienteServidor()
    .from("contracts")
    .select("tenant_id")
    .eq("company_id", EMPRESA_ID)
    .eq("status", "active")
    .in("tenant_id", locatarioIds);
  if (error) throw new Error("Não foi possível carregar os contratos.");

  for (const linha of data ?? []) {
    contagem.set(linha.tenant_id, (contagem.get(linha.tenant_id) ?? 0) + 1);
  }
  return contagem;
}
