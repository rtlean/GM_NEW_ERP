import Link from "next/link";
import { exigirAcesso } from "@/lib/acesso";
import { competenciaAtual } from "@/lib/contratos-aluguel-regras";
import { competenciaValida, competenciaParaTexto } from "@/lib/lancamentos-regras";
import { listarLocadoresDoRelatorio, montarRelatorio } from "@/lib/relatorio";
import { RelatorioFolha } from "@/components/relatorio/RelatorioFolha";
import { BotaoImprimir } from "@/components/relatorio/BotaoImprimir";
import { formatarReais } from "@/lib/dinheiro";

// Relatório mensal (US-5.1 a 5.3), layout do design RelatorioMensal.dc.html.
export const dynamic = "force-dynamic";

export default async function PaginaRelatorio({ searchParams }: { searchParams: Promise<{ comp?: string; dono?: string }> }) {
  await exigirAcesso("relatorio");
  const { comp, dono } = await searchParams;
  const competencia = comp && competenciaValida(comp) ? comp : competenciaAtual();
  const locadores = await listarLocadoresDoRelatorio(competencia);
  const escolhido = Number(dono) || locadores[0]?.id;
  const relatorio = escolhido ? await montarRelatorio(escolhido, competencia) : null;
  const texto = relatorio
    ? `Olá! Segue o relatório mensal de locação de ${competenciaParaTexto(competencia)} de ${relatorio.locador.nome}. O PDF vai em anexo.`
    : "";
  const nomeArquivo = relatorio ? `Relatorio_${relatorio.locador.nome.replace(/[^\p{L}\p{N}]+/gu, "_")}_${competencia}` : "Relatorio";

  return (
    <div className="flex flex-col gap-5">
      <style>{`@page { size: A4 landscape; margin: 8mm; }
        @media print { body * { visibility: hidden; } .area-impressao, .area-impressao * { visibility: visible; } .area-impressao { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none !important; } }`}</style>
      <header className="no-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-navy">Relatório mensal</h1>
          <p className="text-muted">Relatório por locador, pronto para conferir, baixar e enviar.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <form className="flex flex-col gap-1 font-semibold">
            <label htmlFor="comp">Competência</label>
            <div className="flex gap-2">
              <input id="comp" type="month" name="comp" defaultValue={competencia} className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3" />
              {escolhido ? <input type="hidden" name="dono" value={escolhido} /> : null}
              <button type="submit" className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3 text-[14px] font-medium">Ver mês</button>
            </div>
          </form>
          {relatorio ? (
            <>
              <BotaoImprimir nomeArquivo={nomeArquivo} />
              <a href={`mailto:?subject=${encodeURIComponent(`Relatório mensal de locação ${competencia}`)}&body=${encodeURIComponent(texto)}`} className="flex min-h-11 items-center rounded-[10px] border border-[#A9B4C6] bg-white px-4 font-semibold text-navy">
                Enviar por e-mail
              </a>
              <a href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener" className="flex min-h-11 items-center rounded-[10px] border border-[#A9B4C6] bg-white px-4 font-semibold text-navy">
                Enviar por WhatsApp
              </a>
            </>
          ) : null}
        </div>
      </header>

      <div className="flex flex-wrap items-start gap-4">
        <nav aria-label="Locadores" className="no-print flex max-h-[1000px] min-w-[240px] flex-1 flex-col gap-1.5 overflow-y-auto">
          {locadores.length === 0 ? <p className="text-muted">Nenhum locador com movimento nesta competência.</p> : null}
          {locadores.map((l) => {
            const ativo = l.id === escolhido;
            return (
              <Link key={l.id} href={`/relatorio?comp=${competencia}&dono=${l.id}`} aria-current={ativo ? "page" : undefined} className={`min-h-12 rounded-xl border-2 bg-white px-3 py-2 text-[14px] font-semibold text-navy ${ativo ? "border-navy" : "border-[#E8ECF3]"}`}>
                {l.nome}
              </Link>
            );
          })}
        </nav>
        <section aria-label="Prévia do PDF" className="min-w-0 flex-[999_1_640px] overflow-x-auto rounded-2xl bg-[#E8EDF6] p-4">
          {relatorio ? (
            <div className="mx-auto w-[1123px] max-w-full rounded-lg bg-white shadow-[0_8px_24px_rgba(0,35,86,.06)]">
              <RelatorioFolha r={relatorio} />
            </div>
          ) : (
            <p className="text-muted">Escolha um locador para ver o relatório.</p>
          )}
        </section>
      </div>
      {relatorio ? <p className="no-print text-[13px] text-muted">Total a repassar: <strong className="tabular-nums">{formatarReais(relatorio.resumo.totalAPagar)}</strong></p> : null}
    </div>
  );
}
