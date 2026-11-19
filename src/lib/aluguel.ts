// Regra do aluguel vigente (docs/historias/fatia-1-banco.md, US-1.3; docs/05-Backend-Schema.md §4).
// Função pura: recebe os dados já lidos do banco e não acessa o banco.
// Valores em centavos. Competência no formato AAAA-MM.

const FUSO_NEGOCIO = "America/Sao_Paulo";

export type ContratoAluguel = {
  rent_cents: number;
  /** Data de início: "AAAA-MM-DD" ou timestamp ISO (lido no fuso de São Paulo). */
  start_date: string;
};

export type MudancaAluguel = {
  id: number;
  rent_cents: number;
  /** Data em que a mudança passa a valer: "AAAA-MM-DD". */
  effective_date: string;
};

const FORMATO_COMPETENCIA = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Converte a data de início para "AAAA-MM-DD", no fuso de São Paulo. */
function dataLocal(valor: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) throw new Error(`Data inválida: ${valor}`);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_NEGOCIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);
}

/**
 * Quanto de aluguel vale no mês (em centavos), ou null se o mês é anterior ao início do contrato.
 *
 * Regra: vale a última mudança cuja data de vigência é até o dia 1º do mês (o mês inteiro).
 * Se não houver mudança até lá, vale o aluguel original do contrato.
 * Em caso de datas iguais, vale a mudança cadastrada por último (maior id).
 */
export function aluguelVigente(
  contrato: ContratoAluguel,
  mudancas: MudancaAluguel[],
  competencia: string,
): number | null {
  if (!FORMATO_COMPETENCIA.test(competencia)) {
    throw new Error(`Competência inválida: "${competencia}". Use o formato AAAA-MM.`);
  }

  const inicioContrato = dataLocal(contrato.start_date);
  if (competencia < inicioContrato.slice(0, 7)) return null;

  const primeiroDia = `${competencia}-01`;
  const vigente = mudancas
    .filter((m) => m.effective_date <= primeiroDia)
    .sort((a, b) =>
      a.effective_date === b.effective_date
        ? b.id - a.id
        : a.effective_date < b.effective_date
          ? 1
          : -1,
    )[0];

  return vigente ? vigente.rent_cents : contrato.rent_cents;
}
