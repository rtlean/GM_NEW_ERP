"use client";

import { useActionState } from "react";
import { trocarSenhaAction } from "@/app/trocar-senha/actions";

const campo = "min-h-12 rounded-[10px] border border-[#A9B4C6] bg-white px-3.5 text-[15px] text-[#0E1B33]";

/** Formulário de troca de senha. `voluntaria` pede a senha atual (botão "Minha senha"). */
export function FormularioTrocarSenha({ voluntaria = false }: { voluntaria?: boolean }) {
  const [estado, acao, enviando] = useActionState(trocarSenhaAction, undefined);

  return (
    <form action={acao} className="flex flex-col gap-4">
      {voluntaria ? <input type="hidden" name="voluntaria" value="1" /> : null}
      {voluntaria ? (
        <label className="flex flex-col gap-1 font-semibold">
          Senha atual
          <input type="password" name="atual" required autoComplete="current-password" className={campo} />
        </label>
      ) : null}
      <label className="flex flex-col gap-1 font-semibold">
        Nova senha
        <input type="password" name="nova" required autoComplete="new-password" className={campo} />
      </label>
      <p className="text-muted">Use ao menos 10 caracteres, somente letras e números, com pelo menos um de cada.</p>
      {estado?.erro ? (
        <p role="alert" className="rounded-[10px] bg-[#FBEDED] p-3.5 font-semibold text-[#8A1C1C]">
          {estado.erro}
        </p>
      ) : null}
      {estado?.ok ? (
        <p role="status" className="rounded-[10px] bg-[#DDF0E7] p-3.5 font-semibold text-[#17533B]">
          Senha alterada com sucesso.
        </p>
      ) : null}
      <button type="submit" disabled={enviando} className="min-h-12 rounded-[10px] bg-navy text-[15px] font-bold text-white disabled:opacity-60">
        Salvar nova senha
      </button>
    </form>
  );
}
