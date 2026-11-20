import Link from "next/link";
import { exigirAcesso } from "@/lib/acesso";
import { formatarReais } from "@/lib/dinheiro";
import { listarContratos, listarImoveisParaContrato, type FiltroSituacao } from "@/lib/contratos";
import { listarLocadoresParaPainel } from "@/lib/locadores";
import { listarLocatariosParaPainel } from "@/lib/locatarios";
import { AssistenteNovoContrato } from "@/components/contratos/AssistenteNovoContrato";

// Tela de Contratos no layout do design: lista (leitura) e assistente de novo contrato (US-3.5b).
const FILTROS: { valor: FiltroSituacao; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "ativos", rotulo: "Ativos" },
  { valor: "encerrados", rotulo: "Encerrados" },
];

const SITUACAO: Record<string, string> = { active: "Ativo", ended: "Encerrado", draft: "Rascunho" };

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export default async function PaginaContratos({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; situacao?: string; novo?: string; criado?: string }>;
}) {
  await exigirAcesso("contratos");
  const { busca = "", situacao = "todos", novo, criado } = await searchParams;
  const filtro: FiltroSituacao = FILTROS.some((f) => f.valor === situacao) ? (situacao as FiltroSituacao) : "todos";
  const mostrarAssistente = novo === "1";

  const [linhas, todos, locadores, imoveis, locatarios] = await Promise.all([
    listarContratos({ busca, situacao: filtro }),
    listarContratos({}),
    mostrarAssistente ? listarLocadoresParaPainel() : Promise.resolve([]),
    mostrarAssistente ? listarImoveisParaContrato() : Promise.resolve([]),
    mostrarAssistente ? listarLocatariosParaPainel() : Promise.resolve([]),
  ]);

  const ativos = todos.filter((c) => c.situacao === "active");
  const totalAtivos = ativos.reduce((soma, c) => soma + c.aluguelCentavos, 0);
  const linkFiltro = (valor: FiltroSituacao) => `/contratos?situacao=${valor}${busca ? `&busca=${encodeURIComponent(busca)}` : ""}`;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-navy">Contratos</h1>
          <p className="text-muted">
            {todos.length} registros · {ativos.length} ativos · {formatarReais(totalAtivos)} em aluguéis por mês (contratos ativos)
          </p>
        </div>
        {mostrarAssistente ? (
          <Link href="/contratos" className="flex min-h-11 items-center rounded-[10px] border border-[#A9B4C6] px-4 font-semibold text-navy">
            Fechar
          </Link>
        ) : (
          <Link href="/contratos?novo=1" className="flex min-h-11 items-center rounded-[10px] bg-navy px-5 font-bold text-white">
            Novo contrato
          </Link>
        )}
      </header>

      {criado ? (
        <p role="status" className="rounded-[12px] bg-[#DDF0E7] p-3.5 font-semibold text-[#17533B]">
          Contrato {criado} criado. O aluguel já aparece na lista de ativos.
        </p>
      ) : null}

      {mostrarAssistente ? <AssistenteNovoContrato locadores={locadores} imoveis={imoveis} locatarios={locatarios} /> : null}

      <div className="flex flex-wrap items-center gap-2">
        <form className="flex flex-1 flex-wrap items-center gap-2" action="/contratos">
          <input type="hidden" name="situacao" value={filtro} />
          <input
            type="search"
            name="busca"
            defaultValue={busca}
            aria-label="Buscar"
            placeholder="Buscar locatário, locador ou imóvel"
            className="min-h-11 max-w-[460px] flex-1 rounded-[10px] border border-[#D8DEE9] bg-white px-3.5"
          />
          <button type="submit" className="min-h-11 rounded-[10px] bg-navy px-4 font-semibold text-white">
            Buscar
          </button>
        </form>
        {FILTROS.map((f) => (
          <Link
            key={f.valor}
            href={linkFiltro(f.valor)}
            aria-current={filtro === f.valor ? "true" : undefined}
            className={`flex min-h-11 items-center rounded-full border px-4 font-semibold ${filtro === f.valor ? "border-navy bg-navy text-white" : "border-[#D8DEE9] bg-white text-navy"}`}
          >
            {f.rotulo}
          </Link>
        ))}
      </div>

      <section className="overflow-auto rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(0,35,86,.04),0_8px_24px_rgba(0,35,86,.06)]">
        <div className="min-w-[960px]">
          <div className="grid grid-cols-[70px_1.8fr_1.3fr_1.6fr_110px_160px] gap-3 border-b border-[#D8DEE9] px-4 py-2.5 text-[12px] font-semibold text-muted">
            <span>Registro</span>
            <span>Locatário</span>
            <span>Imóvel</span>
            <span>Locador</span>
            <span className="text-right">Aluguel</span>
            <span>Situação</span>
          </div>
          {linhas.map((c) => (
            <div key={c.id} className="grid grid-cols-[70px_1.8fr_1.3fr_1.6fr_110px_160px] items-center gap-3 border-b border-line px-4 py-2.5">
              <Link href={`/contratos/${c.id}`} className="font-bold text-navy underline-offset-2 hover:underline">{c.id}</Link>
              <span>{c.locatario}</span>
              <span>{[c.imovelCodigo, c.imovelTipo].filter(Boolean).join(" · ") || "Sem imóvel"}</span>
              <span>{c.locador}</span>
              <span className="text-right tabular-nums">{formatarReais(c.aluguelCentavos)}</span>
              <span className="text-[13px]">
                {SITUACAO[c.situacao] ?? c.situacao}
                <span className="block text-[12px] text-muted">
                  desde {dataCurta(c.inicio)}
                  {c.fim ? ` · até ${dataCurta(c.fim)}` : ""}
                </span>
              </span>
            </div>
          ))}
          {linhas.length === 0 ? <p className="px-4 py-6 text-muted">Nenhum registro encontrado.</p> : null}
        </div>
      </section>
    </div>
  );
}
