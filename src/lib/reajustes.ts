import "server-only";
import { obterClienteServidor } from "./supabase/server";
import { listarContratosParaReajuste } from "./contratos";
import { aluguelNoMesPorContrato, registrarAlteracaoAluguel } from "./contratos-aluguel";
import { listarLocatariosParaPainel } from "./locatarios";
import { listarImoveisParaSelecao } from "./imoveis";
import { dataDoBanco } from "./contratos-encerrar-regras";
import { dentroDaJanela, JANELA_DIAS, proximoAniversario, validarReajuste, type EntradaReajuste } from "./reajustes-regras";

// Reajuste pelo índice (US-4.6). Grava pela alteração de aluguel (US-3.7): mês inteiro, sem retroativo.
// Nunca altera nem apaga linha existente. Toda consulta filtra company_id = 1.

const EMPRESA_ID = 1;

export type LinhaReajuste = {
  contratoId: number;
  inquilino: string;
  imovel: string;
  dataEfetiva: string;
  indicePadrao: string | null;
  aluguelCentavos: number;
};

/** Contratos ativos cujo aniversário cai nos próximos 60 dias, com o aluguel vigente no mês do reajuste. */
export async function listarReajustesProximos(hoje: string): Promise<LinhaReajuste[]> {
  const contratos = await listarContratosParaReajuste();
  const comData = contratos
    .map((c) => ({ ...c, inicio: dataDoBanco(c.startDate), dataEfetiva: proximoAniversario(dataDoBanco(c.startDate), hoje) }))
    .filter((c) => dentroDaJanela(c.dataEfetiva, hoje));
  if (comData.length === 0) return [];

  // Aluguel vigente no mês de cada reajuste (regra do mês inteiro, já testada).
  const porMes = new Map<string, typeof comData>();
  for (const c of comData) {
    const lista = porMes.get(c.dataEfetiva.slice(0, 7)) ?? [];
    lista.push(c);
    porMes.set(c.dataEfetiva.slice(0, 7), lista);
  }
  const aluguelPorContrato = new Map<number, number>();
  for (const [mes, lista] of porMes) {
    const noMes = await aluguelNoMesPorContrato(lista.map((c) => ({ id: c.id, rent_cents: c.rentCents, start_date: c.startDate })), mes);
    for (const c of lista) aluguelPorContrato.set(c.id, noMes.get(c.id) ?? c.rentCents);
  }

  const [locatarios, imoveis] = await Promise.all([listarLocatariosParaPainel(), listarImoveisParaSelecao()]);
  const nomeLocatario = new Map(locatarios.map((l) => [l.id, l.nome]));
  const imovelPorId = new Map(imoveis.map((i) => [i.id, i]));

  return comData
    .map((c) => {
      const im = imovelPorId.get(c.propertyId);
      return {
        contratoId: c.id,
        inquilino: nomeLocatario.get(c.tenantId) ?? "Locatário",
        imovel: im ? `${im.tipo ?? "Tipo não informado"} · ${im.codigo ?? im.endereco ?? "Sem código"}` : "Imóvel",
        dataEfetiva: c.dataEfetiva,
        indicePadrao: c.adjustmentIndex,
        aluguelCentavos: aluguelPorContrato.get(c.id) ?? c.rentCents,
      };
    })
    .sort((a, b) => a.dataEfetiva.localeCompare(b.dataEfetiva) || a.contratoId - b.contratoId);
}

export type ResultadoAplicacao = { ok: true; novoCentavos: number; dataEfetiva: string } | { ok: false; erro: string; erros?: Partial<Record<keyof EntradaReajuste, string>> };

/** Aplica o reajuste no próximo aniversário. Recalcula tudo no servidor e não aplica duas vezes. */
export async function aplicarReajuste(params: { contratoId: number; entrada: EntradaReajuste; hoje: string; usuarioId: number }): Promise<ResultadoAplicacao> {
  const { contratoId, entrada, hoje, usuarioId } = params;
  const contratos = await listarContratosParaReajuste();
  const contrato = contratos.find((c) => c.id === contratoId);
  if (!contrato) return { ok: false, erro: "Contrato ativo não encontrado." };

  const inicio = dataDoBanco(contrato.startDate);
  const dataEfetiva = proximoAniversario(inicio, hoje);
  const noMes = await aluguelNoMesPorContrato([{ id: contrato.id, rent_cents: contrato.rentCents, start_date: contrato.startDate }], dataEfetiva.slice(0, 7));
  const aluguelCentavos = noMes.get(contrato.id) ?? contrato.rentCents;

  const resultado = validarReajuste(entrada, { aluguelCentavos, inicio }, hoje);
  if (!resultado.ok) return { ok: false, erro: "Confira os campos.", erros: resultado.erros };
  const { dados } = resultado;

  const db = obterClienteServidor();
  const { data: ja, error } = await db
    .from("contract_rent_changes")
    .select("id")
    .eq("company_id", EMPRESA_ID)
    .eq("contract_id", contratoId)
    .eq("effective_date", dados.dataEfetiva)
    .like("note", "Reajuste%")
    .limit(1);
  if (error) return { ok: false, erro: "Não foi possível verificar reajustes anteriores." };
  if ((ja ?? []).length > 0) return { ok: false, erro: "Este contrato já teve reajuste aplicado nesta data." };

  try {
    await registrarAlteracaoAluguel({
      contratoId,
      dados: { competencia: dados.competencia, efetivaEm: dados.dataEfetiva, rentCents: dados.novoCentavos, observacao: dados.observacao },
      usuarioId,
    });
  } catch (erro) {
    return { ok: false, erro: erro instanceof Error ? erro.message : "Não foi possível aplicar o reajuste." };
  }
  return { ok: true, novoCentavos: dados.novoCentavos, dataEfetiva: dados.dataEfetiva };
}

export type ReajusteAgendado = {
  contratoId: number;
  inquilino: string;
  imovel: string;
  dataEfetiva: string;
  anteriorCentavos: number;
  novoCentavos: number;
  observacao: string | null;
};

/** Reajustes já agendados (alteração de aluguel com observação "Reajuste…") que começam dentro da janela. */
export async function listarReajustesAgendados(hoje: string): Promise<ReajusteAgendado[]> {
  const fim = new Date(`${hoje}T12:00:00Z`);
  fim.setUTCDate(fim.getUTCDate() + JANELA_DIAS);
  const limite = fim.toISOString().slice(0, 10);

  const { data, error } = await obterClienteServidor()
    .from("contract_rent_changes")
    .select("contract_id, effective_date, rent_cents, previous_rent_cents, note")
    .eq("company_id", EMPRESA_ID)
    .like("note", "Reajuste%")
    .gte("effective_date", hoje)
    .lte("effective_date", limite)
    .order("effective_date", { ascending: true });
  if (error) throw new Error("Não foi possível carregar os reajustes agendados.");
  if (!data || data.length === 0) return [];

  const [contratos, locatarios, imoveis] = await Promise.all([listarContratosParaReajuste(), listarLocatariosParaPainel(), listarImoveisParaSelecao()]);
  const contratoPorId = new Map(contratos.map((c) => [c.id, c]));
  const nomeLocatario = new Map(locatarios.map((l) => [l.id, l.nome]));
  const imovelPorId = new Map(imoveis.map((i) => [i.id, i]));

  return data.flatMap((r) => {
    const c = contratoPorId.get(r.contract_id);
    if (!c) return [];
    const im = imovelPorId.get(c.propertyId);
    return [
      {
        contratoId: r.contract_id,
        inquilino: nomeLocatario.get(c.tenantId) ?? "Locatário",
        imovel: im ? `${im.tipo ?? "Tipo não informado"} · ${im.codigo ?? im.endereco ?? "Sem código"}` : "Imóvel",
        dataEfetiva: r.effective_date,
        anteriorCentavos: r.previous_rent_cents ?? c.rentCents,
        novoCentavos: r.rent_cents,
        observacao: r.note,
      },
    ];
  });
}

/** Reajuste agendado de um contrato numa data, para gerar o aditivo. Null se não existir. */
export async function buscarReajusteAgendado(contratoId: number, dataEfetiva: string): Promise<ReajusteAgendado | null> {
  const { data, error } = await obterClienteServidor()
    .from("contract_rent_changes")
    .select("contract_id, effective_date, rent_cents, previous_rent_cents, note")
    .eq("company_id", EMPRESA_ID)
    .eq("contract_id", contratoId)
    .eq("effective_date", dataEfetiva)
    .like("note", "Reajuste%")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o reajuste.");
  if (!data) return null;
  return {
    contratoId: data.contract_id,
    inquilino: "",
    imovel: "",
    dataEfetiva: data.effective_date,
    anteriorCentavos: data.previous_rent_cents ?? 0,
    novoCentavos: data.rent_cents,
    observacao: data.note,
  };
}
