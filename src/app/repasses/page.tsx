import { exigirAcesso } from "@/lib/acesso";
import { listarRepasses } from "@/lib/repasses";
import { competenciaAtual } from "@/lib/contratos-aluguel-regras";
import { competenciaValida } from "@/lib/lancamentos-regras";
import { formatarReais } from "@/lib/dinheiro";
import { dataBR } from "@/lib/aditivo-reajuste-regras";
import { liberarRepasseAction } from "./actions";

// Tela Repasses (US-4.8): repasse manual por locador e competência. Não envia Pix nem TED.
export const dynamic = "force-dynamic";

export default async function PaginaRepasses({ searchParams }: { searchParams: Promise<{ competencia?: string; ok?: string; erro?: string }> }) {
  await exigirAcesso("repasses");
  const { competencia: pedida, ok, erro } = await searchParams;
  const competencia = pedida && competenciaValida(pedida) ? pedida : competenciaAtual();
  const linhas = await listarRepasses(competencia);
  const pendente = linhas.filter((l) => l.liberadoEm === null).reduce((s, l) => s + Math.max(l.repasseCentavos, 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-navy">Repasses</h1>
          <p className="text-muted">Repasse por locador. Taxa padrão 10%, descontadas as despesas cobradas do locador.</p>
        </div>
        <form className="flex items-end gap-2">
          <label className="flex flex-col text-[13px] font-semibold text-navy">
            Competência
            <input type="month" name="competencia" defaultValue={competencia} className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-2" />
          </label>
          <button type="submit" className="min-h-11 rounded-[10px] bg-navy px-4 font-bold text-white">Ver</button>
        </form>
      </header>

      {ok ? <p role="status" className="rounded-xl border border-[#CFE3D5] bg-[#EEF7F1] px-4 py-2.5 font-semibold text-[#1F5C36]">{ok}</p> : null}
      {erro ? <p role="alert" className="rounded-xl border border-[#E8C4C4] bg-[#FBEFEF] px-4 py-2.5 font-semibold text-[#8A1F1F]">{erro}</p> : null}

      <section className="overflow-x-auto rounded-2xl border border-[#E8ECF3] bg-white shadow-[0_8px_24px_rgba(0,35,86,.06)]">
        <h2 className="border-b border-[#D8DEE9] px-4 py-3.5 text-[18px] font-bold text-navy">
          Locadores · {competencia} · a liberar {formatarReais(pendente)}
        </h2>
        {linhas.length === 0 ? (
          <p className="px-4 py-6 text-muted">Nenhum recebimento nem despesa nesta competência.</p>
        ) : (
          linhas.map((l) => (
            <form key={l.ownerId} action={liberarRepasseAction} className="grid min-h-[60px] items-center gap-3 border-b border-[#E8ECF3] px-4 py-2 md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_170px]">
              <input type="hidden" name="ownerId" value={l.ownerId} />
              <input type="hidden" name="competencia" value={competencia} />
              <strong>{l.nome}</strong>
              <span className="tabular-nums">Recebido {formatarReais(l.recebidoCentavos)}</span>
              <span className="tabular-nums text-muted">Taxa {(l.taxaBps / 100).toFixed(2).replace(".", ",")}% {formatarReais(l.taxaCentavos)}</span>
              <span className="tabular-nums text-muted">Despesas {formatarReais(l.despesasCentavos)}</span>
              <strong className="tabular-nums">Repasse {formatarReais(l.repasseCentavos)}</strong>
              {l.liberadoEm ? (
                <span className="font-semibold text-[#1F5C36]">Liberado em {dataBR(l.liberadoEm)}</span>
              ) : (
                <button type="submit" disabled={l.repasseCentavos <= 0} className="min-h-11 rounded-[10px] bg-navy px-3 text-[14px] font-bold text-white disabled:opacity-50">
                  Liberar
                </button>
              )}
            </form>
          ))
        )}
      </section>
    </div>
  );
}
