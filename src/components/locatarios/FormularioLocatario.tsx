"use client";

import Link from "next/link";
import { useActionState } from "react";
import { salvarLocatarioAction, type EstadoLocatario } from "@/app/locatarios/actions";

type Opcao = { id: number; nome: string };
type Inicial = { nome: string; documento: string; email: string; whatsapp: string; locadores: number[] };
type Props = { inicial: Inicial; opcoes: Opcao[]; id?: number };

const entrada = "rounded-md border border-line px-3 py-2 text-navy";

function Campo({ rotulo, erro, children }: { rotulo: string; erro?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-semibold text-muted">{rotulo}</span>
      {children}
      {erro ? (
        <span role="alert" className="text-sm font-semibold text-red-800">
          {erro}
        </span>
      ) : null}
    </label>
  );
}

export function FormularioLocatario({ inicial, opcoes, id }: Props) {
  const [estado, acao, enviando] = useActionState<EstadoLocatario | undefined, FormData>(salvarLocatarioAction, undefined);
  const erros = estado?.erros ?? {};

  return (
    <form action={acao} className="flex flex-col gap-6 rounded-lg border border-line bg-white p-5" noValidate>
      {id ? <input type="hidden" name="id" value={id} /> : null}

      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="text-lg font-bold text-navy sm:col-span-2">Dados do locatário</h2>
        <Campo rotulo="Nome *" erro={erros.nome}>
          <input name="nome" defaultValue={inicial.nome} className={entrada} />
        </Campo>
        <Campo rotulo="CPF ou CNPJ *" erro={erros.documento}>
          <input name="documento" defaultValue={inicial.documento} className={entrada} />
        </Campo>
        <Campo rotulo="E-mail" erro={erros.email}>
          <input type="email" name="email" defaultValue={inicial.email} autoComplete="off" className={entrada} />
        </Campo>
        <Campo rotulo="WhatsApp" erro={erros.whatsapp}>
          <input name="whatsapp" defaultValue={inicial.whatsapp} placeholder="(27) 99999-8888" className={entrada} />
        </Campo>
      </section>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-lg font-bold text-navy">Locadores ligados *</legend>
        <p className="text-muted">Um locatário pode ter imóveis de mais de um locador.</p>
        {opcoes.length === 0 ? (
          <p className="font-semibold text-[#7A4A00]">Cadastre um locador antes de cadastrar o locatário.</p>
        ) : (
          opcoes.map((o) => (
            <label key={o.id} className="flex items-center gap-2 font-semibold text-navy">
              <input type="checkbox" name="locadores" value={o.id} defaultChecked={inicial.locadores.includes(o.id)} className="h-5 w-5" />
              {o.nome}
            </label>
          ))
        )}
        {erros.locadores ? (
          <span role="alert" className="text-sm font-semibold text-red-800">
            {erros.locadores}
          </span>
        ) : null}
      </fieldset>

      {estado?.erroGeral ? (
        <p role="alert" className="font-semibold text-red-800">
          {estado.erroGeral}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button type="submit" disabled={enviando} className="rounded-md bg-navy px-4 py-2 font-semibold text-white disabled:opacity-60">
          {id ? "Salvar alterações" : "Cadastrar locatário"}
        </button>
        <Link href={id ? `/locatarios?id=${id}` : "/locatarios"} className="rounded-md border border-line px-4 py-2 font-semibold text-navy">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
