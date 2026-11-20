import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAcesso } from "@/lib/acesso";
import { formatarReais } from "@/lib/dinheiro";
import { listarContratos } from "@/lib/contratos";
import { documentoAtual } from "@/lib/contratos-documentos";
import { listarHistoricoAluguel } from "@/lib/contratos-aluguel";
import { competenciaAtual, competenciaParaTexto } from "@/lib/contratos-aluguel-regras";
import { FormularioAnexo } from "@/components/contratos/FormularioAnexo";
import { FormularioAluguel } from "@/components/contratos/FormularioAluguel";

// Detalhe do contrato com o bloco "Contrato assinado" (US-3.6).
const SITUACAO: Record<string, string> = { active: "Ativo", ended: "Encerrado", draft: "Rascunho" };

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export default async function PaginaContrato({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ anexado?: string; aluguel?: string }>;
}) {
  await exigirAcesso("contratos");
  const { id } = await params;
  const { anexado, aluguel } = await searchParams;
  const contratoId = Number(id);
  if (!Number.isInteger(contratoId) || contratoId <= 0) notFound();

  const contrato = (await listarContratos({})).find((c) => c.id === contratoId);
  if (!contrato) notFound();
  const arquivo = await documentoAtual(contratoId);
  const historico = await listarHistoricoAluguel(contratoId);
  const mesAtual = competenciaAtual();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/contratos" className="text-[14px] font-semibold text-muted">
            ← Contratos
          </Link>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-navy">Contrato {contrato.id}</h1>
          <p className="text-muted">
            {contrato.locatario} · {[contrato.imovelCodigo, contrato.imovelTipo].filter(Boolean).join(" · ") || "Sem imóvel"} · {contrato.locador}
          </p>
        </div>
      </header>

      {aluguel ? (
        <p role="status" className="rounded-[12px] bg-[#DDF0E7] p-3.5 font-semibold text-[#17533B]">
          Aluguel alterado a partir de {competenciaParaTexto(aluguel)}.
        </p>
      ) : null}

      {anexado ? (
        <p role="status" className="rounded-[12px] bg-[#DDF0E7] p-3.5 font-semibold text-[#17533B]">
          Arquivo salvo como versão {anexado}.
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(0,35,86,.04),0_8px_24px_rgba(0,35,86,.06)]">
          <h2 className="mb-3 text-[18px] font-bold text-navy">Condições</h2>
          <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-[15px]">
            <dt className="text-muted">Aluguel do mês</dt>
            <dd className="tabular-nums">{formatarReais(contrato.aluguelCentavos)}</dd>
            <dt className="text-muted">Situação</dt>
            <dd>{SITUACAO[contrato.situacao] ?? contrato.situacao}</dd>
            <dt className="text-muted">Início</dt>
            <dd>{dataCurta(contrato.inicio)}</dd>
            <dt className="text-muted">Fim</dt>
            <dd>{contrato.fim ? dataCurta(contrato.fim) : "Sem data"}</dd>
            <dt className="text-muted">Taxa</dt>
            <dd>{contrato.taxaPercentual != null ? `${contrato.taxaPercentual}%` : "Não definida"}</dd>
          </dl>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(0,35,86,.04),0_8px_24px_rgba(0,35,86,.06)]">
          <h2 className="text-[18px] font-bold text-navy">Contrato assinado</h2>
          {arquivo ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-[#F6F8FC] p-3.5">
              <div className="min-w-0">
                <p className="truncate font-semibold text-navy">{arquivo.nomeArquivo}</p>
                <p className="text-[13px] text-muted">
                  Versão {arquivo.versao} · enviado em {dataCurta(arquivo.criadoEm)}
                </p>
              </div>
              <a
                href={`/api/contratos/${contrato.id}/arquivo`}
                className="flex min-h-11 items-center rounded-[10px] border border-[#A9B4C6] px-4 font-semibold text-navy"
              >
                Baixar contrato
              </a>
            </div>
          ) : (
            <p className="text-muted">Nenhum arquivo anexado ainda.</p>
          )}
          <FormularioAnexo contratoId={contrato.id} temArquivo={arquivo !== null} />
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(0,35,86,.04),0_8px_24px_rgba(0,35,86,.06)]">
          <h2 className="text-[18px] font-bold text-navy">Alterar aluguel</h2>
          <FormularioAluguel contratoId={contrato.id} mesAtual={mesAtual} />
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(0,35,86,.04),0_8px_24px_rgba(0,35,86,.06)]">
          <h2 className="text-[18px] font-bold text-navy">Histórico de aluguel</h2>
          {historico.length === 0 ? (
            <p className="text-muted">Nenhuma alteração. O aluguel é o do contrato desde o início.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {historico.map((h) => (
                <li key={h.id} className="flex flex-col gap-0.5 py-2.5">
                  <span className="font-semibold text-navy">
                    A partir de {competenciaParaTexto(h.efetivaEm.slice(0, 7))}: {formatarReais(h.novoCentavos)}
                  </span>
                  <span className="text-[13px] text-muted">
                    {h.anteriorCentavos != null ? `Antes: ${formatarReais(h.anteriorCentavos)} · ` : ""}
                    por {h.feitoPor} em {dataCurta(h.feitoEm)}
                    {h.observacao ? ` · ${h.observacao}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
