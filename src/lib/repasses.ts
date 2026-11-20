import "server-only";
import { obterClienteServidor } from "./supabase/server";
import { listarLocadoresParaPainel } from "./locadores";
import { buscarLocadorParaEdicao } from "./locadores-cadastro";
import { recebidoPorLocador } from "./cobrancas";
import { despesasCobraDoLocadorPorLocador } from "./lancamentos";
import { calcularRepasse, podeLiberar } from "./repasses-regras";

// Repasse manual ao locador (US-4.8). Grava em owner_repasses. Não envia Pix nem TED.
// Nunca apaga nem altera linha antiga. Um repasse por locador e competência.
// Toda consulta filtra company_id = 1.

const EMPRESA_ID = 1;

export type LinhaRepasse = {
  ownerId: number;
  nome: string;
  recebidoCentavos: number;
  aluguelPagoCentavos: number;
  taxaCentavos: number;
  taxaBps: number;
  despesasCentavos: number;
  repasseCentavos: number;
  liberadoEm: string | null;
  liberadoCentavos: number | null;
};

/** Repasses da competência: um por locador com movimento (recebido, despesa ou repasse já feito). */
export async function listarRepasses(competencia: string): Promise<LinhaRepasse[]> {
  const [locadores, recebido, despesas, liberados] = await Promise.all([
    listarLocadoresParaPainel(),
    recebidoPorLocador(competencia),
    despesasCobraDoLocadorPorLocador(competencia),
    repassesFeitos(competencia),
  ]);

  return locadores
    .map((l) => {
      const rec = recebido.get(l.id) ?? { totalCentavos: 0, aluguelCentavos: 0 };
      const desp = despesas.get(l.id) ?? 0;
      const conta = calcularRepasse({ recebidoCentavos: rec.totalCentavos, aluguelPagoCentavos: rec.aluguelCentavos, taxaBps: l.taxaBps, despesasCentavos: desp });
      const feito = liberados.get(l.id);
      return {
        ownerId: l.id,
        nome: l.nome,
        recebidoCentavos: rec.totalCentavos,
        aluguelPagoCentavos: rec.aluguelCentavos,
        taxaCentavos: conta.taxaCentavos,
        taxaBps: conta.taxaBps,
        despesasCentavos: desp,
        repasseCentavos: conta.repasseCentavos,
        liberadoEm: feito?.data ?? null,
        liberadoCentavos: feito?.valor ?? null,
      };
    })
    .filter((l) => l.recebidoCentavos > 0 || l.despesasCentavos > 0 || l.liberadoEm !== null)
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

async function repassesFeitos(competencia: string): Promise<Map<number, { data: string; valor: number }>> {
  const { data, error } = await obterClienteServidor()
    .from("owner_repasses")
    .select("owner_id, repass_date, amount_cents")
    .eq("company_id", EMPRESA_ID)
    .eq("competence", competencia)
    .order("repass_date", { ascending: true });
  if (error) throw new Error("Não foi possível carregar os repasses.");
  const mapa = new Map<number, { data: string; valor: number }>();
  for (const r of data ?? []) {
    if (!mapa.has(r.owner_id)) mapa.set(r.owner_id, { data: r.repass_date, valor: r.amount_cents });
  }
  return mapa;
}

export type ResultadoLiberar = { ok: true; repasseCentavos: number } | { ok: false; erro: string };

/** Libera o repasse do locador na competência. Recalcula no servidor e grava data, valor, taxa e dados bancários do momento. */
export async function liberarRepasse(params: { ownerId: number; competencia: string; hoje: string; usuarioId: number }): Promise<ResultadoLiberar> {
  const { ownerId, competencia, hoje, usuarioId } = params;
  const linha = (await listarRepasses(competencia)).find((l) => l.ownerId === ownerId);
  const locadores = await listarLocadoresParaPainel();
  const existe = locadores.some((l) => l.id === ownerId);
  if (!existe) return { ok: false, erro: "Locador não encontrado." };

  const calc = linha
    ? { repasseCentavos: linha.repasseCentavos, taxaCentavos: linha.taxaCentavos }
    : (() => {
        const l = locadores.find((x) => x.id === ownerId)!;
        return calcularRepasse({ recebidoCentavos: 0, aluguelPagoCentavos: 0, taxaBps: l.taxaBps, despesasCentavos: 0 });
      })();
  const jaLiberado = linha?.liberadoEm != null;
  const pode = podeLiberar(calc.repasseCentavos, jaLiberado);
  if (!pode.ok) return pode;

  const locador = await buscarLocadorParaEdicao(ownerId);
  if (!locador) return { ok: false, erro: "Locador não encontrado." };

  const { error } = await obterClienteServidor().from("owner_repasses").insert({
    company_id: EMPRESA_ID,
    owner_id: ownerId,
    competence: competencia,
    repass_date: hoje,
    amount_cents: calc.repasseCentavos,
    admin_fee_cents: calc.taxaCentavos,
    repass_method: locador.preferred_repass_method,
    pix_type_snapshot: locador.pix_type,
    pix_key_snapshot: locador.pix_key,
    bank_name_snapshot: locador.bank_name,
    bank_code_snapshot: locador.bank_code,
    agency_snapshot: locador.bank_agency,
    account_snapshot: locador.bank_account,
    digit_snapshot: locador.bank_account_digit,
    account_type_snapshot: locador.account_type,
    beneficiary_snapshot: locador.full_name,
    document_snapshot: locador.document,
    registered_by: usuarioId,
  });
  if (error) return { ok: false, erro: "Não foi possível registrar o repasse. Tente de novo." };

  const evento = {
    company_id: EMPRESA_ID,
    user_id: usuarioId,
    entity: "owner",
    entity_id: ownerId,
    action: "repass.released",
    metadata: JSON.stringify({ competencia, valorCentavos: calc.repasseCentavos, taxaCentavos: calc.taxaCentavos, data: hoje }),
  };
  // Se a auditoria falhar duas vezes, o repasse fica gravado. Nada é apagado.
  const primeira = await obterClienteServidor().from("audit_events").insert(evento);
  if (primeira.error) await obterClienteServidor().from("audit_events").insert(evento);

  return { ok: true, repasseCentavos: calc.repasseCentavos };
}
