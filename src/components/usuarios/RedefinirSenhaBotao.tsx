"use client";

import { useActionState } from "react";
import { redefinirSenhaAction, type EstadoSenha } from "@/app/usuarios/actions";

export function RedefinirSenhaBotao({ id }: { id: number }) {
  const [estado, acao, enviando] = useActionState<EstadoSenha | undefined, FormData>(redefinirSenhaAction, undefined);

  return (
    <form action={acao} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={enviando} className="w-fit rounded-md border border-line px-3 py-2 font-semibold text-navy disabled:opacity-60">
        Redefinir senha
      </button>
      {estado?.senha ? (
        <div role="status" className="rounded-md bg-warn p-3">
          <p className="font-semibold text-navy">Senha provisória (aparece só agora):</p>
          <code className="text-lg font-bold">{estado.senha}</code>
        </div>
      ) : null}
      {estado?.erro ? <p role="alert" className="font-semibold text-red-800">{estado.erro}</p> : null}
    </form>
  );
}
