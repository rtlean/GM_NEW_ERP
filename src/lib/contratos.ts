import "server-only";
import { obterClienteServidor } from "./supabase/server";
import { imoveisPorIds, listarImoveisParaSelecao, type ImovelParaSelecao } from "./imoveis";
import { listarLocadoresParaPainel } from "./locadores";
import { listarLocatariosParaPainel } from "./locatarios";
import type { DadosContrato } from "./contratos-regras";


// Leitura de contratos para outros módulos (US-3.3). Só leitura. Toda consulta filtra company_id = 1.
// A tela de contratos e a criação de contratos ficam na fatia 3 (US-3.5 em diante).

const EMPRESA_ID = 1;

export type ContratoAtivo = { propertyId: number; aluguelCentavos: number };

/** Contratos ativos de cada locatário (imóvel e aluguel). Locatário sem contrato ativo não aparece no mapa. */
export async function contratosAtivosPorLocatario(locatarioIds: number[]): Promise<Map<number, ContratoAtivo[]>> {
  const mapa = new Map<number, ContratoAtivo[]>();
  if (locatarioIds.length === 0) return mapa;

  const { data, error } = await obterClienteServidor()
    .from("contracts")
    .select("tenant_id, property_id, rent_cents")
    .eq("company_id", EMPRESA_ID)
    .eq("status", "active")
    .in("tenant_id", locatarioIds);
  if (error) throw new Error("Não foi possível carregar os contratos.");

  for (const linha of data ?? []) {
    const lista = mapa.get(linha.tenant_id) ?? [];
    lista.push({ propertyId: linha.property_id, aluguelCentavos: linha.rent_cents ?? 0 });
    mapa.set(linha.tenant_id, lista);
  }
  return mapa;
}

export type ContratoParaPainel = { locatarioId: number; propertyId: number; aluguelCentavos: number; taxaPropria: boolean };

/** Todos os contratos ativos com o aluguel do contrato, para o painel (Dashboard). Só leitura. */
export async function listarContratosAtivosParaPainel(): Promise<ContratoParaPainel[]> {
  const { data, error } = await obterClienteServidor()
    .from("contracts")
    .select("tenant_id, property_id, rent_cents, admin_fee_percent_basis_points")
    .eq("company_id", EMPRESA_ID)
    .eq("status", "active");
  if (error) throw new Error("Não foi possível carregar os contratos.");

  return (data ?? []).map((c) => ({
    locatarioId: c.tenant_id,
    propertyId: c.property_id,
    aluguelCentavos: c.rent_cents ?? 0,
    taxaPropria: c.admin_fee_percent_basis_points != null,
  }));
}

// ---- Tela de Contratos (US-3.5a): lista só para leitura e dados para o assistente.

export type SituacaoContrato = "active" | "ended" | "draft";
export type FiltroSituacao = "todos" | "ativos" | "encerrados";

export type LinhaContrato = {
  id: number;
  locatario: string;
  imovelCodigo: string | null;
  imovelTipo: string | null;
  locador: string;
  aluguelCentavos: number;
  situacao: SituacaoContrato;
  inicio: string;
  fim: string | null;
  taxaPercentual: number | null;
};

const SEM_NOME = "Não encontrado";

/** Lista de contratos com locatário, imóvel e locador. Filtra por situação e por busca (nome, imóvel ou locador). */
export async function listarContratos(filtros: { busca?: string; situacao?: FiltroSituacao } = {}): Promise<LinhaContrato[]> {
  let consulta = obterClienteServidor()
    .from("contracts")
    .select("id, tenant_id, property_id, rent_cents, status, start_date, end_date, admin_fee_percent_basis_points")
    .eq("company_id", EMPRESA_ID)
    .order("id", { ascending: true });
  if (filtros.situacao === "ativos") consulta = consulta.eq("status", "active");
  if (filtros.situacao === "encerrados") consulta = consulta.eq("status", "ended");

  const { data, error } = await consulta;
  if (error) throw new Error("Não foi possível carregar os contratos.");
  const linhas = data ?? [];

  const [locatarios, locadores, imoveis] = await Promise.all([
    listarLocatariosParaPainel(),
    listarLocadoresParaPainel(),
    imoveisPorIds([...new Set(linhas.map((c) => c.property_id))]),
  ]);
  const nomeLocatario = new Map(locatarios.map((l) => [l.id, l.nome]));
  const nomeLocador = new Map(locadores.map((l) => [l.id, l.nome]));

  const lista: LinhaContrato[] = linhas.map((c) => {
    const imovel = imoveis.get(c.property_id);
    return {
      id: c.id,
      locatario: nomeLocatario.get(c.tenant_id) ?? SEM_NOME,
      imovelCodigo: imovel?.codigo ?? null,
      imovelTipo: imovel?.tipo ?? null,
      locador: imovel?.ownerId != null ? (nomeLocador.get(imovel.ownerId) ?? SEM_NOME) : SEM_NOME,
      aluguelCentavos: c.rent_cents ?? 0,
      situacao: c.status as SituacaoContrato,
      inicio: c.start_date,
      fim: c.end_date,
      taxaPercentual: c.admin_fee_percent_basis_points != null ? c.admin_fee_percent_basis_points / 100 : null,
    };
  });

  const termo = (filtros.busca ?? "").trim().toLowerCase();
  if (!termo) return lista;
  return lista.filter((l) =>
    [l.locatario, l.locador, l.imovelCodigo ?? "", l.imovelTipo ?? ""].join(" ").toLowerCase().includes(termo),
  );
}

export type ImovelParaContrato = ImovelParaSelecao & { ocupadoPor: string | null; ocupadoPorId: number | null };

/** Imóveis para escolher no contrato, com o locatário atual de quem já estiver alugado. */
export async function listarImoveisParaContrato(): Promise<ImovelParaContrato[]> {
  const [imoveis, ativos, locatarios] = await Promise.all([
    listarImoveisParaSelecao(),
    obterClienteServidor().from("contracts").select("property_id, tenant_id").eq("company_id", EMPRESA_ID).eq("status", "active"),
    listarLocatariosParaPainel(),
  ]);
  if (ativos.error) throw new Error("Não foi possível carregar os contratos.");
  const nomeLocatario = new Map(locatarios.map((l) => [l.id, l.nome]));
  const ocupados = new Map((ativos.data ?? []).map((c) => [c.property_id, c.tenant_id]));

  return imoveis.map((i) => {
    const locatarioId = ocupados.get(i.id) ?? null;
    return {
      ...i,
      ocupadoPorId: locatarioId,
      ocupadoPor: locatarioId != null ? (nomeLocatario.get(locatarioId) ?? SEM_NOME) : null,
    };
  });
}

// ---- Criar contrato (US-3.5b). Usa a regra de renovação e de imóvel alugado para outro locatário.

export type EntradaCriarContrato = {
  locadorId: number;
  imovelId: number;
  locatarioId: number;
  dados: DadosContrato;
};

export type ResultadoCriarContrato = { ok: true; id: number } | { ok: false; erro: string };

/** Grava o contrato. Se o locatário já alugava o imóvel, encerra o contrato anterior na data de início do novo. */
export async function criarContrato(entrada: EntradaCriarContrato): Promise<ResultadoCriarContrato> {
  const cliente = obterClienteServidor();
  const { dados } = entrada;

  const { data: imovel, error: erroImovel } = await cliente
    .from("properties")
    .select("id, owner_id")
    .eq("company_id", EMPRESA_ID)
    .eq("id", entrada.imovelId)
    .maybeSingle();
  if (erroImovel) return { ok: false, erro: "Não foi possível conferir o imóvel. Tente de novo." };
  if (!imovel) return { ok: false, erro: "Imóvel não encontrado." };
  if (imovel.owner_id !== entrada.locadorId) return { ok: false, erro: "Este imóvel não pertence ao locador escolhido." };

  const { data: ativos, error: erroAtivos } = await cliente
    .from("contracts")
    .select("id, tenant_id, end_date, status")
    .eq("company_id", EMPRESA_ID)
    .eq("property_id", entrada.imovelId)
    .eq("status", "active");
  if (erroAtivos) return { ok: false, erro: "Não foi possível conferir os contratos do imóvel." };

  const deOutroLocatario = (ativos ?? []).some((c) => c.tenant_id !== entrada.locatarioId);
  if (deOutroLocatario) {
    return { ok: false, erro: "Este imóvel já está alugado para outro locatário. Encerre o contrato atual antes de criar outro." };
  }

  // Renovação: o mesmo locatário já tem contrato ativo neste imóvel. O anterior termina no início do novo.
  const anteriores = ativos ?? [];
  const inicioTimestamp = `${dados.inicio}T00:00:00-03:00`;
  for (const anterior of anteriores) {
    const { error } = await cliente
      .from("contracts")
      .update({ status: "ended", end_date: inicioTimestamp })
      .eq("company_id", EMPRESA_ID)
      .eq("id", anterior.id);
    if (error) return { ok: false, erro: "Não foi possível encerrar o contrato anterior. Nada foi gravado." };
  }

  const { data: novo, error: erroNovo } = await cliente
    .from("contracts")
    .insert({
      company_id: EMPRESA_ID,
      property_id: entrada.imovelId,
      tenant_id: entrada.locatarioId,
      start_date: inicioTimestamp,
      end_date: dados.fim ? `${dados.fim}T00:00:00-03:00` : null,
      rent_cents: dados.rentCents,
      due_day: dados.dueDay,
      adjustment_index: dados.indice,
      guarantee_type: dados.garantia,
      admin_fee_percent_basis_points: dados.taxaBps,
      status: "active",
    })
    .select("id")
    .single();

  if (erroNovo || !novo) {
    // Desfaz o encerramento do anterior para não deixar o imóvel sem contrato.
    for (const anterior of anteriores) {
      await cliente.from("contracts").update({ status: "active", end_date: anterior.end_date }).eq("company_id", EMPRESA_ID).eq("id", anterior.id);
    }
    return { ok: false, erro: "Não foi possível gravar o contrato. Tente de novo." };
  }

  return { ok: true, id: novo.id };
}
