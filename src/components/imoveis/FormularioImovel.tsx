"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { salvarImovelAction, type EstadoImovel } from "@/app/imoveis/actions";
import { SITUACOES_DO_CADASTRO, TIPOS_DE_IMOVEL, type EntradaImovel } from "@/lib/cadastro-imovel";

type Opcao = { id: number; nome: string };
type Props = { inicial: EntradaImovel; opcoes: Opcao[]; id?: number };

const entrada = "min-h-11 rounded-[10px] border border-[#A9B4C6] px-3 text-[#0E1B33]";
const ABAS = ["Identificação", "Características", "Valores e vínculos"] as const;

function Campo({ rotulo, erro, children }: { rotulo: string; erro?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-semibold text-[#4F5B72]">{rotulo}</span>
      {children}
      {erro ? (
        <span role="alert" className="text-sm font-semibold text-red-800">
          {erro}
        </span>
      ) : null}
    </label>
  );
}

export function FormularioImovel({ inicial, opcoes, id }: Props) {
  const [estado, acao, enviando] = useActionState<EstadoImovel | undefined, FormData>(salvarImovelAction, undefined);
  const [aba, setAba] = useState<(typeof ABAS)[number]>("Identificação");
  const erros = estado?.erros ?? {};

  return (
    <form action={acao} className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6" noValidate>
      {id ? <input type="hidden" name="id" value={id} /> : null}
      {id ? <input type="hidden" name="situacaoAtual" value={inicial.situacao} /> : null}

      <div role="tablist" className="flex flex-wrap gap-1 border-b border-line">
        {ABAS.map((nome) => (
          <button
            key={nome}
            type="button"
            role="tab"
            aria-selected={aba === nome}
            onClick={() => setAba(nome)}
            className={`min-h-11 border-b-[3px] px-4 font-semibold ${aba === nome ? "border-[#D4A853] text-navy" : "border-transparent text-muted"}`}
          >
            {nome}
          </button>
        ))}
      </div>

      <section hidden={aba !== "Identificação"} className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Tipo *" erro={erros.tipo}>
          <select name="tipo" defaultValue={inicial.tipo} className={entrada}>
            {TIPOS_DE_IMOVEL.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Situação *" erro={erros.situacao}>
          <select name="situacao" defaultValue={inicial.situacao} className={entrada}>
            {inicial.situacao === "occupied" ? <option value="occupied">Alugado (pelo contrato)</option> : null}
            {SITUACOES_DO_CADASTRO.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.rotulo}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="CEP" erro={erros.cep}>
          <input name="cep" inputMode="numeric" defaultValue={inicial.cep} placeholder="29700-000" className={entrada} />
        </Campo>
        <Campo rotulo="Endereço *" erro={erros.endereco}>
          <input name="endereco" defaultValue={inicial.endereco} className={entrada} />
        </Campo>
        <Campo rotulo="Número" erro={erros.numero}>
          <input name="numero" defaultValue={inicial.numero} className={entrada} />
        </Campo>
        <Campo rotulo="Complemento">
          <input name="complemento" defaultValue={inicial.complemento} className={entrada} />
        </Campo>
        <Campo rotulo="Bairro">
          <input name="bairro" defaultValue={inicial.bairro} className={entrada} />
        </Campo>
        <Campo rotulo="Cidade *" erro={erros.cidade}>
          <input name="cidade" defaultValue={inicial.cidade} className={entrada} />
        </Campo>
        <Campo rotulo="UF *" erro={erros.uf}>
          <input name="uf" maxLength={2} defaultValue={inicial.uf} className={`${entrada} uppercase`} />
        </Campo>
      </section>

      <section hidden={aba !== "Características"} className="flex flex-col gap-4">
        <Campo rotulo="Características" erro={erros.caracteristicas}>
          <textarea
            name="caracteristicas"
            rows={6}
            defaultValue={inicial.caracteristicas}
            placeholder="Ex.: 2 quartos, 1 suíte, 1 vaga de garagem, aceita pets"
            className="rounded-[10px] border border-[#A9B4C6] px-3 py-2 text-[#0E1B33]"
          />
        </Campo>
      </section>

      <section hidden={aba !== "Valores e vínculos"} className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Locador *" erro={erros.ownerId}>
          <select name="ownerId" defaultValue={inicial.ownerId} className={entrada}>
            <option value="">Escolha um locador</option>
            {opcoes.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Aluguel de referência (R$)" erro={erros.aluguel}>
          <input name="aluguel" inputMode="decimal" defaultValue={inicial.aluguel} placeholder="1.200,00" className={entrada} />
        </Campo>
      </section>

      {estado?.erroGeral ? (
        <p role="alert" className="font-semibold text-red-800">
          {estado.erroGeral}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button type="submit" disabled={enviando} className="min-h-11 rounded-[10px] bg-[#D4A853] px-5 font-bold text-[#002356] disabled:opacity-60">
          {id ? "Salvar alterações" : "Cadastrar imóvel"}
        </button>
        <Link href={id ? `/imoveis?id=${id}` : "/imoveis"} className="flex min-h-11 items-center rounded-[10px] border border-line px-5 font-semibold text-navy">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
