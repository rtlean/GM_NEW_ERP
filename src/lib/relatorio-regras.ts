// Regras puras do Relatório mensal (US-5.1). Valores em centavos. Sem banco.
// Decisões do dono (20/11/2026): taxa padrão 10%, editável por locador (Locatelli fica em 0%, acordo com o locador);
// pagamento abate primeiro o aluguel; "Valor boleto" = aluguel + multa.
import { calcularRepasse } from "./repasses-regras";

export type StatusCobranca = "paid" | "open" | "overdue" | "partial" | "cancelled";

export function rotuloStatus(status: StatusCobranca): string {
  const rotulos: Record<StatusCobranca, string> = { paid: "Pago", open: "Em aberto", overdue: "Atrasado", partial: "Parcial", cancelled: "Cancelado" };
  return rotulos[status];
}

/** Aluguel pago: o pagamento abate primeiro o aluguel (regra de 20/11/2026). */
export function aluguelPago(pagoCentavos: number, aluguelCentavos: number): number {
  return Math.min(pagoCentavos, aluguelCentavos);
}

/** Taxa de uma linha, com a mesma conta do Repasse (sobre o aluguel pago). */
export function taxaDaLinha(pagoAluguelCentavos: number, taxaBps: number): number {
  return calcularRepasse({ recebidoCentavos: 0, aluguelPagoCentavos: pagoAluguelCentavos, taxaBps, despesasCentavos: 0 }).taxaCentavos;
}

export type CategoriaDespesa = "pintura" | "agua" | "luz" | "limpeza" | "seguro" | "outra";

/** Classifica a conta de controle pelo nome (sem acento e sem maiúscula). Seguro não tem coluna própria ainda. */
export function classificarCategoria(nome: string): CategoriaDespesa {
  const n = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (n.includes("pintura")) return "pintura";
  if (n.includes("agua")) return "agua";
  if (n.includes("luz")) return "luz";
  if (n.includes("limpeza") || n.includes("condominio")) return "limpeza";
  if (n.includes("seguro")) return "seguro";
  return "outra";
}

export type DespesaRelatorio = { categoria: CategoriaDespesa; valorCentavos: number; imovelId: number | null; cobrarDe: "owner" | "tenant" };

export type CobrancaRelatorio = {
  contratoId: number;
  locatario: string;
  imovel: string;
  imovelId: number;
  aluguelCentavos: number;
  pagoCentavos: number;
  pendenciaCentavos: number;
  multaCentavos: number;
  vencimento: string | null;
  dataPagamento: string | null;
  status: StatusCobranca;
};

export type LinhaLocatario = {
  numero: number;
  locatario: string;
  imovel: string;
  aluguelCentavos: number;
  vencimento: string | null;
  status: StatusCobranca;
  /** Seguro do imóvel e seguro fiança: zerados até o módulo de Seguros existir. */
  seguroImovelCentavos: number;
  seguroFiancaCentavos: number;
  pinturaCentavos: number;
  pendenciaCentavos: number;
  dataPagamento: string | null;
  taxaCentavos: number;
  pagoAluguelCentavos: number;
  valorTotalCentavos: number;
  totalCentavos: number;
  boletoCentavos: number;
};

/** Uma linha do quadro de locatários. TOTAL = valor pago menos a taxa da linha. */
export function montarLinhaLocatario(c: CobrancaRelatorio, numero: number, taxaBps: number, despesas: DespesaRelatorio[]): LinhaLocatario {
  const pagoAluguel = aluguelPago(c.pagoCentavos, c.aluguelCentavos);
  const taxa = taxaDaLinha(pagoAluguel, taxaBps);
  const pinturaDoImovel = despesas
    .filter((d) => d.imovelId === c.imovelId && d.cobrarDe === "tenant" && d.categoria === "pintura")
    .reduce((soma, d) => soma + d.valorCentavos, 0);
  return {
    numero,
    locatario: c.locatario,
    imovel: c.imovel,
    aluguelCentavos: c.aluguelCentavos,
    vencimento: c.vencimento,
    status: c.status,
    seguroImovelCentavos: 0,
    seguroFiancaCentavos: 0,
    pinturaCentavos: pinturaDoImovel,
    pendenciaCentavos: c.pendenciaCentavos,
    dataPagamento: c.dataPagamento,
    taxaCentavos: taxa,
    pagoAluguelCentavos: pagoAluguel,
    valorTotalCentavos: c.pagoCentavos,
    totalCentavos: c.pagoCentavos - taxa,
    boletoCentavos: c.aluguelCentavos + c.multaCentavos,
  };
}

/** Rateio de água, luz e limpeza cobrados do inquilino, por imóvel. */
export type LinhaRateio = { numero: number; inquilino: string; aluguelCentavos: number; aguaCentavos: number; luzCentavos: number; limpezaCentavos: number; outrasCentavos: number; valorPagoCentavos: number; totalCentavos: number };

export function montarRateio(c: CobrancaRelatorio, numero: number, despesas: DespesaRelatorio[]): LinhaRateio {
  const soma = (cat: CategoriaDespesa) =>
    despesas.filter((d) => d.imovelId === c.imovelId && d.cobrarDe === "tenant" && d.categoria === cat).reduce((s, d) => s + d.valorCentavos, 0);
  const aguaCentavos = soma("agua");
  const luzCentavos = soma("luz");
  const limpezaCentavos = soma("limpeza");
  const outrasCentavos = despesas
    .filter((d) => d.imovelId === c.imovelId && d.cobrarDe === "tenant" && (d.categoria === "outra" || d.categoria === "seguro"))
    .reduce((s, d) => s + d.valorCentavos, 0);
  // Pagamento abate primeiro o aluguel: o que sobra é o que foi pago para o rateio.
  const valorPagoCentavos = Math.max(0, c.pagoCentavos - c.aluguelCentavos);
  return {
    numero,
    inquilino: c.locatario,
    aluguelCentavos: c.aluguelCentavos,
    aguaCentavos,
    luzCentavos,
    limpezaCentavos,
    outrasCentavos,
    valorPagoCentavos,
    totalCentavos: c.aluguelCentavos + aguaCentavos + luzCentavos + limpezaCentavos + outrasCentavos,
  };
}

export type ResumoRelatorio = {
  totalInquilinos: number;
  adimplentes: number;
  comPendencias: number;
  totalPrevisto: number;
  totalRecebido: number;
  totalPendente: number;
  totalBoleto: number;
  totalTaxas: number;
  totalDespesasDoLocador: number;
  totalAPagar: number;
};

/** Totais do locador. Recebido e taxa usam a mesma conta do Repasse (taxa sobre o aluguel pago). */
export function resumoRelatorio(linhas: LinhaLocatario[], despesasDoLocador: number, taxaBps: number): ResumoRelatorio {
  const previsto = linhas.reduce((s, l) => s + l.aluguelCentavos, 0);
  const recebido = linhas.reduce((s, l) => s + l.valorTotalCentavos, 0);
  const pagoAluguel = linhas.reduce((s, l) => s + l.pagoAluguelCentavos, 0);
  const conta = calcularRepasse({ recebidoCentavos: recebido, aluguelPagoCentavos: pagoAluguel, taxaBps, despesasCentavos: despesasDoLocador });
  return {
    totalInquilinos: linhas.length,
    adimplentes: linhas.filter((l) => l.status === "paid").length,
    comPendencias: linhas.filter((l) => l.pendenciaCentavos > 0).length,
    totalPrevisto: previsto,
    totalRecebido: recebido,
    totalPendente: linhas.reduce((s, l) => s + l.pendenciaCentavos, 0),
    totalBoleto: linhas.reduce((s, l) => s + l.boletoCentavos, 0),
    totalTaxas: conta.taxaCentavos,
    totalDespesasDoLocador: despesasDoLocador,
    totalAPagar: conta.repasseCentavos,
  };
}

/** Competências anteriores à informada, do mais antigo ao mais recente, sem incluir a própria (ex.: 2026-11, 3 → 2026-08, 09, 10). */
export function competenciasAnteriores(competencia: string, quantidade: number): string[] {
  const [ano, mes] = competencia.split("-").map(Number);
  const saida: string[] = [];
  for (let i = quantidade; i >= 1; i--) {
    const total = ano * 12 + (mes - 1) - i;
    const a = Math.floor(total / 12);
    const m = (total % 12) + 1;
    saida.push(`${a}-${String(m).padStart(2, "0")}`);
  }
  return saida;
}

/** Variação percentual (inteiro em centésimos de ponto, ex.: -1770 = -17,70%). Null quando não há base de comparação. */
export function variacaoBps(atualCentavos: number, anteriorCentavos: number): number | null {
  if (anteriorCentavos <= 0) return null;
  return Math.round(((atualCentavos - anteriorCentavos) * 10000) / anteriorCentavos);
}

/** Taxa em basis points (0 a 10000) de dois números em centavos. Null quando o denominador é zero. */
export function razaoBps(parte: number, todo: number): number | null {
  if (todo <= 0) return null;
  return Math.round((parte * 10000) / todo);
}
