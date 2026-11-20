"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { salvarLocadorAction, type EstadoLocador } from "@/app/locadores/actions";
import { ROTULO_FORMA_DE_REPASSE, ROTULO_TIPO_DE_PIX, TIPOS_DE_PIX, type EntradaLocador } from "@/lib/cadastro-locador";

type Props = { inicial: EntradaLocador; id?: number; titulo: string };

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

export function FormularioLocador({ inicial, id, titulo }: Props) {
  const [estado, acao, enviando] = useActionState<EstadoLocador | undefined, FormData>(salvarLocadorAction, undefined);
  const [formaRepasse, setFormaRepasse] = useState(inicial.formaRepasse);
  const erros = estado?.erros ?? {};

  return (
    <form action={acao} noValidate aria-label="Cadastro do locador" className="flex flex-col gap-4 rounded-2xl border border-[#E8ECF3] bg-white p-5 shadow-sm sm:p-6">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      {/* Campos que o design não mostra: mantidos para não perder o que já está gravado. */}
      <input type="hidden" name="codigoBanco" value={inicial.codigoBanco} />
      <input type="hidden" name="tipoConta" value={inicial.tipoConta} />

      <h2 className="text-[20px] font-extrabold text-[#002356]">{titulo}</h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Campo rotulo="Nome ou razão social *" erro={erros.nome}>
          <input name="nome" defaultValue={inicial.nome} className={entrada} />
        </Campo>
        <Campo rotulo="CPF ou CNPJ *" erro={erros.documento}>
          <input name="documento" defaultValue={inicial.documento} autoComplete="off" className={entrada} />
        </Campo>
        <Campo rotulo="E-mail" erro={erros.email}>
          <input type="email" name="email" defaultValue={inicial.email} autoComplete="off" className={entrada} />
        </Campo>
        <Campo rotulo="Telefone" erro={erros.whatsapp}>
          <input name="whatsapp" defaultValue={inicial.whatsapp} inputMode="tel" placeholder="(27) 99999-8888" className={entrada} />
        </Campo>
        <Campo rotulo="Cidade">
          <input name="cidade" defaultValue={inicial.cidade} className={entrada} />
        </Campo>
        <Campo rotulo="Taxa de administração (%) *" erro={erros.taxa}>
          <input name="taxa" defaultValue={inicial.taxa} inputMode="decimal" className={entrada} />
        </Campo>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Campo rotulo="Forma de repasse *" erro={erros.formaRepasse}>
          <select name="formaRepasse" value={formaRepasse} onChange={(e) => setFormaRepasse(e.target.value)} className={entrada}>
            <option value="PIX">{ROTULO_FORMA_DE_REPASSE.PIX}</option>
            <option value="TRANSFERÊNCIA BANCÁRIA">{ROTULO_FORMA_DE_REPASSE["TRANSFERÊNCIA BANCÁRIA"]}</option>
          </select>
        </Campo>

        {formaRepasse === "PIX" ? (
          <>
            <Campo rotulo="Tipo de chave Pix *" erro={erros.tipoPix}>
              <select name="tipoPix" defaultValue={inicial.tipoPix} className={entrada}>
                {TIPOS_DE_PIX.map((t) => (
                  <option key={t} value={t}>
                    {ROTULO_TIPO_DE_PIX[t]}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Chave Pix *" erro={erros.chavePix}>
              <input name="chavePix" defaultValue={inicial.chavePix} autoComplete="off" className={entrada} />
            </Campo>
          </>
        ) : (
          <>
            <Campo rotulo="Banco *" erro={erros.banco}>
              <input name="banco" defaultValue={inicial.banco} className={entrada} />
            </Campo>
            <Campo rotulo="Agência *" erro={erros.agencia}>
              <input name="agencia" defaultValue={inicial.agencia} inputMode="numeric" className={entrada} />
            </Campo>
            <Campo rotulo="Conta com dígito *" erro={erros.conta}>
              <input name="conta" defaultValue={inicial.conta} placeholder="12345-6" className={entrada} />
            </Campo>
          </>
        )}
      </div>

      {estado?.duplicado ? (
        <p className="font-semibold text-[#002356]">
          Este CPF/CNPJ já está cadastrado.{" "}
          <Link href={`/locadores?id=${estado.duplicado.id}`} className="underline">
            Abrir {estado.duplicado.nome}
          </Link>
        </p>
      ) : null}
      {estado?.erroGeral ? (
        <p role="alert" className="rounded-[10px] bg-[#FBE9E9] p-3 font-semibold text-[#8A1C1C]">
          {estado.erroGeral}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={enviando} className="min-h-11 rounded-[10px] bg-[#002356] px-5 font-bold text-white disabled:opacity-60">
          {id ? "Salvar alterações" : "Salvar locador"}
        </button>
        <Link href={id ? `/locadores?id=${id}` : "/locadores"} className="flex min-h-11 items-center rounded-[10px] border border-[#A9B4C6] px-5 font-semibold text-[#0E1B33]">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
