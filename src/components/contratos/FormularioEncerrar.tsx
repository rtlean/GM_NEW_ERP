"use client";

import { useActionState, useState } from "react";
import { encerrarContratoAction, type EstadoEncerrar } from "@/app/contratos/[id]/actions";
import { normalizarNome } from "@/lib/contratos-encerrar-regras";
import { competenciaParaTexto } from "@/lib/contratos-aluguel-regras";

// Encerramento (US-3.8): data de fim e confirmação digitando o nome do locatário.
export function FormularioEncerrar({
  contratoId,
  locatarioNome,
  enderecoImovel,
  hoje,
}: {
  contratoId: number;
  locatarioNome: string;
  enderecoImovel: string | null;
  hoje: string;
}) {
  const [estado, acao, enviando] = useActionState<EstadoEncerrar, FormData>(encerrarContratoAction, undefined);
  const [dataFim, setDataFim] = useState("");
  const [nome, setNome] = useState("");

  const confere = nome.length > 0 && normalizarNome(nome) === normalizarNome(locatarioNome);
  const valida = dataFim >= hoje && /^\d{4}-\d{2}-\d{2}$/.test(dataFim);

  return (
    <form action={acao} className="flex flex-col gap-3">
      <input type="hidden" name="contratoId" value={contratoId} />
      <div className="rounded-[10px] bg-[#EEF2F8] p-3 text-[14px] text-navy">
        <p>
          <strong>Locatário:</strong> {locatarioNome || "Não encontrado"}
        </p>
        <p>
          <strong>Imóvel:</strong> {enderecoImovel ?? "Endereço não cadastrado"}
        </p>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-muted">Data de fim</span>
        <input
          type="date"
          name="dataFim"
          min={hoje}
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          required
          className="min-h-11 rounded-[10px] border border-[#D8DEE9] bg-white px-3.5"
        />
      </label>
      {valida ? (
        <p className="text-[14px] text-navy">
          Último mês cobrado: <strong>{competenciaParaTexto(dataFim.slice(0, 7))}</strong>. Depois disso, nenhuma cobrança será gerada.
        </p>
      ) : null}
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-muted">Para confirmar, digite o nome do locatário</span>
        <input
          type="text"
          name="nomeDigitado"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          autoComplete="off"
          className="min-h-11 rounded-[10px] border border-[#D8DEE9] bg-white px-3.5"
        />
      </label>
      {estado?.erro ? (
        <p role="alert" className="rounded-[10px] bg-warn p-3 text-[14px] font-semibold text-[#8A1F1F]">
          {estado.erro}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={enviando || !confere || !valida}
        className="min-h-11 self-start rounded-[10px] bg-[#8A1F1F] px-5 font-bold text-white disabled:opacity-50"
      >
        {enviando ? "Encerrando…" : "Encerrar contrato"}
      </button>
    </form>
  );
}
