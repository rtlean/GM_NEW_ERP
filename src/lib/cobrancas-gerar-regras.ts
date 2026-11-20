// Regras puras de "Gerar cobranças do mês" (US-4.1). Sem banco. Valores em centavos. Competência AAAA-MM.
import { competenciaValida } from "./lancamentos-regras";

// Decisão do dono (20/11/2026): vencimento sempre no dia 10, como o sistema antigo.
export const DIA_VENCIMENTO = 10;

export type ContratoParaCobranca = {
  id: number;
  ownerId: number;
  tenantId: number;
  propertyId: number;
  /** Aluguel que vale na competência (regra do mês inteiro, já calculada). */
  aluguelCentavos: number;
};

export type CobrancaPlanejada = {
  contratoId: number;
  ownerId: number;
  tenantId: number;
  propertyId: number;
  competencia: string;
  vencimento: string;
  aluguelCentavos: number;
};

export type PlanoCobrancas = {
  criar: CobrancaPlanejada[];
  /** Contratos que já têm cobrança naquele mês (ex.: vindas do sistema antigo). Não são tocados. */
  jaExistentes: number;
  totalCentavos: number;
};

/** Data de vencimento: dia 10 do mês da competência, no formato AAAA-MM-DD. */
export function vencimentoDaCompetencia(competencia: string): string {
  return `${competencia}-${String(DIA_VENCIMENTO).padStart(2, "0")}`;
}

/**
 * Monta o que será criado. Só cria para contrato que ainda não tem cobrança naquele mês.
 * Aluguel zero ou negativo não gera cobrança (não há o que cobrar).
 */
export function planejarCobrancas(
  contratos: ContratoParaCobranca[],
  competencia: string,
  contratosComCobranca: Set<number>,
): { ok: true; plano: PlanoCobrancas } | { ok: false; erro: string } {
  if (!competenciaValida(competencia)) return { ok: false, erro: "Competência inválida." };

  const vencimento = vencimentoDaCompetencia(competencia);
  const criar: CobrancaPlanejada[] = [];
  let jaExistentes = 0;

  for (const c of contratos) {
    if (contratosComCobranca.has(c.id)) {
      jaExistentes += 1;
      continue;
    }
    if (!Number.isInteger(c.aluguelCentavos) || c.aluguelCentavos <= 0) continue;
    criar.push({
      contratoId: c.id,
      ownerId: c.ownerId,
      tenantId: c.tenantId,
      propertyId: c.propertyId,
      competencia,
      vencimento,
      aluguelCentavos: c.aluguelCentavos,
    });
  }

  return {
    ok: true,
    plano: { criar, jaExistentes, totalCentavos: criar.reduce((soma, c) => soma + c.aluguelCentavos, 0) },
  };
}
