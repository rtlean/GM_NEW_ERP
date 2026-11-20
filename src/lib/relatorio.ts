import "server-only";
import { buscarLocadorParaEdicao } from "./locadores-cadastro";
import { cobrancasDoLocadorNaCompetencia } from "./cobrancas";
import { listarContatosDeLocatarios } from "./locatarios";
import { imoveisPorIds } from "./imoveis";
import { listarLancamentos } from "./lancamentos";
import { listarRepasses } from "./repasses";
import { TAXA_PADRAO_BPS } from "./repasses-regras";
import {
  classificarCategoria,
  montarLinhaLocatario,
  montarRateio,
  resumoRelatorio,
  type CobrancaRelatorio,
  type DespesaRelatorio,
  type LinhaLocatario,
  type LinhaRateio,
  type ResumoRelatorio,
} from "./relatorio-regras";

// Relatório mensal por locador (US-5.1). Só leitura: nada é gravado. Toda consulta filtra company_id = 1.
// Os números são os mesmos da tela de Repasses (mesma conta de taxa e despesas).

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
};

/** Locadores com movimento na competência (mesma lista da tela de Repasses). */
export async function listarLocadoresDoRelatorio(competencia: string): Promise<{ id: number; nome: string }[]> {
  const linhas = await listarRepasses(competencia);
  return linhas.map((l) => ({ id: l.ownerId, nome: l.nome }));
}

export async function montarRelatorio(ownerId: number, competencia: string): Promise<RelatorioLocador | null> {
  const [locador, cobrancas, lancamentos, repasses] = await Promise.all([
    buscarLocadorParaEdicao(ownerId),
    cobrancasDoLocadorNaCompetencia(ownerId, competencia),
    listarLancamentos(ownerId, competencia),
    listarRepasses(competencia),
  ]);
  if (!locador) return null;

  const taxaBps = locador.admin_fee_percent_basis_points ?? TAXA_PADRAO_BPS;
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
  const pendencias = linhas.filter((l) => l.pendenciaCentavos > 0);

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
    linhas,
    rateio,
    pendencias,
    despesasDoLocador,
    resumo: resumoRelatorio(linhas, totalDespesasDoLocador, taxaBps),
    taxaBps,
    repasseLiberadoEm: repasses.find((r) => r.ownerId === ownerId)?.liberadoEm ?? null,
  };
}
