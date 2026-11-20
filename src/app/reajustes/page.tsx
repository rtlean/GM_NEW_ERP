import { exigirAcesso } from "@/lib/acesso";
import { listarReajustesAgendados, listarReajustesProximos } from "@/lib/reajustes";
import { formatarReais } from "@/lib/dinheiro";
import { dataBR } from "@/lib/aditivo-reajuste-regras";
import { gerarAditivoAction } from "./actions";
import { hojeSaoPaulo } from "@/lib/contratos-encerrar-regras";
import { JANELA_DIAS } from "@/lib/reajustes-regras";
import { LinhaReajuste } from "@/components/reajustes/LinhaReajuste";

// Tela Reajustes (US-4.6), no layout do design. Renovações com aditivo ficam para a próxima história.
export const dynamic = "force-dynamic";

export default async function PaginaReajustes({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string; arquivo?: string }> }) {
  await exigirAcesso("reajustes");
  const { ok, erro, arquivo } = await searchParams;
  const hoje = hojeSaoPaulo();
  const linhas = await listarReajustesProximos(hoje);
  const agendados = await listarReajustesAgendados(hoje);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-navy">Reajustes</h1>
        <p className="text-muted">Aniversários de contrato nos próximos {JANELA_DIAS} dias. O novo valor vale a partir do aniversário, para o mês inteiro.</p>
      </header>

      {ok ? <p role="status" className="rounded-xl border border-[#CFE3D5] bg-[#EEF7F1] px-4 py-2.5 font-semibold text-[#1F5C36]">{ok}</p> : null}
      {erro ? <p role="alert" className="rounded-xl border border-[#E8C4C4] bg-[#FBEFEF] px-4 py-2.5 font-semibold text-[#8A1F1F]">{erro}</p> : null}
      {ok && arquivo ? <a href={`/api/contratos/${arquivo}/arquivo`} className="font-semibold text-navy underline">Baixar o aditivo gerado (PDF)</a> : null}

      <section className="overflow-x-auto rounded-2xl border border-[#E8ECF3] bg-white shadow-[0_8px_24px_rgba(0,35,86,.06)]">
        <h2 className="border-b border-[#D8DEE9] px-4 py-3.5 text-[18px] font-bold text-navy">Próximos reajustes</h2>
        {linhas.length === 0 ? (
          <p className="px-4 py-6 text-muted">Nenhum contrato ativo com aniversário nos próximos {JANELA_DIAS} dias.</p>
        ) : (
          linhas.map((l) => <LinhaReajuste key={l.contratoId} linha={l} />)
        )}
      </section>

      <section className="overflow-x-auto rounded-2xl border border-[#E8ECF3] bg-white shadow-[0_8px_24px_rgba(0,35,86,.06)]">
        <h2 className="border-b border-[#D8DEE9] px-4 py-3.5 text-[18px] font-bold text-navy">Reajustes agendados · aditivo</h2>
        {agendados.length === 0 ? (
          <p className="px-4 py-6 text-muted">Nenhum reajuste agendado nos próximos {JANELA_DIAS} dias.</p>
        ) : (
          agendados.map((a) => (
            <form key={`${a.contratoId}-${a.dataEfetiva}`} action={gerarAditivoAction} className="grid min-h-[60px] items-center gap-3 border-b border-[#E8ECF3] px-4 py-2 md:grid-cols-[80px_1.6fr_1.2fr_1fr_150px]">
              <input type="hidden" name="contratoId" value={a.contratoId} />
              <input type="hidden" name="dataEfetiva" value={a.dataEfetiva} />
              <strong>#{a.contratoId}</strong>
              <div>
                <div>{a.inquilino}</div>
                <div className="text-muted">{a.imovel} · vigência {dataBR(a.dataEfetiva)}</div>
              </div>
              <span className="tabular-nums text-muted">De {formatarReais(a.anteriorCentavos)}</span>
              <strong className="tabular-nums">Para {formatarReais(a.novoCentavos)}</strong>
              <button type="submit" className="min-h-11 rounded-[10px] border border-navy bg-white px-3 text-[14px] font-bold text-navy">Gerar aditivo</button>
            </form>
          ))
        )}
      </section>
    </div>
  );
}
