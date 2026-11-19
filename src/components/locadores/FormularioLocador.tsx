"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { salvarLocadorAction, type EstadoLocador } from "@/app/locadores/actions";
import { TIPOS_DE_CONTA, TIPOS_DE_PIX, type EntradaLocador } from "@/lib/cadastro-locador";

type Props = { inicial: EntradaLocador; id?: number };

function Campo({
  rotulo,
  nome,
  erro,
  children,
}: {
  rotulo: string;
  nome: string;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-semibold text-muted">{rotulo}</span>
      {children}
      {erro ? (
        <span id={`erro-${nome}`} role="alert" className="text-sm font-semibold text-red-800">
          {erro}
        </span>
      ) : null}
    </label>
  );
}

const entrada = "rounded-md border border-line px-3 py-2 text-navy";

export function FormularioLocador({ inicial, id }: Props) {
  const [estado, acao, enviando] = useActionState<EstadoLocador | undefined, FormData>(salvarLocadorAction, undefined);
  const [formaRepasse, setFormaRepasse] = useState(inicial.formaRepasse);
  const erros = estado?.erros ?? {};

  return (
    <form action={acao} className="flex flex-col gap-6 rounded-lg border border-line bg-white p-5" noValidate>
      {id ? <input type="hidden" name="id" value={id} /> : null}

      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="text-lg font-bold text-navy sm:col-span-2">Dados do locador</h2>
        <Campo rotulo="Nome *" nome="nome" erro={erros.nome}>
          <input name="nome" defaultValue={inicial.nome} required className={entrada} />
        </Campo>
        <Campo rotulo="CPF ou CNPJ *" nome="documento" erro={erros.documento}>
          <input name="documento" defaultValue={inicial.documento} required inputMode="text" className={entrada} />
        </Campo>
        <Campo rotulo="E-mail" nome="email" erro={erros.email}>
          <input type="email" name="email" defaultValue={inicial.email} autoComplete="off" className={entrada} />
        </Campo>
        <Campo rotulo="Cidade" nome="cidade">
          <input name="cidade" defaultValue={inicial.cidade} className={entrada} />
        </Campo>
        <Campo rotulo="WhatsApp" nome="whatsapp" erro={erros.whatsapp}>
          <input name="whatsapp" defaultValue={inicial.whatsapp} placeholder="(27) 99999-8888" className={entrada} />
        </Campo>
        <Campo rotulo="Taxa de administração (%) *" nome="taxa" erro={erros.taxa}>
          <input name="taxa" defaultValue={inicial.taxa} required inputMode="decimal" className={entrada} />
        </Campo>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="text-lg font-bold text-navy sm:col-span-2">Repasse</h2>
        <Campo rotulo="Forma de repasse *" nome="formaRepasse" erro={erros.formaRepasse}>
          <select
            name="formaRepasse"
            value={formaRepasse}
            onChange={(e) => setFormaRepasse(e.target.value)}
            className={entrada}
          >
            <option value="PIX">Pix</option>
            <option value="TRANSFERÊNCIA BANCÁRIA">Conta bancária</option>
          </select>
        </Campo>

        {formaRepasse === "PIX" ? (
          <>
            <Campo rotulo="Tipo da chave Pix *" nome="tipoPix" erro={erros.tipoPix}>
              <select name="tipoPix" defaultValue={inicial.tipoPix} className={entrada}>
                {TIPOS_DE_PIX.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Chave Pix *" nome="chavePix" erro={erros.chavePix}>
              <input name="chavePix" defaultValue={inicial.chavePix} className={entrada} />
            </Campo>
          </>
        ) : (
          <>
            <Campo rotulo="Banco *" nome="banco" erro={erros.banco}>
              <input name="banco" defaultValue={inicial.banco} className={entrada} />
            </Campo>
            <Campo rotulo="Código do banco" nome="codigoBanco">
              <input name="codigoBanco" defaultValue={inicial.codigoBanco} className={entrada} />
            </Campo>
            <Campo rotulo="Agência *" nome="agencia" erro={erros.agencia}>
              <input name="agencia" defaultValue={inicial.agencia} className={entrada} />
            </Campo>
            <Campo rotulo="Conta *" nome="conta" erro={erros.conta}>
              <input name="conta" defaultValue={inicial.conta} className={entrada} />
            </Campo>
            <Campo rotulo="Dígito da conta" nome="digitoConta">
              <input name="digitoConta" defaultValue={inicial.digitoConta} className={entrada} />
            </Campo>
            <Campo rotulo="Tipo de conta *" nome="tipoConta" erro={erros.tipoConta}>
              <select name="tipoConta" defaultValue={inicial.tipoConta} className={entrada}>
                {TIPOS_DE_CONTA.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Campo>
          </>
        )}
      </section>

      {estado?.duplicado ? (
        <p className="font-semibold text-navy">
          Este CPF/CNPJ já está cadastrado.{" "}
          <Link href={`/locadores?id=${estado.duplicado.id}`} className="underline">
            Abrir {estado.duplicado.nome}
          </Link>
        </p>
      ) : null}
      {estado?.erroGeral ? (
        <p role="alert" className="font-semibold text-red-800">
          {estado.erroGeral}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button type="submit" disabled={enviando} className="rounded-md bg-navy px-4 py-2 font-semibold text-white disabled:opacity-60">
          {id ? "Salvar alterações" : "Cadastrar locador"}
        </button>
        <Link href={id ? `/locadores?id=${id}` : "/locadores"} className="rounded-md border border-line px-4 py-2 font-semibold text-navy">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
