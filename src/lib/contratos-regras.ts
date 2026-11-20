import { reaisParaCentavos } from "./cadastro-imovel";

// Regras do novo contrato (sem acesso ao banco). Dinheiro em centavos; taxa em basis points (1000 = 10%).

export const INDICES_DE_REAJUSTE = ["IGP-M", "IPCA", "INPC", "Outro"] as const;
export const GARANTIAS = ["Caução", "Fiador", "Seguro fiança", "Título de capitalização", "Sem garantia"] as const;

/** Taxa padrão quando nem o locador nem o locatário têm taxa definida (CLAUDE.md: 10%). */
export const TAXA_PADRAO_BPS = 1000;

export type EntradaContrato = {
  aluguel: string;
  dia: string;
  inicio: string;
  fim: string;
  indice: string;
  garantia: string;
  taxa: string;
};

export type DadosContrato = {
  rentCents: number;
  dueDay: number;
  inicio: string;
  fim: string | null;
  indice: string | null;
  garantia: string | null;
  taxaBps: number;
};

export type ResultadoContrato = { ok: true; dados: DadosContrato } | { ok: false; erros: Partial<Record<keyof EntradaContrato, string>> };

/** Data no formato AAAA-MM-DD que existe de verdade (rejeita 2026-02-30). */
export function dataValida(texto: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const d = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(texto);
}

/** Taxa em percentual ("10", "10,5", "7.25") para basis points. Aceita de 0 a 100. */
export function percentualParaBps(texto: string): { ok: true; bps: number } | { ok: false; erro: string } {
  const limpo = texto.trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(limpo)) return { ok: false, erro: "Use um percentual entre 0 e 100 (ex.: 10 ou 7,5)." };
  const valor = Number(limpo);
  if (valor > 100) return { ok: false, erro: "Use um percentual entre 0 e 100 (ex.: 10 ou 7,5)." };
  return { ok: true, bps: Math.round(valor * 100) };
}

/**
 * Taxa que aparece pronta no contrato: a do locador; se ele não tiver, a do locatário; se nenhum tiver, 10%.
 * Taxa 0 cadastrada é tratada como "não definida" (os 22 locadores atuais estão com 0).
 */
export function taxaPadrao(bpsLocador: number | null, bpsLocatario: number | null): number {
  if (bpsLocador && bpsLocador > 0) return bpsLocador;
  if (bpsLocatario && bpsLocatario > 0) return bpsLocatario;
  return TAXA_PADRAO_BPS;
}

export function validarContrato(entrada: EntradaContrato): ResultadoContrato {
  const erros: Partial<Record<keyof EntradaContrato, string>> = {};

  const aluguel = reaisParaCentavos(entrada.aluguel);
  let rentCents = 0;
  if (!aluguel.ok) erros.aluguel = aluguel.erro;
  else if (aluguel.valor <= 0) erros.aluguel = "Informe um aluguel maior que zero.";
  else rentCents = aluguel.valor;

  const dia = entrada.dia.trim();
  const diaNumero = Number(dia);
  let dueDay = 0;
  if (!/^\d+$/.test(dia) || diaNumero < 1 || diaNumero > 28) erros.dia = "O dia do vencimento vai de 1 a 28.";
  else dueDay = diaNumero;

  const inicio = entrada.inicio.trim();
  if (!dataValida(inicio)) erros.inicio = "Informe a data de início.";

  const fim = entrada.fim.trim();
  if (fim && !dataValida(fim)) erros.fim = "Data de fim inválida.";
  else if (fim && dataValida(inicio) && fim < inicio) erros.fim = "A data de fim não pode ser antes do início.";

  const indice = entrada.indice.trim();
  if (indice && !(INDICES_DE_REAJUSTE as readonly string[]).includes(indice)) erros.indice = "Escolha o índice de reajuste.";

  const garantia = entrada.garantia.trim();
  if (garantia && !(GARANTIAS as readonly string[]).includes(garantia)) erros.garantia = "Escolha a garantia.";

  const taxa = percentualParaBps(entrada.taxa);
  let taxaBps = 0;
  if (!taxa.ok) erros.taxa = taxa.erro;
  else taxaBps = taxa.bps;

  if (Object.keys(erros).length > 0) return { ok: false, erros };
  return {
    ok: true,
    dados: { rentCents, dueDay, inicio, fim: fim || null, indice: indice || null, garantia: garantia || null, taxaBps },
  };
}
