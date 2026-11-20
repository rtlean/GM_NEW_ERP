"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { gravarLancamentoAction, type EstadoLancamento } from "@/app/lancamentos/actions";
import { COBRAR_DE } from "@/lib/lancamentos-regras";
import { reaisParaCentavos } from "@/lib/cadastro-imovel";

export type OpcaoImovel = { id: number; rotulo: string };
export type OpcaoCategoria = { id: number; nome: string };
export type DadosEdicao = {
  id: number;
  categoriaId: number;
  imovelId: number | null;
  valor: string;
  data: string;
  cobrarDe: "owner" | "tenant";
  descricao: string;
  observacao: string;
};

type Props = {
  ownerId: number;
  competencia: string;
  nomeLocador: string;
  imoveis: OpcaoImovel[];
  categorias: OpcaoCategoria[];
  hojeIso: string;
  edicao: DadosEdicao | null;
  linkCancelar: string;
};

const campo = "min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3 text-[14px]";

// Formulário de nova despesa ou edição (layout do design Lançamentos).
export function FormularioLancamento({ ownerId, competencia, nomeLocador, imoveis, categorias, hojeIso, edicao, linkCancelar }: Props) {
  const [estado, acao, enviando] = useActionState<EstadoLancamento, FormData>(gravarLancamentoAction, undefined);
  const [imovelId, setImovelId] = useState<number | null>(edicao?.imovelId ?? null);
  const [valor, setValor] = useState(edicao?.valor ?? "");
  const convertido = reaisParaCentavos(valor);
  const erros = estado?.erros ?? {};

  return (
    <form action={acao} className="flex flex-col gap-3.5 rounded-2xl border border-[#E8ECF3] bg-white p-5 shadow-[0_8px_24px_rgba(0,35,86,.06)]">
      <input type="hidden" name="ownerId" value={ownerId} />
      <input type="hidden" name="competencia" value={competencia} />
      <input type="hidden" name="imovelId" value={imovelId ?? ""} />
      {edicao ? <input type="hidden" name="lancamentoId" value={edicao.id} /> : null}

      <div>
        <h2 className="text-[20px] font-extrabold leading-tight text-navy">{edicao ? "Editar despesa" : "Nova despesa"}</h2>
        <div className="text-muted">{nomeLocador}</div>
      </div>

      <div role="group" aria-label="Imóvel" className="flex flex-col gap-1.5">
        <span className="text-[14px] font-semibold">Imóvel (opcional)</span>
        <div className="flex max-h-[148px] flex-wrap gap-1.5 overflow-y-auto p-0.5">
          {[{ id: null as number | null, rotulo: "Geral do locador" }, ...imoveis.map((i) => ({ id: i.id as number | null, rotulo: i.rotulo }))].map((op) => {
            const on = imovelId === op.id;
            return (
              <button
                key={op.id ?? "geral"}
                type="button"
                aria-pressed={on}
                onClick={() => setImovelId(op.id)}
                className={`min-h-11 rounded-[10px] border px-3 text-left text-[13px] font-medium ${on ? "border-navy bg-navy text-white" : "border-[#D8DEE9] bg-white text-navy"}`}
              >
                {op.rotulo}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-1 font-semibold">
          Categoria
          <select name="categoriaId" defaultValue={edicao?.categoriaId ?? ""} required className={campo}>
            <option value="" disabled>Escolha</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          {erros.categoriaId ? <span className="text-[13px] text-[#8A1F1F]">{erros.categoriaId}</span> : null}
        </label>
        <label className="flex flex-col gap-1 font-semibold">
          Valor (R$)
          <input name="valor" inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} required className={`${campo} tabular-nums`} />
          {erros.valor ? <span className="text-[13px] text-[#8A1F1F]">{erros.valor}</span> : null}
        </label>
        <label className="flex flex-col gap-1 font-semibold">
          Data da despesa
          <input type="date" name="data" defaultValue={edicao?.data ?? hojeIso} required className={campo} />
          {erros.data ? <span className="text-[13px] text-[#8A1F1F]">{erros.data}</span> : null}
        </label>
        <label className="flex flex-col gap-1 font-semibold">
          Cobrar de
          <select name="cobrarDe" defaultValue={edicao?.cobrarDe === "tenant" ? "locatario" : "locador"} className={campo}>
            {COBRAR_DE.map((c) => (
              <option key={c.valor} value={c.valor}>{c.rotulo}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 font-semibold">
          Descrição
          <input name="descricao" defaultValue={edicao?.descricao ?? ""} required maxLength={200} className={campo} />
          {erros.descricao ? <span className="text-[13px] text-[#8A1F1F]">{erros.descricao}</span> : null}
        </label>
        <label className="flex flex-col gap-1 font-semibold">
          Observação (opcional)
          <input name="observacao" defaultValue={edicao?.observacao ?? ""} maxLength={300} className={campo} />
        </label>
      </div>

      {estado?.erro ? <p role="alert" className="font-semibold text-[#8A1F1F]">{estado.erro}</p> : null}
      {convertido.ok ? null : valor ? <p className="text-[13px] text-[#8A1F1F]">{convertido.erro}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={enviando} className="min-h-11 rounded-[10px] bg-navy px-5 text-[14px] font-bold text-white disabled:opacity-60">
          {enviando ? "Salvando..." : edicao ? "Salvar alterações" : "Lançar despesa"}
        </button>
        {edicao ? (
          <Link href={linkCancelar} className="flex min-h-11 items-center rounded-[10px] border border-[#A9B4C6] bg-white px-4 text-[14px] font-medium text-[#0E1B33]">
            Cancelar edição
          </Link>
        ) : null}
      </div>
    </form>
  );
}
