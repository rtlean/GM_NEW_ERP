import Link from "next/link";
import { exigirAcesso } from "@/lib/acesso";
import { carregarPainel } from "@/lib/dashboard";
import { formatarReais } from "@/lib/dinheiro";

// Dashboard no layout do design. Todos os números vêm dos cadastros atuais (ver dashboard-regras.ts).
export default async function PaginaDashboard() {
  await exigirAcesso("dashboard");
  const painel = await carregarPainel();

  const kpis = [
    { rotulo: "Registros de locação", valor: String(painel.quantidadeContratos), destino: "/contratos" },
    { rotulo: "Locadores", valor: String(painel.quantidadeLocadores), destino: "/locadores" },
    { rotulo: "Registros a revisar", valor: String(painel.registrosARevisar), destino: "/contratos" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-muted">Com base nos cadastros atuais do banco de dados</p>
        <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-navy">Carteira da GM Soluções Imobiliárias</h1>
      </header>

      <div className="flex flex-wrap gap-4">
        <div className="flex min-w-[260px] flex-[2_1_340px] flex-col gap-1.5 rounded-[20px] bg-navy p-6 text-white">
          <span className="font-semibold text-[#E9D29E]">Aluguéis cadastrados por mês</span>
          <strong className="text-[42px] font-extrabold leading-tight tabular-nums tracking-tight">{formatarReais(painel.totalCentavos)}</strong>
          <span className="text-[#D5DEEC]">Soma dos valores cadastrados. Ainda não representa o que foi recebido.</span>
        </div>
        <div className="grid min-w-0 flex-[3_1_440px] grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
          {kpis.map((k) => (
            <Link
              key={k.rotulo}
              href={k.destino}
              className="flex flex-col gap-1 rounded-2xl border border-line bg-white p-[18px] text-[#0E1B33] shadow-[0_1px_2px_rgba(0,35,86,.04),0_8px_24px_rgba(0,35,86,.06)] hover:shadow-[0_2px_4px_rgba(0,35,86,.08),0_14px_32px_rgba(0,35,86,.12)]"
            >
              <span className="text-muted">{k.rotulo}</span>
              <strong className="text-[30px] font-extrabold leading-tight tabular-nums text-navy">{k.valor}</strong>
            </Link>
          ))}
        </div>
      </div>

      <section aria-label="Pontos para revisar" className="flex flex-col gap-3.5 rounded-[20px] border border-[#E9D29E] bg-white p-[22px]">
        <h2 className="text-[20px] font-extrabold leading-tight text-navy">O que revisar antes de operar</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-3">
          {painel.acoes.map((a) => (
            <Link key={a.titulo} href={a.destino} className="flex flex-col gap-1 rounded-[14px] bg-bg p-4 text-[#0E1B33] hover:shadow-[0_14px_32px_rgba(0,35,86,.12)]">
              <strong className="text-[16px] text-navy">{a.titulo}</strong>
              <span>{a.descricao}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(380px,1fr))] gap-4">
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-[22px] shadow-[0_1px_2px_rgba(0,35,86,.04),0_8px_24px_rgba(0,35,86,.06)]">
          <h2 className="text-[18px] font-bold text-navy">Aluguel mensal por tipo de imóvel</h2>
          {painel.tipos.length === 0 ? <p className="text-muted">Ainda não há contratos ativos.</p> : null}
          {painel.tipos.map((b) => (
            <div key={b.nome} title={`${b.nome}: ${formatarReais(b.centavos)}`} className="flex flex-col gap-1">
              <span>{b.nome}</span>
              <div className="h-2.5 rounded-full bg-[#F0F3FA]">
                <div className="h-2.5 rounded-full bg-navy" style={{ width: `${b.percentual}%` }} />
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-[22px] shadow-[0_1px_2px_rgba(0,35,86,.04),0_8px_24px_rgba(0,35,86,.06)]">
          <h2 className="text-[18px] font-bold text-navy">Maiores locadores por aluguel mensal</h2>
          {painel.locadoresTop.length === 0 ? <p className="text-muted">Ainda não há contratos ativos.</p> : null}
          {painel.locadoresTop.map((b) => (
            <div key={b.nome} className="flex flex-col gap-1">
              <div className="flex justify-between gap-3">
                <span>
                  {b.nome} · {b.quantidade} {b.quantidade === 1 ? "contrato" : "contratos"}
                </span>
                <strong className="tabular-nums">{formatarReais(b.centavos)}</strong>
              </div>
              <div className="h-2.5 rounded-full bg-[#F0F3FA]">
                <div className="h-2.5 rounded-full bg-[#D4A853]" style={{ width: `${b.percentual}%` }} />
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
