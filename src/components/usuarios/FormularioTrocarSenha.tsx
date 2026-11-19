"use client";

import { useActionState } from "react";
import { trocarSenhaAction } from "@/app/trocar-senha/actions";

export function FormularioTrocarSenha() {
  const [estado, acao, enviando] = useActionState(trocarSenhaAction, undefined);

  return (
    <form action={acao} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="font-semibold text-muted">Nova senha</span>
        <input type="password" name="nova" required autoComplete="new-password" className="rounded-md border border-line px-3 py-2 text-navy" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-semibold text-muted">Repita a nova senha</span>
        <input type="password" name="confirmacao" required autoComplete="new-password" className="rounded-md border border-line px-3 py-2 text-navy" />
      </label>
      <p className="text-muted">Mínimo de 10 caracteres, com letras e números.</p>
      {estado?.erro ? (
        <p role="alert" className="rounded-md bg-warn px-3 py-2 text-navy">{estado.erro}</p>
      ) : null}
      <button type="submit" disabled={enviando} className="rounded-md bg-navy px-4 py-2 font-semibold text-white disabled:opacity-60">
        Salvar nova senha
      </button>
    </form>
  );
}
