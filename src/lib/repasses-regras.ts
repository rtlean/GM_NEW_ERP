// Regras puras do Repasse (US-4.8). Valores em centavos. Sem banco.

/** Taxa de administração padrão: 10% (1000 bps). Editável no cadastro do locador. */
export const TAXA_PADRAO_BPS = 1000;

export type EntradaRepasse = {
  recebidoCentavos: number;
  aluguelPagoCentavos: number;
  taxaBps: number | null;
  despesasCentavos: number;
};

/**
 * Taxa incide só sobre o aluguel pago. O repasse é o total recebido (inclui multa e seguro)
 * menos a taxa e as despesas cobradas do locador. Repasse negativo: despesa maior que o recebido.
 */
export function calcularRepasse(entrada: EntradaRepasse): { taxaCentavos: number; repasseCentavos: number; taxaBps: number } {
  const taxaBps = entrada.taxaBps ?? TAXA_PADRAO_BPS;
  const taxaCentavos = Math.round((entrada.aluguelPagoCentavos * taxaBps) / 10000);
  const repasseCentavos = entrada.recebidoCentavos - taxaCentavos - entrada.despesasCentavos;
  return { taxaCentavos, repasseCentavos, taxaBps };
}

/** Só libera repasse com valor positivo. */
export function podeLiberar(repasseCentavos: number, jaLiberado: boolean): { ok: true } | { ok: false; erro: string } {
  if (jaLiberado) return { ok: false, erro: "Este locador já tem repasse nesta competência." };
  if (repasseCentavos <= 0) return { ok: false, erro: "O valor do repasse é zero ou negativo. Confira as despesas." };
  return { ok: true };
}
