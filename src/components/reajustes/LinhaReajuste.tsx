"use client";

import { useState } from "react";
import { aplicarReajusteAction } from "@/app/reajustes/actions";
import { INDICES_DE_REAJUSTE } from "@/lib/contratos-regras";
import { novoAluguelCentavos, percentualParaBps } from "@/lib/reajustes-regras";
import { formatarReais } from "@/lib/dinheiro";

export type DadosLinhaReajuste = {
  contratoId: number;
  inquilino: string;
  imovel: string;
  dataEfetiva: string;
  indicePadrao: string | null;
  aluguelCentavos: number;
};

// Uma linha da lista de reajustes: digita o percentual, vê o novo valor e agenda (US-4.6).
export function LinhaReajuste({ linha }: { linha: DadosLinhaReajuste }) {
  const [percentual, setPercentual] = useState("");
  const [indice, setIndice] = useState(linha.indicePadrao ?? "IPCA");
  const pct = percentual.trim() ? percentualParaBps(percentual) : null;
  const novo = pct && pct.ok ? novoAluguelCentavos(linha.aluguelCentavos, pct.bps) : null;

  return (
    <form action={aplicarReajusteAction} className="grid min-h-[60px] items-center gap-3 border-b border-[#E8ECF3] px-4 py-2 md:grid-cols-[80px_1.6fr_1.2fr_120px_120px_150px]">
      <input type="hidden" name="contratoId" value={linha.contratoId} />
      <strong>#{linha.contratoId}</strong>
      <div>
        <div>{linha.inquilino}</div>
        <div className="text-muted">
          {linha.imovel} · aplicar em {linha.dataEfetiva.split("-").reverse().join("/")}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <select name="indice" value={indice} onChange={(e) => setIndice(e.target.value)} className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-2">
          {INDICES_DE_REAJUSTE.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        <input
          name="percentual"
          inputMode="decimal"
          placeholder="%"
          value={percentual}
          onChange={(e) => setPercentual(e.target.value)}
          required
          aria-label="Percentual do reajuste"
          className="min-h-11 w-24 rounded-[10px] border border-[#A9B4C6] bg-white px-2 tabular-nums"
        />
      </div>
      <span className="tabular-nums text-muted">De {formatarReais(linha.aluguelCentavos)}</span>
      <strong className="tabular-nums">{novo !== null ? `Para ${formatarReais(novo)}` : "Para —"}</strong>
      <button type="submit" disabled={novo === null} className="min-h-11 rounded-[10px] bg-navy px-3 text-[14px] font-bold text-white disabled:opacity-50">
        Agendar
      </button>
    </form>
  );
}
