"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { criarUsuarioAction, type EstadoCriar } from "@/app/usuarios/actions";

// Formulário "Criar acesso operacional" do design. A senha provisória é gerada no navegador pelo botão "Gerar".
const CARACTERES = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function senhaAleatoria(): string {
  const sorteio = new Uint32Array(12);
  crypto.getRandomValues(sorteio);
  let senha = Array.from(sorteio, (n) => CARACTERES[n % CARACTERES.length]).join("");
  if (!/[A-Za-z]/.test(senha)) senha = "a" + senha.slice(1);
  if (!/\d/.test(senha)) senha = senha.slice(0, -1) + "7";
  return senha;
}

const entrada = "min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3 text-[#0E1B33]";

export function NovoUsuarioForm() {
  const [estado, acao, enviando] = useActionState<EstadoCriar | undefined, FormData>(criarUsuarioAction, undefined);
  const [senha, setSenha] = useState(() => senhaAleatoria());

  if (estado?.senha) {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-2xl border border-[#E8ECF3] bg-white p-5">
        <p className="font-semibold text-[#17533B]">Acesso criado. Anote a senha provisória: ela só aparece agora.</p>
        <div className="flex flex-col gap-1 rounded-xl bg-[#FBF3D9] p-4">
          <span className="font-semibold text-[#7A4A00]">Senha provisória, exibida só agora</span>
          <code className="text-lg font-bold break-all">{estado.senha}</code>
        </div>
        <Link href={`/usuarios?u=${estado.id}`} className="font-bold text-[#002356] underline">
          Definir telas de {estado.nome}
        </Link>
      </div>
    );
  }

  return (
    <form action={acao} noValidate className="flex flex-col gap-4 rounded-2xl border border-[#E8ECF3] bg-white p-5 shadow-sm">
      <h2 className="text-[18px] font-bold text-[#002356]">Criar acesso operacional</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 font-semibold">
          Nome
          <input name="nome" className={entrada} />
        </label>
        <label className="flex flex-col gap-1 font-semibold">
          E-mail
          <input type="email" name="email" autoComplete="off" className={entrada} />
        </label>
        <label className="flex flex-col gap-1 font-semibold">
          Senha provisória
          <span className="flex gap-2">
            <input name="senha" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" className={`${entrada} min-w-0 flex-1`} />
            <button type="button" onClick={() => setSenha(senhaAleatoria())} className="min-h-11 shrink-0 rounded-[10px] border border-[#A9B4C6] bg-white px-3 font-semibold text-[#002356]">
              Gerar
            </button>
          </span>
        </label>
      </div>
      <p className="text-[#4F5B72]">A senha deve ter ao menos 10 caracteres, somente letras e números, com pelo menos um de cada. O usuário escolhe outra no primeiro acesso.</p>
      {estado?.erro ? (
        <p role="alert" className="font-semibold text-[#8A1C1C]">
          {estado.erro}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={enviando} className="min-h-11 rounded-[10px] bg-[#002356] px-5 font-bold text-white disabled:opacity-60">
          Criar e definir telas
        </button>
        <Link href="/usuarios" className="flex min-h-11 items-center rounded-[10px] border border-[#A9B4C6] px-4 font-semibold text-[#0E1B33]">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
