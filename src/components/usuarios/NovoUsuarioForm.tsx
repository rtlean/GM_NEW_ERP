"use client";

import Link from "next/link";
import { useActionState } from "react";
import { criarUsuarioAction, type EstadoCriar } from "@/app/usuarios/actions";

export function NovoUsuarioForm() {
  const [estado, acao, enviando] = useActionState<EstadoCriar | undefined, FormData>(criarUsuarioAction, undefined);

  if (estado?.senha) {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-lg bg-warn p-4">
        <p className="font-semibold text-navy">Acesso criado. Anote a senha provisória: ela só aparece agora.</p>
        <code className="text-lg font-bold">{estado.senha}</code>
        <Link href={`/usuarios?u=${estado.id}`} className="font-semibold text-navy underline">
          Liberar telas para {estado.nome}
        </Link>
      </div>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-4 rounded-lg border border-line bg-white p-5">
      <h2 className="text-lg font-bold text-navy">Criar acesso operacional</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="font-semibold text-muted">Nome</span>
          <input name="nome" required className="rounded-md border border-line px-3 py-2 text-navy" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-semibold text-muted">E-mail</span>
          <input type="email" name="email" required autoComplete="off" className="rounded-md border border-line px-3 py-2 text-navy" />
        </label>
      </div>
      <p className="text-muted">Uma senha provisória será gerada. O usuário escolhe outra no primeiro acesso.</p>
      {estado?.erro ? <p role="alert" className="font-semibold text-red-800">{estado.erro}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={enviando} className="rounded-md bg-navy px-4 py-2 font-semibold text-white disabled:opacity-60">
          Criar e definir telas
        </button>
      </div>
    </form>
  );
}
