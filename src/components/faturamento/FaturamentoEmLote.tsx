"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gerarFaturamentoAction, type EstadoFaturamento } from "@/app/faturamento/actions";
import { situacaoDaLinha, totalDaSelecao, type LinhaFaturamento } from "@/lib/faturamento-regras";
import { competenciaParaTexto } from "@/lib/lancamentos-regras";
import { formatarReais } from "@/lib/dinheiro";

// Tela Faturamento em lote (US-4.9). A versão muda a cada "Voltar à prévia": a prévia é refeita do zero.
export function FaturamentoEmLote({ competencia, linhas }: { competencia: string; linhas: LinhaFaturamento[] }) {
  const router = useRouter();
  const [versao, setVersao] = useState(0);

  return (
    <Previa
      key={`${competencia}-${versao}`}
      competencia={competencia}
      linhas={linhas}
      aoVoltar={() => {
        setVersao((v) => v + 1);
        router.refresh();
      }}
    />
  );
}

function Previa({ competencia, linhas, aoVoltar }: { competencia: string; linhas: LinhaFaturamento[]; aoVoltar: () => void }) {
  const [estado, acao, enviando] = useActionState<EstadoFaturamento, FormData>(gerarFaturamentoAction, undefined);
  const [marcados, setMarcados] = useState<Set<number>>(
    () => new Set(linhas.filter((l) => situacaoDaLinha(l).marcadaInicialmente).map((l) => l.contratoId)),
  );
  const emitido = Boolean(estado?.resumo);

  const alternar = (id: number) =>
    setMarcados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });

  // Só conta quem está liberado e marcado. Linhas bloqueadas nunca entram no total.
  const selecionadosValidos = linhas.filter((l) => marcados.has(l.contratoId) && !situacaoDaLinha(l).bloqueada);
  const quantidade = selecionadosValidos.length;
  const total = totalDaSelecao(selecionadosValidos, new Set(selecionadosValidos.map((l) => l.contratoId)));

  return (
    <div className="flex flex-col gap-5">
      <section className="overflow-x-auto rounded-2xl border border-[#E8ECF3] bg-white shadow-[0_8px_24px_rgba(0,35,86,.06)]">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[44px_80px_2fr_1.2fr_120px_1.4fr] gap-3 border-b border-[#D8DEE9] px-4 py-2.5 text-[12px] font-semibold text-muted">
            <span />
            <span>Contrato</span>
            <span>Inquilino</span>
            <span>Vencimento</span>
            <span className="text-right">Valor</span>
            <span>Situação</span>
          </div>
          {linhas.length === 0 ? (
            <p className="px-4 py-6 text-muted">Nenhum contrato ativo com aluguel nesta competência.</p>
          ) : null}
          {linhas.map((l) => {
            const s = situacaoDaLinha(l);
            const bloqueadaAgora = s.bloqueada || emitido;
            return (
              <div key={l.contratoId} className="grid min-h-[52px] grid-cols-[44px_80px_2fr_1.2fr_120px_1.4fr] items-center gap-3 border-b border-[#E8ECF3] px-4 py-1">
                <input
                  type="checkbox"
                  name="contratoId"
                  value={l.contratoId}
                  form="form-faturamento"
                  aria-label={`Incluir contrato ${l.contratoId}`}
                  checked={!s.bloqueada && marcados.has(l.contratoId)}
                  disabled={bloqueadaAgora}
                  onChange={() => alternar(l.contratoId)}
                  className="h-5 w-5"
                />
                <span className="font-semibold">#{l.contratoId}</span>
                <span>{l.inquilino}</span>
                <span>{formatarData(l.vencimento)}</span>
                <span className="text-right tabular-nums">{formatarReais(l.aluguelCentavos)}</span>
                <span className="font-medium" style={{ color: s.cor }}>{s.texto}</span>
              </div>
            );
          })}
        </div>
      </section>

      <form id="form-faturamento" action={acao} className="flex flex-col gap-3">
        <input type="hidden" name="competencia" value={competencia} />
        <section aria-live="polite" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8ECF3] bg-white p-4 shadow-[0_8px_24px_rgba(0,35,86,.06)]">
          <div>
            <div className="text-muted">{emitido ? "Total gerado" : `${quantidade} de ${linhas.length} selecionadas`}</div>
            <strong className="text-[26px] font-bold tabular-nums text-navy">{formatarReais(emitido ? (estado?.resumo?.totalCentavos ?? 0) : total)}</strong>
            <div className="text-[13px] text-muted">Competência {competenciaParaTexto(competencia)}</div>
          </div>
          {!emitido ? (
            <button
              type="submit"
              disabled={quantidade === 0 || enviando}
              className="min-h-11 rounded-[10px] bg-navy px-5 text-[14px] font-semibold text-white disabled:opacity-60"
            >
              {enviando ? "Gerando..." : `Gerar ${quantidade} ${quantidade === 1 ? "cobrança" : "cobranças"}`}
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={aoVoltar} className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-4 text-[14px] font-medium text-[#0E1B33]">
                Voltar à prévia
              </button>
              <Link href={`/cobranca?comp=${competencia}`} className="flex min-h-11 items-center rounded-[10px] bg-navy px-4 font-semibold text-white">
                Acompanhar cobrança
              </Link>
            </div>
          )}
        </section>
        {estado?.erro ? <p role="alert" className="font-semibold text-[#8A1F1F]">{estado.erro}</p> : null}
        {estado?.resumo ? (
          <div role="status" className="rounded-xl border border-[#CFE3D5] bg-[#EEF7F1] px-4 py-3 text-[#1F5C36]">
            <div className="font-semibold">Cobranças de {competenciaParaTexto(estado.resumo.competencia)}</div>
            <div>Criadas agora: <strong className="tabular-nums">{estado.resumo.criadas}</strong></div>
            <div>Já existiam (não foram alteradas): <strong className="tabular-nums">{estado.resumo.jaExistentes}</strong></div>
          </div>
        ) : null}
      </form>
    </div>
  );
}

function formatarData(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}
