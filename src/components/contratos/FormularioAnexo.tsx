"use client";

import { useActionState } from "react";
import { anexarDocumentoAction, type EstadoAnexo } from "@/app/contratos/[id]/actions";

// Formulário de envio do PDF ou Word do contrato (US-3.6). Aceita .pdf e .docx até 10 MB.
export function FormularioAnexo({ contratoId, temArquivo }: { contratoId: number; temArquivo: boolean }) {
  const [estado, acao, enviando] = useActionState<EstadoAnexo, FormData>(anexarDocumentoAction, undefined);

  return (
    <form action={acao} className="flex flex-col gap-3" encType="multipart/form-data">
      <input type="hidden" name="contratoId" value={contratoId} />
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-muted">{temArquivo ? "Novo arquivo (substitui o atual)" : "Arquivo do contrato"}</span>
        <input
          type="file"
          name="arquivo"
          required
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="min-h-11 rounded-[10px] border border-[#D8DEE9] bg-white px-3.5 py-2 file:mr-3 file:rounded-[8px] file:border-0 file:bg-[#EEF2F8] file:px-3 file:py-1.5 file:font-semibold file:text-navy"
        />
        <span className="text-[12px] text-muted">PDF ou Word (.docx), até 10 MB. A versão anterior continua guardada.</span>
      </label>
      {estado?.erro ? (
        <p role="alert" className="rounded-[10px] bg-warn p-3 text-[14px] font-semibold text-[#8A1F1F]">
          {estado.erro}
        </p>
      ) : null}
      <button type="submit" disabled={enviando} className="min-h-11 self-start rounded-[10px] bg-navy px-5 font-bold text-white disabled:opacity-60">
        {enviando ? "Enviando…" : temArquivo ? "Substituir arquivo" : "Anexar arquivo"}
      </button>
    </form>
  );
}
