import "server-only";
import { buscarLocadorParaEdicao } from "./locadores-cadastro";
import { cobrancasDoLocadorNaCompetencia } from "./cobrancas";
import { listarContatosDeLocatarios } from "./locatarios";
import { imoveisPorIds, listarImoveisDoLocador } from "./imoveis";
import { listarContratosAtivosNaCompetencia } from "./contratos";
import { listarLancamentos } from "./lancamentos";
import { listarRepasses } from "./repasses";
import { TAXA_PADRAO_BPS } from "./repasses-regras";
import {
  classificarCategoria,
  competenciasAnteriores,
  montarLinhaLocatario,
  montarRateio,
  razaoBps,
  resumoRelatorio,
  variacaoBps,
  type CobrancaRelatorio,
  type DespesaRelatorio,
  type LinhaLocatario,
  type LinhaRateio,
  type ResumoRelatorio,
} from "./relatorio-regras";

// Relatório mensal por locador (US-5.1 e 5.2). Só leitura: nada é gravado. Toda consulta filtra company_id = 1.
// Os números são os mesmos da tela de Repasses (mesma conta de taxa e despesas).

export type MesDesempenho = { competencia: string; previsto: number | null; recebido: number | null };

export type DesempenhoLocador = {
  /** Últimos seis meses até a competência, do mais antigo ao mais recente. Mês sem cobrança fica com null. */
  meses: MesDesempenho[];
  /** Variação do total recebido em relação ao mês anterior, em basis points. Null sem base de comparação. */
  variacaoMesAnteriorBps: number | null;
  locatariosAtivos: number;
  imoveisTotal: number;
  imoveisOcupados: number;
  /** Ocupação em basis points. Null sem imóveis. */
  ocupacaoBps: number | null;
  /** Índice de recebimento (recebido ÷ previsto) em basis points. */
  indiceRecebimentoBps: number | null;
};

export type RelatorioLocador = {
  locador: { nome: string; cidade: string | null; documento: string | null; banco: string | null; agencia: string | null; conta: string | null; pix: string | null };
  competencia: string;
  linhas: LinhaLocatario[];
  rateio: LinhaRateio[];
  pendencias: LinhaLocatario[];
  despesasDoLocador: { descricao: string; data: string; valorCentavos: number }[];
  resumo: ResumoRelatorio;
  taxaBps: number;
  /** Data em que o repasse foi liberado, se já foi. */
  repasseLiberadoEm: string | null;
  desempenho: DesempenhoLocador;
};

/** Locadores com movimento na competência (mesma lista da tela de Repasses). */
export async function listarLocadoresDoRelatorio(competencia: string): Promise<{ id: number; nome: string }[]> {
  const linhas = await listarRepasses(competencia);
  return linhas.map((l) => ({ id: l.ownerId, nome: l.nome }));
}

type MesCalculado = {
  linhas: LinhaLocatario[];
  rateio: LinhaRateio[];
  despesasDoLocador: { descricao: string; data: string; valorCentavos: number }[];
  totalDespesasDoLocador: number;
  resumo: ResumoRelatorio;
  cobrancas: Awaited<ReturnType<typeof cobrancasDoLocadorNaCompetencia>>;
  tenantIds: number[];
};

/** Monta as linhas de um mês do locador. Usado pela folha e pelo desempenho dos meses anteriores. */
async function calcularMes(ownerId: number, competencia: string, taxaBps: number): Promise<MesCalculado> {
  const [cobrancas, lancamentos] = await Promise.all([
    cobrancasDoLocadorNaCompetencia(ownerId, competencia),
    listarLancamentos(ownerId, competencia),
  ]);
  const tenantIds = [...new Set(cobrancas.map((c) => c.tenantId).filter((id): id is number => id !== null))];
  const propertyIds = [...new Set(cobrancas.map((c) => c.propertyId).filter((id): id is number => id !== null))];
  const [inquilinos, imoveis] = await Promise.all([listarContatosDeLocatarios(tenantIds), imoveisPorIds(propertyIds)]);

  // Despesas: cobradas do inquilino entram no rateio e nas colunas do quadro; as do locador descontam o repasse.
  const despesas: DespesaRelatorio[] = lancamentos.map((l) => ({
    categoria: classificarCategoria(l.categoriaNome),
    valorCentavos: l.valorCentavos,
    imovelId: l.imovelId,
    cobrarDe: l.cobrarDe,
  }));
  const despesasDoLocador = lancamentos
    .filter((l) => l.cobrarDe === "owner")
    .map((l) => ({ descricao: l.descricao, data: l.data, valorCentavos: l.valorCentavos }));
  const totalDespesasDoLocador = despesasDoLocador.reduce((s, d) => s + d.valorCentavos, 0);

  const coberturas: CobrancaRelatorio[] = cobrancas.map((c) => {
    const imovel = c.propertyId !== null ? imoveis.get(c.propertyId) : undefined;
    return {
      contratoId: c.contratoId,
      locatario: c.tenantId !== null ? inquilinos.get(c.tenantId)?.nome ?? `Inquilino ${c.tenantId}` : "—",
      imovel: imovel ? `${imovel.codigo}${imovel.tipo ? ` · ${imovel.tipo}` : ""}` : "—",
      imovelId: c.propertyId ?? 0,
      aluguelCentavos: c.aluguelCentavos,
      pagoCentavos: c.pagoCentavos,
      pendenciaCentavos: c.pendenciaCentavos,
      multaCentavos: c.multaCentavos,
      vencimento: c.vencimento,
      dataPagamento: c.dataPagamento,
      status: c.status,
    };
  });

  const linhas = coberturas.map((c, i) => montarLinhaLocatario(c, i + 1, taxaBps, despesas));
  const rateio = coberturas.map((c, i) => montarRateio(c, i + 1, despesas));
  return {
    linhas,
    rateio,
    despesasDoLocador,
    totalDespesasDoLocador,
    resumo: resumoRelatorio(linhas, totalDespesasDoLocador, taxaBps),
    cobrancas,
    tenantIds,
  };
}

/** Seis meses de receita e os números de ocupação do locador, para a página de Desempenho. */
async function calcularDesempenho(ownerId: number, competencia: string, taxaBps: number, mesAtual: MesCalculado): Promise<DesempenhoLocador> {
  const anteriores = competenciasAnteriores(competencia, 5);
  const [mesesAnteriores, imoveis, contratosAtivos] = await Promise.all([
    Promise.all(anteriores.map((c) => calcularMes(ownerId, c, taxaBps))),
    listarImoveisDoLocador(ownerId),
    listarContratosAtivosNaCompetencia(competencia),
  ]);

  const meses: MesDesempenho[] = [
    ...anteriores.map((c, i) => ({
      competencia: c,
      previsto: mesesAnteriores[i].cobrancas.length ? mesesAnteriores[i].resumo.totalPrevisto : null,
      recebido: mesesAnteriores[i].cobrancas.length ? mesesAnteriores[i].resumo.totalRecebido : null,
    })),
    {
      competencia,
      previsto: mesAtual.cobrancas.length ? mesAtual.resumo.totalPrevisto : null,
      recebido: mesAtual.cobrancas.length ? mesAtual.resumo.totalRecebido : null,
    },
  ];

  const anterior = mesesAnteriores[mesesAnteriores.length - 1];
  const idsDoLocador = new Set(imoveis.map((i) => i.id));
  const ocupados = new Set(
    contratosAtivos.filter((c) => c.propertyId !== null && idsDoLocador.has(c.propertyId)).map((c) => c.propertyId as number),
  );

  return {
    meses,
    variacaoMesAnteriorBps: anterior.cobrancas.length ? variacaoBps(mesAtual.resumo.totalRecebido, anterior.resumo.totalRecebido) : null,
    locatariosAtivos: mesAtual.tenantIds.length,
    imoveisTotal: imoveis.length,
    imoveisOcupados: ocupados.size,
    ocupacaoBps: razaoBps(ocupados.size, imoveis.length),
    indiceRecebimentoBps: razaoBps(mesAtual.resumo.totalRecebido, mesAtual.resumo.totalPrevisto),
  };
}

export async function montarRelatorio(ownerId: number, competencia: string): Promise<RelatorioLocador | null> {
  const [locador, repasses] = await Promise.all([buscarLocadorParaEdicao(ownerId), listarRepasses(competencia)]);
  if (!locador) return null;

  const taxaBps = locador.admin_fee_percent_basis_points ?? TAXA_PADRAO_BPS;
  const mes = await calcularMes(ownerId, competencia, taxaBps);
  const desempenho = await calcularDesempenho(ownerId, competencia, taxaBps, mes);

  return {
    locador: {
      nome: locador.full_name,
      cidade: locador.city,
      documento: locador.document || null,
      banco: locador.bank_name,
      agencia: locador.bank_agency,
      conta: locador.bank_account ? `${locador.bank_account}${locador.bank_account_digit ? `-${locador.bank_account_digit}` : ""}` : null,
      pix: locador.pix_key,
    },
    competencia,
    linhas: mes.linhas,
    rateio: mes.rateio,
    pendencias: mes.linhas.filter((l) => l.pendenciaCentavos > 0),
    despesasDoLocador: mes.despesasDoLocador,
    resumo: mes.resumo,
    taxaBps,
    repasseLiberadoEm: repasses.find((r) => r.ownerId === ownerId)?.liberadoEm ?? null,
    desempenho,
  };
}
