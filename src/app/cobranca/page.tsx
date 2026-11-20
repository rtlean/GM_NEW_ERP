import { exigirAcesso } from "@/lib/acesso";
import { competenciaAtual } from "@/lib/contratos-aluguel-regras";
import { competenciaParaTexto, competenciaValida } from "@/lib/lancamentos-regras";
import { FormularioGerar } from "@/components/cobranca/FormularioGerar";

// Tela Cobranças (US-4.1): gerar o aluguel do mês. A tela de atrasos (US-4.3) vem depois.
export const dynamic = "force-dynamic";

export default async function PaginaCobranca({ searchParams }: { searchParams: Promise<{ comp?: string }> }) {
  await exigirAcesso("cobranca");
  const { comp } = await searchParams;
  const competencia = comp && competenciaValida(comp) ? comp : competenciaAtual();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-navy">Cobranças</h1>
          <p className="text-muted">Gere o aluguel de cada contrato ativo para a competência.</p>
        </div>
        <form className="flex flex-col gap-1 font-semibold">
          <label htmlFor="comp">Competência</label>
          <div className="flex gap-2">
            <input id="comp" type="month" name="comp" defaultValue={competencia} className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3" />
            <button type="submit" className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3 text-[14px] font-medium">Ver mês</button>
          </div>
        </form>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl border border-[#E8ECF3] bg-white p-5 shadow-[0_8px_24px_rgba(0,35,86,.06)]">
        <h2 className="text-[18px] font-bold text-navy">Gerar cobranças de {competenciaParaTexto(competencia)}</h2>
        <p className="text-muted">
          Cria uma cobrança por contrato ativo que ainda não tem cobrança neste mês. Vencimento dia 10. Cobranças que já existem não são alteradas nem
          duplicadas.
        </p>
        <FormularioGerar key={competencia} competencia={competencia} />
      </section>
    </div>
  );
}
