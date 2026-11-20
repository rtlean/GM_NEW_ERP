"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { salvarImovelAction, type EstadoImovel } from "@/app/imoveis/actions";
import { COMODIDADES, FINALIDADES, MOBILIAS, OPCOES_PETS, SITUACOES_DO_CADASTRO, TIPOS_DE_IMOVEL, type EntradaImovel } from "@/lib/cadastro-imovel";

type Opcao = { id: number; nome: string };
type Props = { inicial: EntradaImovel; opcoes: Opcao[]; id?: number; titulo: string; falta: string; salvo: boolean; };

const entrada = "min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3 text-[#0E1B33]";
const ABAS = ["Identificação", "Características", "Comodidades", "Valores e vínculos"] as const;

function Campo({ rotulo, erro, children, className = "" }: { rotulo: string; erro?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="font-semibold text-[#4F5B72]">{rotulo}</span>
      {children}
      {erro ? (
        <span role="alert" className="text-sm font-semibold text-[#8A1C1C]">
          {erro}
        </span>
      ) : null}
    </label>
  );
}

export function FormularioImovel({ inicial, opcoes, id, titulo, falta, salvo }: Props) {
  const [estado, acao, enviando] = useActionState<EstadoImovel | undefined, FormData>(salvarImovelAction, undefined);
  const [aba, setAba] = useState<(typeof ABAS)[number]>("Identificação");
  const erros = estado?.erros ?? {};

  return (
    <form action={acao} noValidate aria-label="Cadastro do imóvel" className="flex flex-col gap-4 rounded-2xl border border-[#E8ECF3] bg-white p-5 shadow-sm sm:p-6">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      {id ? <input type="hidden" name="situacaoAtual" value={inicial.situacao} /> : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-extrabold leading-tight text-[#002356]">{titulo}</h2>
          <p className="text-[#4F5B72]">{falta}</p>
        </div>
        <button type="submit" disabled={enviando} className="min-h-11 rounded-[10px] bg-[#D4A853] px-5 font-bold text-[#002356] disabled:opacity-60">
          {salvo && !estado ? "Salvo" : "Salvar imóvel"}
        </button>
      </div>

      {estado?.erroGeral ? (
        <p role="alert" className="rounded-[10px] bg-[#FBE9E9] p-3 font-semibold text-[#8A1C1C]">
          {estado.erroGeral}
        </p>
      ) : null}

      <div role="tablist" className="flex flex-wrap gap-1 border-b border-[#D8DEE9]">
        {ABAS.map((nome) => (
          <button
            key={nome}
            type="button"
            role="tab"
            aria-selected={aba === nome}
            onClick={() => setAba(nome)}
            className={`min-h-11 border-b-[3px] px-4 text-[#0E1B33] ${aba === nome ? "border-[#D4A853] font-bold" : "border-transparent font-medium"}`}
          >
            {nome}
          </button>
        ))}
      </div>

      <section hidden={aba !== "Identificação"} className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Nome de identificação" erro={erros.nome}>
          <input name="nome" defaultValue={inicial.nome} className={entrada} />
        </Campo>
        <Campo rotulo="Tipo *" erro={erros.tipo}>
          <select name="tipo" defaultValue={inicial.tipo} className={entrada}>
            {TIPOS_DE_IMOVEL.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Finalidade" erro={erros.finalidade}>
          <select name="finalidade" defaultValue={inicial.finalidade || "Locação"} className={entrada}>
            {FINALIDADES.map((f) => (
              <option key={f}>{f}</option>
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
        <Campo rotulo="Matrícula" erro={erros.matricula}>
          <input name="matricula" defaultValue={inicial.matricula} className={entrada} />
        </Campo>
        <Campo rotulo="Inscrição do IPTU" erro={erros.inscricaoIptu}>
          <input name="inscricaoIptu" defaultValue={inicial.inscricaoIptu} className={entrada} />
        </Campo>
      </section>

      <section hidden={aba !== "Características"} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Campo rotulo="Quartos" erro={erros.quartos}>
          <input type="number" min={0} name="quartos" defaultValue={inicial.quartos} className={entrada} />
        </Campo>
        <Campo rotulo="Suítes" erro={erros.suites}>
          <input type="number" min={0} name="suites" defaultValue={inicial.suites} className={entrada} />
        </Campo>
        <Campo rotulo="Banheiros" erro={erros.banheiros}>
          <input type="number" min={0} name="banheiros" defaultValue={inicial.banheiros} className={entrada} />
        </Campo>
        <Campo rotulo="Vagas" erro={erros.vagas}>
          <input type="number" min={0} name="vagas" defaultValue={inicial.vagas} className={entrada} />
        </Campo>
        <Campo rotulo="Área útil (m²)" erro={erros.areaUtil}>
          <input inputMode="decimal" name="areaUtil" defaultValue={inicial.areaUtil} className={entrada} />
        </Campo>
        <Campo rotulo="Área total (m²)" erro={erros.areaTotal}>
          <input inputMode="decimal" name="areaTotal" defaultValue={inicial.areaTotal} className={entrada} />
        </Campo>
        <Campo rotulo="Andar" erro={erros.andar}>
          <input name="andar" defaultValue={inicial.andar} className={entrada} />
        </Campo>
        <Campo rotulo="Mobília" erro={erros.mobilia}>
          <select name="mobilia" defaultValue={inicial.mobilia || "Sem mobília"} className={entrada}>
            {MOBILIAS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Aceita pets" erro={erros.pets}>
          <select name="pets" defaultValue={inicial.pets || "Não informado"} className={entrada}>
            {OPCOES_PETS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Campo>
      </section>

      <section hidden={aba !== "Comodidades"} className="flex flex-col gap-4">
        <div role="group" aria-label="Comodidades" className="flex flex-wrap gap-2">
          {COMODIDADES.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="checkbox" name="comodidades" value={c} defaultChecked={inicial.comodidades.includes(c)} className="peer sr-only" />
              <span className="inline-flex min-h-11 items-center rounded-full border border-[#D8DEE9] bg-white px-4 font-semibold text-[#002356] peer-checked:border-[#002356] peer-checked:bg-[#002356] peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-[#D4A853]">
                {c}
              </span>
            </label>
          ))}
        </div>
        <button type="button" disabled title="Fotos entram em uma etapa futura" className="min-h-[120px] cursor-not-allowed rounded-[14px] border-2 border-dashed border-[#A9B4C6] bg-[#F6F8FC] font-semibold text-[#002356] opacity-70">
          Adicionar fotos do imóvel (em breve)
        </button>
      </section>

      <section hidden={aba !== "Valores e vínculos"} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Campo rotulo="Aluguel (R$)" erro={erros.aluguel}>
          <input name="aluguel" inputMode="decimal" defaultValue={inicial.aluguel} placeholder="1.200,00" className={entrada} />
        </Campo>
        <Campo rotulo="Valor de venda (R$)" erro={erros.valorVenda}>
          <input name="valorVenda" inputMode="decimal" defaultValue={inicial.valorVenda} placeholder="0,00" className={entrada} />
        </Campo>
        <Campo rotulo="Condomínio (R$/mês)" erro={erros.condominio}>
          <input name="condominio" inputMode="decimal" defaultValue={inicial.condominio} placeholder="0,00" className={entrada} />
        </Campo>
        <Campo rotulo="IPTU (R$/ano)" erro={erros.iptu}>
          <input name="iptu" inputMode="decimal" defaultValue={inicial.iptu} placeholder="0,00" className={entrada} />
        </Campo>
        <Campo rotulo="Locador *" erro={erros.ownerId} className="sm:col-span-2">
          <select name="ownerId" defaultValue={inicial.ownerId} className={entrada}>
            <option value="">Escolha um locador</option>
            {opcoes.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          </select>
        </Campo>
        <p className="text-sm text-[#4F5B72] sm:col-span-2">O contrato deste imóvel aparece aqui quando o cadastro de contratos (US-3.5) for feito.</p>
      </section>

      <div className="flex gap-2">
        <Link href={id ? `/imoveis?id=${id}` : "/imoveis"} className="flex min-h-11 items-center rounded-[10px] border border-[#D8DEE9] px-5 font-semibold text-[#002356]">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
