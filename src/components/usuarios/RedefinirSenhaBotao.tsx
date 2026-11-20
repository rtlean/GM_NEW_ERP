"use client";

import { useActionState } from "react";
import { redefinirSenhaAction, type EstadoSenha } from "@/app/usuarios/actions";

// Botão "Redefinir senha" do design. A senha provisória aparece uma única vez, na caixa dourada.
export function RedefinirSenhaBotao({ id }: { id: number }) {
  const [estado, acao, enviando] = useActionState<EstadoSenha | undefined, FormData>(redefinirSenhaAction, undefined);

  return (
    <form action={acao} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={enviando} className="min-h-11 w-fit rounded-[10px] border border-[#A9B4C6] bg-white px-3 font-semibold text-[#0E1B33] disabled:opacity-60">
        Redefinir senha
      </button>
      {estado?.senha ? (
        <div role="status" className="flex flex-col gap-1 rounded-xl bg-[#FBF3D9] p-3.5">
          <span className="font-semibold text-[#7A4A00]">Senha provisória, exibida só agora</span>
          <code className="break-all text-lg font-bold">{estado.senha}</code>
        </div>
      ) : null}
      {estado?.erro ? <p role="alert" className="font-semibold text-[#8A1C1C]">{estado.erro}</p> : null}
    </form>
  );
}
