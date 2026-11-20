import { exigirAcesso } from "@/lib/acesso";
import { competenciaAtual } from "@/lib/contratos-aluguel-regras";
import { competenciaValida } from "@/lib/lancamentos-regras";
import { listarFaturamento } from "@/lib/faturamento";
import { FaturamentoEmLote } from "@/components/faturamento/FaturamentoEmLote";

// Faturamento em lote (US-4.9), layout do design Faturamento.dc.html.
export const dynamic = "force-dynamic";

export default async function PaginaFaturamento({ searchParams }: { searchParams: Promise<{ comp?: string }> }) {
  await exigirAcesso("faturamento");
  const { comp } = await searchParams;
  const competencia = comp && competenciaValida(comp) ? comp : competenciaAtual();
  const linhas = await listarFaturamento(competencia);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-navy">Faturamento</h1>
          <p className="text-muted">Marque os contratos do mês e gere as cobranças de uma vez.</p>
        </div>
        <form className="flex flex-col gap-1 font-semibold">
          <label htmlFor="comp">Competência</label>
          <div className="flex gap-2">
            <input id="comp" type="month" name="comp" defaultValue={competencia} className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3" />
            <button type="submit" className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3 text-[14px] font-medium">Ver mês</button>
          </div>
        </form>
      </header>
      <FaturamentoEmLote competencia={competencia} linhas={linhas} />
    </div>
  );
}
