import "server-only";
import { listarContratosAtivosNaCompetencia } from "./contratos";
import { contratosComCobrancaNaCompetencia, gerarCobrancasDoMes, inquilinosEmAtrasoAte, type ResumoGeracao } from "./cobrancas";
import { listarContatosDeLocatarios } from "./locatarios";
import { temContatoDeCobranca, validarSelecao, type LinhaFaturamento } from "./faturamento-regras";
import { vencimentoDaCompetencia } from "./cobrancas-gerar-regras";

// Faturamento em lote (US-4.9). Monta a prévia do mês e gera só os contratos marcados.
// Não gera nada além do que a US-4.1 já gera. Toda consulta filtra company_id = 1 (feito nas funções chamadas).

/** Prévia do mês: um contrato por linha, na mesma regra da US-4.1 (contrato ativo, com inquilino e imóvel, aluguel maior que zero). */
export async function listarFaturamento(competencia: string): Promise<LinhaFaturamento[]> {
  const [contratos, comCobranca, emAtraso] = await Promise.all([
    listarContratosAtivosNaCompetencia(competencia),
    contratosComCobrancaNaCompetencia(competencia),
    inquilinosEmAtrasoAte(competencia),
  ]);
  const validos = contratos.filter((c) => c.tenantId !== null && c.propertyId !== null && c.aluguelCentavos > 0);
  const inquilinos = await listarContatosDeLocatarios([...new Set(validos.map((c) => c.tenantId as number))]);
  const vencimento = vencimentoDaCompetencia(competencia);

  return validos.map((c) => {
    const tenantId = c.tenantId as number;
    const contato = inquilinos.get(tenantId);
    return {
      contratoId: c.id,
      inquilino: contato?.nome ?? `Inquilino ${tenantId}`,
      vencimento,
      aluguelCentavos: c.aluguelCentavos,
      semContato: !temContatoDeCobranca(contato?.email, contato?.telefone),
      jaGerada: comCobranca.has(c.id),
      emAtraso: emAtraso.has(tenantId),
    };
  });
}

export type EntradaFaturamento = { competencia: string; contratoIds: number[]; usuarioId: number };

/** Gera as cobranças dos contratos escolhidos. Refaz a checagem no servidor: não confia só na tela. */
export async function gerarFaturamento({ competencia, contratoIds, usuarioId }: EntradaFaturamento): Promise<ResumoGeracao> {
  const linhas = await listarFaturamento(competencia);
  const checagem = validarSelecao(linhas, contratoIds);
  if (!checagem.ok) throw new Error(checagem.erro);
  return gerarCobrancasDoMes({ competencia, usuarioId, contratoIds: checagem.contratoIds });
}

