"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { criarContratoAction, type EstadoNovoContrato } from "@/app/contratos/actions";
import { GARANTIAS, INDICES_DE_REAJUSTE, taxaPadrao } from "@/lib/contratos-regras";

// Assistente de novo contrato (US-3.5b): 5 passos. Imóvel novo é cadastrado na tela de Imóveis (cadastro completo).

export type OpcaoLocador = { id: number; nome: string; taxaBps: number | null };
export type OpcaoImovel = { id: number; codigo: string | null; tipo: string | null; endereco: string | null; ownerId: number | null; ocupadoPor: string | null; ocupadoPorId: number | null };
export type OpcaoLocatario = { id: number; nome: string; taxaBps: number | null };

const PASSOS = ["Locador", "Imóvel", "Locatário", "Condições", "Revisão"];

const chip = (ativo: boolean) =>
  `min-h-11 rounded-[10px] border px-3 text-left text-[13px] font-medium ${ativo ? "border-navy bg-navy text-white" : "border-[#D8DEE9] bg-white text-navy"}`;
const campo = "flex flex-col gap-1 font-semibold";
const entrada = "min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3 font-normal";

function taxaEmTexto(bps: number): string {
  return String(bps / 100).replace(".", ",");
}

export function AssistenteNovoContrato({
  locadores,
  imoveis,
  locatarios,
}: {
  locadores: OpcaoLocador[];
  imoveis: OpcaoImovel[];
  locatarios: OpcaoLocatario[];
}) {
  const [passo, setPasso] = useState(1);
  const [buscaLocador, setBuscaLocador] = useState("");
  const [buscaLocatario, setBuscaLocatario] = useState("");
  const [locadorId, setLocadorId] = useState<number | null>(null);
  const [imovelId, setImovelId] = useState<number | null>(null);
  const [locatarioId, setLocatarioId] = useState<number | "novo" | null>(null);
  const [nomeNovo, setNomeNovo] = useState("");
  const [documentoNovo, setDocumentoNovo] = useState("");
  const [aluguel, setAluguel] = useState("");
  const [dia, setDia] = useState("10");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [indice, setIndice] = useState<string>("IGP-M");
  const [garantia, setGarantia] = useState<string>("Caução");
  const [taxa, setTaxa] = useState<string | null>(null);
  const [estado, acao, enviando] = useActionState<EstadoNovoContrato, FormData>(criarContratoAction, undefined);

  const locador = locadores.find((l) => l.id === locadorId) ?? null;
  const locatarioEscolhido = typeof locatarioId === "number" ? (locatarios.find((l) => l.id === locatarioId) ?? null) : null;
  const imovel = imoveis.find((i) => i.id === imovelId) ?? null;
  const imoveisDoLocador = imoveis.filter((i) => i.ownerId === locadorId);

  const locadoresFiltrados = useMemo(() => {
    const t = buscaLocador.trim().toLowerCase();
    return locadores.filter((l) => !t || l.nome.toLowerCase().includes(t)).slice(0, 12);
  }, [locadores, buscaLocador]);

  const locatariosFiltrados = useMemo(() => {
    const t = buscaLocatario.trim().toLowerCase();
    return locatarios.filter((l) => !t || l.nome.toLowerCase().includes(t)).slice(0, 12);
  }, [locatarios, buscaLocatario]);

  // Aluguel já ocupado: se for o mesmo locatário, é renovação; se for outro, o envio é bloqueado.
  const renovacao = !!imovel?.ocupadoPorId && locatarioId === imovel.ocupadoPorId;
  const bloqueado = !!imovel?.ocupadoPorId && locatarioId !== null && locatarioId !== imovel.ocupadoPorId;

  const taxaInicial = taxaPadrao(locador?.taxaBps ?? null, locatarioEscolhido?.taxaBps ?? null);
  const taxaAtual = taxa ?? taxaEmTexto(taxaInicial);

  const nomeLocatario = locatarioId === "novo" ? nomeNovo.trim() : (locatarioEscolhido?.nome ?? "");

  return (
    <section aria-label="Novo contrato" className="flex flex-col gap-4 rounded-2xl border-2 border-gold bg-white p-5">
      <h2 className="text-[20px] font-extrabold text-navy">Novo contrato</h2>
      <ol className="flex flex-wrap gap-2 text-[13px] font-semibold text-muted" aria-label="Passos">
        {PASSOS.map((nome, i) => (
          <li key={nome} aria-current={passo === i + 1 ? "step" : undefined} className={passo === i + 1 ? "text-navy" : ""}>
            {i + 1}. {nome}
          </li>
        ))}
      </ol>

      <form
        action={acao}
        className="flex flex-col gap-4"
        onKeyDown={(e) => {
          // Enter em um campo não envia o contrato antes da revisão.
          if (e.key === "Enter" && passo !== 5) e.preventDefault();
        }}
      >
        <input type="hidden" name="locadorId" value={locadorId ?? ""} />
        <input type="hidden" name="imovelId" value={imovelId ?? ""} />
        <input type="hidden" name="locatarioId" value={locatarioId ?? ""} />
        {locatarioId === "novo" ? (
          <>
            <input type="hidden" name="nomeNovo" value={nomeNovo} />
            <input type="hidden" name="documentoNovo" value={documentoNovo} />
          </>
        ) : null}
        <input type="hidden" name="aluguel" value={aluguel} />
        <input type="hidden" name="dia" value={dia} />
        <input type="hidden" name="inicio" value={inicio} />
        <input type="hidden" name="fim" value={fim} />
        <input type="hidden" name="indice" value={indice} />
        <input type="hidden" name="garantia" value={garantia} />
        <input type="hidden" name="taxa" value={taxaAtual} />

        {passo === 1 ? (
          <div className="flex flex-col gap-3">
            <h3 className="text-[16px] font-bold text-navy">1. Locador</h3>
            <input
              type="search"
              aria-label="Buscar locador"
              value={buscaLocador}
              onChange={(e) => setBuscaLocador(e.target.value)}
              placeholder="Buscar locador"
              className="min-h-11 max-w-[420px] rounded-[10px] border border-[#A9B4C6] px-3"
            />
            <div className="flex flex-wrap gap-1.5">
              {locadoresFiltrados.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={locadorId === l.id}
                  onClick={() => {
                    setLocadorId(l.id);
                    setImovelId(null);
                  }}
                  className={chip(locadorId === l.id)}
                >
                  {l.nome}
                </button>
              ))}
            </div>
            <div>
              <button type="button" disabled={locadorId === null} onClick={() => setPasso(2)} className="min-h-11 rounded-[10px] bg-navy px-5 font-bold text-white disabled:opacity-50">
                Próximo
              </button>
            </div>
          </div>
        ) : null}

        {passo === 2 ? (
          <div className="flex flex-col gap-3">
            <h3 className="text-[16px] font-bold text-navy">2. Imóvel de {locador?.nome}</h3>
            <div className="flex flex-wrap gap-1.5">
              {imoveisDoLocador.length === 0 ? <p className="text-muted">Este locador não tem imóveis cadastrados.</p> : null}
              {imoveisDoLocador.map((i) => (
                <button key={i.id} type="button" aria-pressed={imovelId === i.id} onClick={() => setImovelId(i.id)} className={chip(imovelId === i.id)}>
                  {[i.codigo, i.tipo, i.endereco].filter(Boolean).join(" · ")}
                  {i.ocupadoPor ? ` · alugado para ${i.ocupadoPor}` : " · vago"}
                </button>
              ))}
            </div>
            <Link href="/imoveis?novo=1" className="text-sm font-semibold text-navy underline">
              Cadastrar novo imóvel (abre o cadastro completo)
            </Link>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPasso(1)} className="min-h-11 rounded-[10px] border border-[#A9B4C6] px-4 text-navy">
                Voltar
              </button>
              <button type="button" disabled={imovelId === null} onClick={() => setPasso(3)} className="min-h-11 rounded-[10px] bg-navy px-5 font-bold text-white disabled:opacity-50">
                Próximo
              </button>
            </div>
          </div>
        ) : null}

        {passo === 3 ? (
          <div className="flex flex-col gap-3">
            <h3 className="text-[16px] font-bold text-navy">3. Locatário</h3>
            <input
              type="search"
              aria-label="Buscar locatário"
              value={buscaLocatario}
              onChange={(e) => setBuscaLocatario(e.target.value)}
              placeholder="Buscar locatário pelo nome"
              className="min-h-11 max-w-[420px] rounded-[10px] border border-[#A9B4C6] px-3"
            />
            <div className="flex flex-wrap gap-1.5">
              {locatariosFiltrados.map((l) => (
                <button key={l.id} type="button" aria-pressed={locatarioId === l.id} onClick={() => setLocatarioId(l.id)} className={chip(locatarioId === l.id)}>
                  {l.nome}
                </button>
              ))}
              <button type="button" aria-pressed={locatarioId === "novo"} onClick={() => setLocatarioId("novo")} className={chip(locatarioId === "novo")}>
                + Novo locatário
              </button>
            </div>
            {locatarioId === "novo" ? (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
                <label className={campo}>
                  Nome ou razão social *
                  <input type="text" value={nomeNovo} onChange={(e) => setNomeNovo(e.target.value)} className={entrada} />
                </label>
                <label className={campo}>
                  CPF ou CNPJ *
                  <input type="text" value={documentoNovo} onChange={(e) => setDocumentoNovo(e.target.value)} autoComplete="off" className={entrada} />
                </label>
              </div>
            ) : null}
            {renovacao ? (
              <p role="status" className="rounded-[10px] bg-[#FBF3D9] p-3.5 font-semibold text-[#7A4A00]">
                Renovação: o imóvel já está com este locatário. O contrato anterior será encerrado na data de início do novo.
              </p>
            ) : null}
            {bloqueado ? (
              <p role="alert" className="rounded-[10px] bg-[#FBEDED] p-3.5 font-semibold text-[#8A1C1C]">
                Este imóvel está alugado para {imovel?.ocupadoPor}. Encerre o contrato atual antes de alugar para outro locatário.
              </p>
            ) : null}
            <div className="flex gap-2">
              <button type="button" onClick={() => setPasso(2)} className="min-h-11 rounded-[10px] border border-[#A9B4C6] px-4 text-navy">
                Voltar
              </button>
              <button
                type="button"
                disabled={locatarioId === null || (locatarioId === "novo" && (!nomeNovo.trim() || !documentoNovo.trim())) || bloqueado}
                onClick={() => setPasso(4)}
                className="min-h-11 rounded-[10px] bg-navy px-5 font-bold text-white disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        ) : null}

        {passo === 4 ? (
          <div className="flex flex-col gap-3">
            <h3 className="text-[16px] font-bold text-navy">4. Condições</h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
              <label className={campo}>
                Aluguel (R$) *
                <input type="text" inputMode="decimal" value={aluguel} onChange={(e) => setAluguel(e.target.value)} placeholder="1.200,00" className={entrada} />
              </label>
              <label className={campo}>
                Dia do vencimento *
                <input type="number" min={1} max={28} value={dia} onChange={(e) => setDia(e.target.value)} className={entrada} />
              </label>
              <label className={campo}>
                Início *
                <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className={entrada} />
              </label>
              <label className={campo}>
                Fim
                <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className={entrada} />
              </label>
              <label className={campo}>
                Índice de reajuste
                <select value={indice} onChange={(e) => setIndice(e.target.value)} className={entrada}>
                  {INDICES_DE_REAJUSTE.map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
              </label>
              <label className={campo}>
                Garantia
                <select value={garantia} onChange={(e) => setGarantia(e.target.value)} className={entrada}>
                  {GARANTIAS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </label>
              <label className={campo}>
                Taxa de administração (%)
                <input type="text" inputMode="decimal" value={taxaAtual} onChange={(e) => setTaxa(e.target.value)} className={entrada} />
                <span className="text-[12px] font-normal text-muted">Sugestão: taxa do locador, depois do locatário, depois 10%. Pode ser alterada.</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPasso(3)} className="min-h-11 rounded-[10px] border border-[#A9B4C6] px-4 text-navy">
                Voltar
              </button>
              <button type="button" disabled={!aluguel.trim() || !inicio} onClick={() => setPasso(5)} className="min-h-11 rounded-[10px] bg-navy px-5 font-bold text-white disabled:opacity-50">
                Próximo
              </button>
            </div>
          </div>
        ) : null}

        {passo === 5 ? (
          <div className="flex flex-col gap-3">
            <h3 className="text-[16px] font-bold text-navy">5. Revisão</h3>
            <dl className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2 rounded-[12px] bg-bg p-4">
              <dt className="text-muted">Locador</dt>
              <dd>{locador?.nome}</dd>
              <dt className="text-muted">Imóvel</dt>
              <dd>{[imovel?.codigo, imovel?.tipo, imovel?.endereco].filter(Boolean).join(" · ")}</dd>
              <dt className="text-muted">Locatário</dt>
              <dd>{nomeLocatario}</dd>
              <dt className="text-muted">Aluguel</dt>
              <dd>{aluguel ? `R$ ${aluguel}` : "—"}</dd>
              <dt className="text-muted">Vencimento</dt>
              <dd>todo dia {dia}</dd>
              <dt className="text-muted">Período</dt>
              <dd>
                {inicio} {fim ? `até ${fim}` : "(sem data de fim)"}
              </dd>
              <dt className="text-muted">Reajuste e garantia</dt>
              <dd>
                {indice} · {garantia}
              </dd>
              <dt className="text-muted">Taxa</dt>
              <dd>{taxaAtual}%</dd>
            </dl>
            {renovacao ? <p className="text-muted">O contrato anterior deste locatário neste imóvel será encerrado em {inicio}.</p> : null}
            {estado?.erro ? (
              <p role="alert" className="rounded-[10px] bg-[#FBEDED] p-3.5 font-semibold text-[#8A1C1C]">
                {estado.erro}
              </p>
            ) : null}
            {estado?.erros
              ? Object.values(estado.erros)
                  .filter(Boolean)
                  .map((m) => (
                    <p key={m} className="text-[#8A1C1C]">
                      {m}
                    </p>
                  ))
              : null}
            <div className="flex gap-2">
              <button type="button" onClick={() => setPasso(4)} className="min-h-11 rounded-[10px] border border-[#A9B4C6] px-4 text-navy">
                Voltar
              </button>
              <button type="submit" disabled={enviando || bloqueado} className="min-h-11 rounded-[10px] bg-navy px-5 font-bold text-white disabled:opacity-50">
                {enviando ? "Salvando..." : "Salvar contrato"}
              </button>
            </div>
          </div>
        ) : null}
      </form>
    </section>
  );
}
