"use client";

import Link from "next/link";
import { useActionState } from "react";
import { salvarLocatarioAction, type EstadoLocatario } from "@/app/locatarios/actions";
import type { EntradaLocatario } from "@/lib/cadastro-locatario";

// Painel de cadastro do locatário no layout do design. Não pede locador: o vínculo nasce no contrato.

type Props = { inicial: EntradaLocatario; id?: number; titulo: string; cancelarPara: string };

const entrada = "min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3 text-[#0E1B33]";

function Campo({ rotulo, erro, children }: { rotulo: string; erro?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 font-semibold">
      <span className="text-[#0E1B33]">{rotulo}</span>
      {children}
      {erro ? (
        <span role="alert" className="text-sm font-semibold text-[#8A1C1C]">
          {erro}
        </span>
      ) : null}
    </label>
  );
}

export function FormularioLocatario({ inicial, id, titulo, cancelarPara }: Props) {
  const [estado, acao, enviando] = useActionState<EstadoLocatario | undefined, FormData>(salvarLocatarioAction, undefined);
  const erros = estado?.erros ?? {};

  return (
    <form action={acao} noValidate aria-label="Cadastro do locatário" className="flex flex-col gap-4 rounded-2xl border border-[#E8ECF3] bg-white p-5 shadow-sm sm:p-6">
      {id ? <input type="hidden" name="id" value={id} /> : null}

      <h2 className="text-[20px] font-extrabold text-[#002356]">{titulo}</h2>
      <p className="text-[#4F5B72]">Cada CPF ou CNPJ tem um único cadastro. Imóveis e contratos são ligados a ele depois.</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Campo rotulo="Nome ou razão social *" erro={erros.nome}>
          <input name="nome" defaultValue={inicial.nome} className={entrada} />
        </Campo>
        <Campo rotulo="CPF ou CNPJ *" erro={erros.documento}>
          <input name="documento" defaultValue={inicial.documento} autoComplete="off" className={entrada} />
        </Campo>
        <Campo rotulo="RG" erro={erros.rg}>
          <input name="rg" defaultValue={inicial.rg} className={entrada} />
        </Campo>
        <Campo rotulo="E-mail" erro={erros.email}>
          <input type="email" name="email" defaultValue={inicial.email} autoComplete="off" className={entrada} />
        </Campo>
        <Campo rotulo="Telefone (WhatsApp)" erro={erros.whatsapp}>
          <input name="whatsapp" defaultValue={inicial.whatsapp} inputMode="tel" placeholder="(27) 99999-8888" className={entrada} />
        </Campo>
        <Campo rotulo="Observações" erro={erros.observacoes}>
          <input name="observacoes" defaultValue={inicial.observacoes} className={entrada} />
        </Campo>
      </div>

      {estado?.erroGeral ? (
        <p role="alert" className="font-semibold text-[#8A1C1C]">
          {estado.erroGeral}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={enviando} className="min-h-11 rounded-[10px] bg-[#002356] px-5 font-bold text-white disabled:opacity-60">
          {id ? "Salvar alterações" : "Salvar locatário"}
        </button>
        <Link href={cancelarPara} className="flex min-h-11 items-center rounded-[10px] border border-[#A9B4C6] px-4 font-semibold text-[#0E1B33]">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
