import Link from "next/link";
import { exigirAcesso } from "@/lib/acesso";
import { formatarReais } from "@/lib/dinheiro";
import { listarLocadoresParaPainel } from "@/lib/locadores";
import { listarImoveisDoLocador } from "@/lib/imoveis";
import { contarLancamentosPorLocador, listarCategorias, listarLancamentos } from "@/lib/lancamentos";
import { competenciaParaTexto, competenciaValida } from "@/lib/lancamentos-regras";
import { competenciaAtual } from "@/lib/contratos-aluguel-regras";
import { hojeSaoPaulo } from "@/lib/contratos-encerrar-regras";
import { FormularioLancamento, type DadosEdicao } from "@/components/lancamentos/FormularioLancamento";

// Tela de Lançamentos do locador (US-4.4), no layout do design. Escopo: despesas por locador e competência.
export const dynamic = "force-dynamic";

type Params = { locador?: string; comp?: string; q?: string; editar?: string; salvo?: string };

const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function dataCurta(iso: string): string {
  return iso.split("-").reverse().join("/");
}

function rotuloImovel(i: { codigo: string | null; tipo: string | null; endereco: string | null }): string {
  return `${i.tipo ?? "Tipo não informado"} · ${i.codigo ?? i.endereco ?? "Sem código"}`;
}

export default async function PaginaLancamentos({ searchParams }: { searchParams: Promise<Params> }) {
  await exigirAcesso("lancamentos");
  const { locador, comp, q = "", editar, salvo } = await searchParams;
  const competencia = comp && competenciaValida(comp) ? comp : competenciaAtual();

  const [locadores, contagem, categorias] = await Promise.all([listarLocadoresParaPainel(), contarLancamentosPorLocador(competencia), listarCategorias()]);
  const termo = semAcento(q.trim());
  const lista = locadores
    .filter((l) => !termo || semAcento(l.nome).includes(termo))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const ownerId = locador ? Number(locador) : null;
  const selecionado = ownerId ? locadores.find((l) => l.id === ownerId) ?? null : null;
  const base = `/lancamentos?comp=${competencia}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  let imoveis: { id: number; rotulo: string }[] = [];
  let aluguelsCadastrados = 0;
  let itens: Awaited<ReturnType<typeof listarLancamentos>> = [];
  let edicao: DadosEdicao | null = null;
  if (selecionado) {
    const [imoveisDoLocador, lancamentos] = await Promise.all([listarImoveisDoLocador(selecionado.id), listarLancamentos(selecionado.id, competencia)]);
    imoveis = imoveisDoLocador.map((i) => ({ id: i.id, rotulo: rotuloImovel(i) }));
    aluguelsCadastrados = imoveisDoLocador.reduce((soma, i) => soma + i.aluguelCentavos, 0);
    itens = lancamentos;
    const alvo = editar ? lancamentos.find((l) => l.id === Number(editar)) : undefined;
    if (alvo) {
      edicao = {
        id: alvo.id,
        categoriaId: alvo.categoriaId,
        imovelId: alvo.imovelId,
        valor: (alvo.valorCentavos / 100).toFixed(2).replace(".", ","),
        data: alvo.data,
        cobrarDe: alvo.cobrarDe,
        descricao: alvo.descricao,
        observacao: alvo.observacao ?? "",
      };
    }
  }

  const totalLocador = itens.filter((i) => i.cobrarDe === "owner").reduce((soma, i) => soma + i.valorCentavos, 0);
  const saldoPrevisto = aluguelsCadastrados - totalLocador;
  const mensagemSalvo = salvo === "novo" ? "Despesa lançada." : salvo === "editado" ? "Despesa alterada." : null;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-navy">Lançamentos do locador</h1>
          <p className="text-muted">Registre as despesas de cada locador por competência.</p>
        </div>
        <form className="flex flex-col gap-1 font-semibold">
          <label htmlFor="comp">Competência</label>
          <div className="flex gap-2">
            <input id="comp" type="month" name="comp" defaultValue={competencia} className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3" />
            {locador ? <input type="hidden" name="locador" value={locador} /> : null}
            {q ? <input type="hidden" name="q" value={q} /> : null}
            <button type="submit" className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3 text-[14px] font-medium">Ver mês</button>
          </div>
        </form>
      </header>

      {mensagemSalvo ? (
        <p role="status" className="rounded-xl border border-[#CFE3D5] bg-[#EEF7F1] px-4 py-2.5 font-semibold text-[#1F5C36]">{mensagemSalvo}</p>
      ) : null}

      <div className="flex flex-wrap items-start gap-5">
        <section aria-label="Locadores" className="flex min-w-0 flex-[1_1_280px] flex-col gap-2">
          <form>
            <input type="hidden" name="comp" value={competencia} />
            {locador ? <input type="hidden" name="locador" value={locador} /> : null}
            <input type="search" name="q" defaultValue={q} placeholder="Buscar locador" aria-label="Buscar locador" className="min-h-11 w-full rounded-[10px] border border-[#D8DEE9] bg-white px-3.5" />
          </form>
          <div className="flex max-h-[760px] flex-col gap-1.5 overflow-y-auto p-0.5">
            {lista.map((l) => {
              const on = selecionado?.id === l.id;
              const n = contagem.get(l.id) ?? 0;
              return (
                <Link
                  key={l.id}
                  href={`/lancamentos?locador=${l.id}&comp=${competencia}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  aria-current={on ? "true" : undefined}
                  className={`flex min-h-[52px] items-center justify-between gap-2.5 rounded-xl border-2 bg-white px-3 py-2 text-[14px] font-semibold text-navy ${on ? "border-navy" : "border-[#E8ECF3]"}`}
                >
                  <span>{l.nome}</span>
                  <span className="shrink-0 font-medium text-muted">{n ? `${n} ${n === 1 ? "despesa" : "despesas"}` : ""}</span>
                </Link>
              );
            })}
            {lista.length === 0 ? <p className="p-2 text-muted">Nenhum locador encontrado.</p> : null}
          </div>
        </section>

        <div className="flex min-w-0 flex-[3_1_600px] flex-col gap-4">
          {selecionado ? (
            <>
              <FormularioLancamento
                key={edicao?.id ?? "novo"}
                ownerId={selecionado.id}
                competencia={competencia}
                nomeLocador={selecionado.nome}
                imoveis={imoveis}
                categorias={categorias}
                hojeIso={hojeSaoPaulo()}
                edicao={edicao}
                linkCancelar={`${base}&locador=${selecionado.id}`}
              />

              <section className="overflow-x-auto rounded-2xl border border-[#E8ECF3] bg-white shadow-[0_8px_24px_rgba(0,35,86,.06)]">
                <h2 className="border-b border-[#D8DEE9] px-4 py-3.5 text-[18px] font-bold text-navy">Despesas de {competenciaParaTexto(competencia)}</h2>
                {itens.length === 0 ? (
                  <p className="px-4 py-6 text-muted">Nenhuma despesa lançada para este locador nesta competência.</p>
                ) : (
                  itens.map((i) => (
                    <div key={i.id} className="flex flex-wrap items-center gap-3 border-b border-[#E8ECF3] px-4 py-2.5">
                      <div className="min-w-0 flex-[1_1_260px]">
                        <strong>{i.descricao}</strong>
                        <div className="text-muted">
                          {[i.categoriaNome, imoveis.find((x) => x.id === i.imovelId)?.rotulo ?? "Geral do locador", `Cobrar de ${i.cobrarDe === "tenant" ? "Locatário" : "Locador"}`, dataCurta(i.data), i.observacao]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                      <strong className="tabular-nums">{formatarReais(i.valorCentavos)}</strong>
                      <Link href={`${base}&locador=${selecionado.id}&editar=${i.id}`} className="flex min-h-11 items-center rounded-[10px] border border-[#A9B4C6] bg-white px-3 text-[14px] font-medium text-[#0E1B33]">
                        Editar
                      </Link>
                    </div>
                  ))
                )}
              </section>

              <section aria-label="Prévia do relatório" className="flex flex-col gap-2 rounded-2xl bg-navy p-5 text-white tabular-nums">
                <h2 className="text-[18px] font-bold">Prévia para o relatório de {competenciaParaTexto(competencia)}</h2>
                <div className="flex justify-between gap-3"><span>Aluguéis cadastrados</span><strong>{formatarReais(aluguelsCadastrados)}</strong></div>
                <div className="flex justify-between gap-3"><span>Despesas cobradas do locador</span><strong>{formatarReais(totalLocador)}</strong></div>
                <div className="flex justify-between gap-3 border-t border-gold pt-2 text-[18px]"><span>Saldo previsto antes da taxa</span><strong>{formatarReais(saldoPrevisto)}</strong></div>
                <p className="text-[#D5DEEC]">Previsão: considera os aluguéis cadastrados, não os recebidos. A taxa de administração ainda não está cadastrada.</p>
              </section>
            </>
          ) : (
            <p className="rounded-2xl border border-[#E8ECF3] bg-white p-6 text-muted">Escolha um locador na lista para lançar e ver as despesas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
