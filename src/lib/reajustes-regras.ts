// Regras puras do Reajuste pelo índice (US-4.6). Sem banco. Valores em centavos. Datas AAAA-MM-DD.
import { INDICES_DE_REAJUSTE } from "./contratos-regras";

/** Mostra na lista os reajustes cujo dia cai nos próximos N dias. */
export const JANELA_DIAS = 60;

const pad = (n: number) => String(n).padStart(2, "0");

function ultimoDiaDoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

function dataNoMes(ano: number, mes: number, dia: number): string {
  const d = Math.min(dia, ultimoDiaDoMes(ano, mes));
  return `${ano}-${pad(mes)}-${pad(d)}`;
}

/** Próximo aniversário do contrato (mesmo dia do início), a partir de hoje. Dia 31 vira o último dia do mês curto. */
export function proximoAniversario(inicio: string, hoje: string): string {
  const diaInicio = Number(inicio.slice(8, 10));
  const [ano, mes] = hoje.split("-").map(Number);
  const neste = dataNoMes(ano, mes, diaInicio);
  if (neste >= hoje) return neste;
  const proximo = mes === 12 ? [ano + 1, 1] : [ano, mes + 1];
  return dataNoMes(proximo[0], proximo[1], diaInicio);
}

/** Converte "4,5" ou "4,50" em basis points (450). Aceita de 0,01 a 100. */
export function percentualParaBps(texto: string): { ok: true; bps: number } | { ok: false; erro: string } {
  const t = texto.trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(t)) return { ok: false, erro: "Use um percentual como 4,50." };
  const v = Number(t);
  if (!(v > 0 && v <= 100)) return { ok: false, erro: "O percentual deve estar entre 0,01 e 100." };
  return { ok: true, bps: Math.round(v * 100) };
}

/** Texto do percentual em pt-BR: 450 bps -> "4,50". */
export function bpsParaTexto(bps: number): string {
  return (bps / 100).toFixed(2).replace(".", ",");
}

/** Novo aluguel: atual × (1 + percentual), arredondado para o centavo. */
export function novoAluguelCentavos(atualCentavos: number, bps: number): number {
  return Math.round((atualCentavos * (10000 + bps)) / 10000);
}

export type EntradaReajuste = { percentual: string; indice: string };
export type DadosReajuste = {
  percentualBps: number;
  indice: string;
  anteriorCentavos: number;
  novoCentavos: number;
  dataEfetiva: string;
  competencia: string;
  observacao: string;
};

/** Confere índice e percentual e calcula o novo valor. A data é sempre o próximo aniversário. */
export function validarReajuste(
  entrada: EntradaReajuste,
  contrato: { aluguelCentavos: number; inicio: string },
  hoje: string,
): { ok: true; dados: DadosReajuste } | { ok: false; erros: Partial<Record<keyof EntradaReajuste, string>> } {
  const erros: Partial<Record<keyof EntradaReajuste, string>> = {};
  if (!(INDICES_DE_REAJUSTE as readonly string[]).includes(entrada.indice)) erros.indice = "Escolha o índice.";
  const pct = percentualParaBps(entrada.percentual);
  if (!pct.ok) erros.percentual = pct.erro;
  if (contrato.aluguelCentavos <= 0) erros.percentual = "Este contrato não tem aluguel cadastrado.";
  if (Object.keys(erros).length > 0 || !pct.ok) return { ok: false, erros };

  const dataEfetiva = proximoAniversario(contrato.inicio, hoje);
  const novo = novoAluguelCentavos(contrato.aluguelCentavos, pct.bps);
  return {
    ok: true,
    dados: {
      percentualBps: pct.bps,
      indice: entrada.indice,
      anteriorCentavos: contrato.aluguelCentavos,
      novoCentavos: novo,
      dataEfetiva,
      competencia: dataEfetiva.slice(0, 7),
      observacao: `Reajuste ${entrada.indice} ${bpsParaTexto(pct.bps)}%`,
    },
  };
}

/** Diferença em dias entre duas datas AAAA-MM-DD. */
export function diasEntre(de: string, ate: string): number {
  const a = Date.UTC(Number(de.slice(0, 4)), Number(de.slice(5, 7)) - 1, Number(de.slice(8, 10)));
  const b = Date.UTC(Number(ate.slice(0, 4)), Number(ate.slice(5, 7)) - 1, Number(ate.slice(8, 10)));
  return Math.round((b - a) / 86400000);
}

/** Confere se o aniversário cai dentro da janela da lista. */
export function dentroDaJanela(aniversario: string, hoje: string): boolean {
  const dias = diasEntre(hoje, aniversario);
  return dias >= 0 && dias <= JANELA_DIAS;
}
