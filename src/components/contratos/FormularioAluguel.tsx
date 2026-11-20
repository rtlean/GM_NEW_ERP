"use client";

import { useActionState, useState } from "react";
import { alterarAluguelAction, type EstadoAluguel } from "@/app/contratos/[id]/actions";
import { competenciaParaTexto } from "@/lib/contratos-aluguel-regras";
import { reaisParaCentavos } from "@/lib/cadastro-imovel";
import { formatarReais } from "@/lib/dinheiro";

// Alterar aluguel a partir de um mês (US-3.7). Mostra a frase do que vai acontecer antes de salvar.
export function FormularioAluguel({ contratoId, mesAtual }: { contratoId: number; mesAtual: string }) {
  const [estado, acao, enviando] = useActionState<EstadoAluguel, FormData>(alterarAluguelAction, undefined);
  const [mes, setMes] = useState(mesAtual);
  const [valor, setValor] = useState("");

  const convertido = reaisParaCentavos(valor);
  const previa =
    mes && convertido.ok && convertido.valor > 0 && mes >= mesAtual
      ? `A partir de ${competenciaParaTexto(mes)}, aluguel de ${formatarReais(convertido.valor)} no mês inteiro.`
      : null;

  return (
    <form action={acao} className="flex flex-col gap-3">
      <input type="hidden" name="contratoId" value={contratoId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-muted">Mês de início</span>
          <input
            type="month"
            name="competencia"
            min={mesAtual}
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            required
            className="min-h-11 rounded-[10px] border border-[#D8DEE9] bg-white px-3.5"
          />
          {estado?.erros?.competencia ? <span className="text-[13px] font-semibold text-[#8A1F1F]">{estado.erros.competencia}</span> : null}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-muted">Novo aluguel (R$)</span>
          <input
            type="text"
            name="valor"
            inputMode="decimal"
            placeholder="1.200,00"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            required
            className="min-h-11 rounded-[10px] border border-[#D8DEE9] bg-white px-3.5 tabular-nums"
          />
          {estado?.erros?.valor ? <span className="text-[13px] font-semibold text-[#8A1F1F]">{estado.erros.valor}</span> : null}
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-muted">Observação (opcional)</span>
        <input
          type="text"
          name="observacao"
          maxLength={300}
          placeholder="Ex.: reajuste anual IGP-M"
          className="min-h-11 rounded-[10px] border border-[#D8DEE9] bg-white px-3.5"
        />
      </label>
      {previa ? <p className="rounded-[10px] bg-[#EEF2F8] p-3 text-[14px] text-navy">{previa}</p> : null}
      <p className="text-[12px] text-muted">Cobranças pagas não mudam. Meses anteriores ao atual não podem ser alterados.</p>
      {estado?.erro ? (
        <p role="alert" className="rounded-[10px] bg-warn p-3 text-[14px] font-semibold text-[#8A1F1F]">
          {estado.erro}
        </p>
      ) : null}
      <button type="submit" disabled={enviando} className="min-h-11 self-start rounded-[10px] bg-navy px-5 font-bold text-white disabled:opacity-60">
        {enviando ? "Salvando…" : "Salvar alteração"}
      </button>
    </form>
  );
}
