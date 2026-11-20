import { exigirAcesso } from "@/lib/acesso";
import { listarReajustesProximos } from "@/lib/reajustes";
import { hojeSaoPaulo } from "@/lib/contratos-encerrar-regras";
import { JANELA_DIAS } from "@/lib/reajustes-regras";
import { LinhaReajuste } from "@/components/reajustes/LinhaReajuste";

// Tela Reajustes (US-4.6), no layout do design. Renovações com aditivo ficam para a próxima história.
export const dynamic = "force-dynamic";

export default async function PaginaReajustes({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await exigirAcesso("reajustes");
  const { ok, erro } = await searchParams;
  const linhas = await listarReajustesProximos(hojeSaoPaulo());

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-navy">Reajustes</h1>
        <p className="text-muted">Aniversários de contrato nos próximos {JANELA_DIAS} dias. O novo valor vale a partir do aniversário, para o mês inteiro.</p>
      </header>

      {ok ? <p role="status" className="rounded-xl border border-[#CFE3D5] bg-[#EEF7F1] px-4 py-2.5 font-semibold text-[#1F5C36]">{ok}</p> : null}
      {erro ? <p role="alert" className="rounded-xl border border-[#E8C4C4] bg-[#FBEFEF] px-4 py-2.5 font-semibold text-[#8A1F1F]">{erro}</p> : null}

      <section className="overflow-x-auto rounded-2xl border border-[#E8ECF3] bg-white shadow-[0_8px_24px_rgba(0,35,86,.06)]">
        <h2 className="border-b border-[#D8DEE9] px-4 py-3.5 text-[18px] font-bold text-navy">Próximos reajustes</h2>
        {linhas.length === 0 ? (
          <p className="px-4 py-6 text-muted">Nenhum contrato ativo com aniversário nos próximos {JANELA_DIAS} dias.</p>
        ) : (
          linhas.map((l) => <LinhaReajuste key={l.contratoId} linha={l} />)
        )}
      </section>
    </div>
  );
}
