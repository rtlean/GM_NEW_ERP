"use client";

import { useActionState } from "react";
import { gerarCobrancasAction, type EstadoGerar } from "@/app/cobranca/actions";
import { competenciaParaTexto } from "@/lib/lancamentos-regras";
import { formatarReais } from "@/lib/dinheiro";

// Botão Gerar cobranças do mês e resumo (quantidade e total), como pede a história US-4.1.
export function FormularioGerar({ competencia }: { competencia: string }) {
  const [estado, acao, enviando] = useActionState<EstadoGerar, FormData>(gerarCobrancasAction, undefined);

  return (
    <div className="flex flex-col gap-3">
      <form action={acao} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="competencia" value={competencia} />
        <button type="submit" disabled={enviando} className="min-h-11 rounded-[10px] bg-navy px-5 text-[14px] font-bold text-white disabled:opacity-60">
          {enviando ? "Gerando..." : `Gerar cobranças de ${competenciaParaTexto(competencia)}`}
        </button>
      </form>
      {estado?.erro ? <p role="alert" className="font-semibold text-[#8A1F1F]">{estado.erro}</p> : null}
      {estado?.resumo ? (
        <div role="status" className="rounded-xl border border-[#CFE3D5] bg-[#EEF7F1] px-4 py-3 text-[#1F5C36]">
          <div className="font-semibold">Cobranças de {competenciaParaTexto(estado.resumo.competencia)}</div>
          <div>Criadas agora: <strong className="tabular-nums">{estado.resumo.criadas}</strong> · Total: <strong className="tabular-nums">{formatarReais(estado.resumo.totalCentavos)}</strong></div>
          <div>Já existiam (não foram alteradas): <strong className="tabular-nums">{estado.resumo.jaExistentes}</strong></div>
        </div>
      ) : null}
    </div>
  );
}
