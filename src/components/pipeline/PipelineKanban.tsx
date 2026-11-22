"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { criarLeadAction, editarNegocioAction, moverNegocioAction, type EstadoEdicao, type EstadoNovoLead } from "@/app/pipeline/actions";
import { formatarReais } from "@/lib/dinheiro";
import { ETAPAS, ETAPA_FRIA, ORIGENS_LEAD, etapaVizinha, filtrarPorBusca, resumoPipeline, type Etapa, type TipoNegocio } from "@/lib/pipeline-regras";
import type { Negocio } from "@/lib/pipeline";

// Kanban do Pipeline (US-P.1), layout do design Pipeline.dc.html. Sem comissão e sem corretor (decisão do dono, 21/11/2026).

type Aviso = { mensagem: string; desfazer?: { id: number; para: Etapa } };

export function PipelineKanban({ negocios }: { negocios: Negocio[] }) {
  const [busca, setBusca] = useState("");
  const [novoAberto, setNovoAberto] = useState(false);
  const [selecionadoId, setSelecionadoId] = useState<number | null>(null);
  const [arrastandoId, setArrastandoId] = useState<number | null>(null);
  const [etapaSobre, setEtapaSobre] = useState<Etapa | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [, iniciarMovimento] = useTransition();

  const visiveis = filtrarPorBusca(negocios, busca);
  const resumo = resumoPipeline(visiveis);
  const selecionado = negocios.find((n) => n.id === selecionadoId) ?? null;

  function mover(id: number, para: Etapa, anterior?: Aviso) {
    const atual = negocios.find((n) => n.id === id);
    if (!atual || atual.etapa === para) return;
    iniciarMovimento(async () => {
      const r = await moverNegocioAction(id, para);
      if (r.erro) {
        setErroGeral(r.erro);
        return;
      }
      setErroGeral(null);
      setAviso(anterior ?? { mensagem: `${atual.nome} movido para ${para}`, desfazer: { id, para: atual.etapa } });
    });
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-navy">Pipeline</h1>
          <p className="tabular-nums text-muted">
            {resumo.quantidade} {resumo.quantidade === 1 ? "negócio" : "negócios"} · {formatarReais(resumo.totalCentavos)} em valor
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNovoAberto(true)}
          className="min-h-11 rounded-[10px] bg-navy px-[18px] text-[14px] font-bold text-white"
        >
          Novo lead
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          aria-label="Buscar por cliente ou imóvel"
          placeholder="Buscar cliente ou imóvel"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="min-h-11 max-w-[360px] flex-[1_1_240px] rounded-[10px] border border-[#D8DEE9] bg-white px-3.5"
        />
      </div>

      {novoAberto && (
        <NovoLeadForm
          aoSalvar={(nome) => {
            setNovoAberto(false);
            setErroGeral(null);
            setAviso({ mensagem: `${nome} adicionado à Prospecção` });
          }}
          aoCancelar={() => setNovoAberto(false)}
        />
      )}

      {erroGeral && (
        <p role="alert" className="rounded-[10px] bg-[#FBE9E9] px-4 py-2 text-[#A32020]">
          {erroGeral}
        </p>
      )}

      <div className="-mx-7 overflow-x-auto px-7 pb-3 pt-1">
        <div className="grid grid-cols-[repeat(5,minmax(270px,1fr))] items-start gap-3.5">
          {ETAPAS.map((etapa) => {
            const cartoes = visiveis.filter((n) => n.etapa === etapa);
            const total = resumoPipeline(cartoes).totalCentavos;
            const fria = etapa === ETAPA_FRIA;
            const sobre = etapaSobre === etapa;
            return (
              <section
                key={etapa}
                aria-label={etapa}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (etapaSobre !== etapa) setEtapaSobre(etapa);
                }}
                onDragLeave={() => setEtapaSobre((s) => (s === etapa ? null : s))}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = Number(e.dataTransfer.getData("text/plain")) || arrastandoId;
                  setEtapaSobre(null);
                  setArrastandoId(null);
                  if (id) mover(id, etapa);
                }}
                className={`flex min-h-[520px] flex-col gap-2.5 rounded-[18px] border-2 border-dashed p-3 ${sobre ? "border-gold bg-[#FBF3D9]" : "border-transparent bg-[#EEF1F8]"}`}
              >
                <div className="px-1 pb-1.5 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[16px] font-bold text-navy">{etapa}</h2>
                    <span
                      className={`flex h-[26px] min-w-[26px] items-center justify-center rounded-full px-1.5 font-bold ${fria ? "bg-muted text-white" : "bg-navy text-white"}`}
                    >
                      {cartoes.length}
                    </span>
                  </div>
                  <div className="tabular-nums text-muted">{formatarReais(total)}</div>
                </div>

                {cartoes.map((n) => {
                  const anterior = etapaVizinha(n.etapa, -1);
                  const proxima = etapaVizinha(n.etapa, 1);
                  return (
                    <article
                      key={n.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", String(n.id));
                        e.dataTransfer.effectAllowed = "move";
                        setArrastandoId(n.id);
                      }}
                      onDragEnd={() => {
                        setArrastandoId(null);
                        setEtapaSobre(null);
                      }}
                      className={`flex cursor-grab flex-col gap-2 rounded-[14px] bg-white p-3.5 shadow-[0_1px_2px_rgba(0,35,86,0.06),0_4px_12px_rgba(0,35,86,0.06)] ${arrastandoId === n.id ? "opacity-45" : ""}`}
                    >
                      <span
                        className={`w-fit rounded-full px-2.5 py-0.5 text-[12px] font-bold text-navy ${n.tipo === "Venda" ? "bg-[#F4E6C2]" : "bg-[#E8EDF6]"}`}
                      >
                        {n.tipo}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelecionadoId(n.id)}
                        className="text-left text-[15px] font-bold leading-snug text-navy underline decoration-transparent hover:decoration-navy"
                      >
                        {n.nome}
                      </button>
                      <div className="text-muted">{n.imovel ?? "Imóvel a definir"}</div>
                      <div className="flex justify-between gap-2 tabular-nums">
                        <span>{n.tipo === "Venda" ? formatarReais(n.valorCentavos) : `${formatarReais(n.valorCentavos)}/mês`}</span>
                      </div>
                      {n.proximoPasso && (
                        <div
                          className={`rounded-lg px-2.5 py-1.5 text-[13px] font-medium ${n.urgente ? "bg-[#FBF3D9] text-[#7A4A00]" : "bg-[#F4F6FA] text-muted"}`}
                        >
                          {n.proximoPasso}
                        </div>
                      )}
                      <div className="flex justify-between gap-2">
                        <button
                          type="button"
                          aria-label={`Voltar ${n.nome} uma etapa`}
                          disabled={!anterior}
                          onClick={() => anterior && mover(n.id, anterior)}
                          className="flex min-h-10 flex-[0_0_44px] items-center justify-center rounded-[10px] border border-[#D8DEE9] bg-white text-navy disabled:opacity-40"
                        >
                          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 3 5 8l5 5" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          disabled={!proxima}
                          onClick={() => proxima && mover(n.id, proxima)}
                          className="min-h-10 flex-[1_1_auto] rounded-[10px] border border-[#D8DEE9] bg-white text-[13px] font-semibold text-navy disabled:opacity-40"
                        >
                          {proxima ? `Mover para ${proxima}` : "Última etapa"}
                        </button>
                      </div>
                    </article>
                  );
                })}

                {cartoes.length === 0 && <p className="px-3 py-7 text-center text-muted">Arraste um negócio para cá</p>}
              </section>
            );
          })}
        </div>
      </div>

      {aviso && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-40 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-3.5 rounded-xl bg-[#0E1B33] py-1.5 pl-[18px] pr-2 text-white shadow-[0_12px_32px_rgba(0,35,86,0.3)]"
        >
          <span>{aviso.mensagem}</span>
          {aviso.desfazer && (
            <button
              type="button"
              onClick={() => {
                const { id, para } = aviso.desfazer!;
                setAviso(null);
                mover(id, para, { mensagem: "Movimento desfeito" });
              }}
              className="min-h-11 rounded-lg px-3 font-bold text-[#E9D29E]"
            >
              Desfazer
            </button>
          )}
        </div>
      )}

      {selecionado && (
        <DetalhesNegocio
          negocio={selecionado}
          aoFechar={() => setSelecionadoId(null)}
          aoMudarEtapa={(etapa) => mover(selecionado.id, etapa)}
          aoEditado={(nome) => setAviso({ mensagem: `${nome} atualizado` })}
        />
      )}
    </div>
  );
}

function NovoLeadForm({ aoSalvar, aoCancelar }: { aoSalvar: (nome: string) => void; aoCancelar: () => void }) {
  const [estado, acao, enviando] = useActionState<EstadoNovoLead, FormData>(criarLeadAction, undefined);
  const [tipo, setTipo] = useState<"Locação" | "Venda">("Locação");

  useEffect(() => {
    if (estado?.ok) aoSalvar(estado.nome);
  }, [estado, aoSalvar]);

  const erros = estado && !estado.ok ? estado.erros ?? {} : {};
  const erroGeral = estado && !estado.ok ? estado.erroGeral : undefined;

  return (
    <form
      action={acao}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4 shadow-[0_8px_24px_rgba(0,35,86,0.06)]"
    >
      <Campo rotulo="Cliente" erro={erros.nome} className="flex-[2_1_200px]">
        <input name="nome" required className="min-h-11 rounded-[10px] border border-[#A9B4C6] px-3" />
      </Campo>
      <Campo rotulo="Negócio" erro={erros.tipo} className="flex-[1_1_130px]">
        <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as "Locação" | "Venda")} className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3">
          <option>Locação</option>
          <option>Venda</option>
        </select>
      </Campo>
      <Campo rotulo={tipo === "Venda" ? "Valor do imóvel (R$)" : "Aluguel (R$)"} erro={erros.valor} className="flex-[1_1_150px]">
        <input name="valor" type="number" min="0.01" step="0.01" required className="min-h-11 rounded-[10px] border border-[#A9B4C6] px-3" />
      </Campo>
      <Campo rotulo="Imóvel (opcional)" erro={erros.imovel} className="flex-[2_1_200px]">
        <input name="imovel" className="min-h-11 rounded-[10px] border border-[#A9B4C6] px-3" />
      </Campo>
      <Campo rotulo="Telefone / WhatsApp" erro={erros.telefone} className="flex-[1_1_180px]">
        <input name="telefone" type="tel" inputMode="tel" placeholder="(27) 99999-8888" required className="min-h-11 rounded-[10px] border border-[#A9B4C6] px-3" />
      </Campo>
      <Campo rotulo="E-mail (opcional)" erro={erros.email} className="flex-[1_1_200px]">
        <input name="email" type="email" className="min-h-11 rounded-[10px] border border-[#A9B4C6] px-3" />
      </Campo>
      <Campo rotulo="Origem (opcional)" erro={erros.origem} className="flex-[1_1_150px]">
        <select name="origem" defaultValue="" className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3">
          <option value="">Não informado</option>
          {ORIGENS_LEAD.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </Campo>
      <Campo rotulo="Cidade (opcional)" erro={erros.cidade} className="flex-[1_1_180px]">
        <input name="cidade" className="min-h-11 rounded-[10px] border border-[#A9B4C6] px-3" />
      </Campo>
      <button type="submit" disabled={enviando} className="min-h-11 rounded-[10px] bg-navy px-[18px] font-bold text-white disabled:opacity-50">
        Adicionar à Prospecção
      </button>
      <button type="button" onClick={aoCancelar} className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3.5 font-medium text-navy">
        Cancelar
      </button>
      {erroGeral && (
        <p role="alert" className="w-full text-[#A32020]">
          {erroGeral}
        </p>
      )}
    </form>
  );
}

function Campo({ rotulo, erro, className, children }: { rotulo: string; erro?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1 font-semibold ${className ?? ""}`}>
      {rotulo}
      {children}
      {erro && <span className="text-[13px] font-medium text-[#A32020]">{erro}</span>}
    </label>
  );
}

function DetalhesNegocio({
  negocio,
  aoFechar,
  aoMudarEtapa,
  aoEditado,
}: {
  negocio: Negocio;
  aoFechar: () => void;
  aoMudarEtapa: (etapa: Etapa) => void;
  aoEditado: (nome: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  return (
    <>
      <button type="button" aria-label="Fechar detalhes" onClick={aoFechar} className="fixed inset-0 z-[45] cursor-default border-0 bg-[rgba(14,27,51,0.35)]" />
      <aside
        aria-label="Detalhes do negócio"
        className="fixed bottom-0 right-0 top-0 z-50 flex w-[min(420px,100%)] flex-col gap-[18px] overflow-y-auto bg-white p-6 shadow-[-12px_0_40px_rgba(0,35,86,0.2)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-muted">{negocio.tipo}</div>
            <h2 className="text-[24px] font-extrabold leading-tight text-navy">{negocio.nome}</h2>
          </div>
          <button type="button" aria-label="Fechar" onClick={aoFechar} className="flex h-11 w-11 flex-none items-center justify-center rounded-[10px] border border-[#D8DEE9] bg-white text-navy">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m3 3 10 10M13 3 3 13" />
            </svg>
          </button>
        </div>

        {editando ? (
          <EditarNegocioForm
            negocio={negocio}
            aoSalvo={() => {
              setEditando(false);
              aoEditado(negocio.nome);
            }}
            aoCancelar={() => setEditando(false)}
          />
        ) : (
          <>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <dt className="text-muted">Imóvel</dt>
              <dd>{negocio.imovel ?? "Imóvel a definir"}</dd>
              <dt className="text-muted">Valor</dt>
              <dd className="tabular-nums">{negocio.tipo === "Venda" ? formatarReais(negocio.valorCentavos) : `${formatarReais(negocio.valorCentavos)}/mês`}</dd>
              <dt className="text-muted">Telefone</dt>
              <dd>{negocio.telefone ?? "—"}</dd>
              <dt className="text-muted">E-mail</dt>
              <dd>{negocio.email ?? "—"}</dd>
              <dt className="text-muted">Origem</dt>
              <dd>{negocio.origem ?? "—"}</dd>
              <dt className="text-muted">Cidade</dt>
              <dd>{negocio.cidade ?? "—"}</dd>
              <dt className="text-muted">Próximo passo</dt>
              <dd>{negocio.proximoPasso ?? "—"}</dd>
            </dl>
            <label className="flex flex-col gap-1 font-semibold">
              Etapa
              <select
                value={negocio.etapa}
                onChange={(e) => aoMudarEtapa(e.target.value as Etapa)}
                className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3"
              >
                {ETAPAS.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-4 font-semibold text-navy"
            >
              Editar dados
            </button>
          </>
        )}
      </aside>
    </>
  );
}

function EditarNegocioForm({ negocio, aoSalvo, aoCancelar }: { negocio: Negocio; aoSalvo: () => void; aoCancelar: () => void }) {
  const [estado, acao, enviando] = useActionState<EstadoEdicao, FormData>(editarNegocioAction, undefined);
  const [tipo, setTipo] = useState<TipoNegocio>(negocio.tipo);

  useEffect(() => {
    if (estado?.ok) aoSalvo();
  }, [estado, aoSalvo]);

  const erros = estado && !estado.ok ? estado.erros ?? {} : {};
  const erroGeral = estado && !estado.ok ? estado.erroGeral : undefined;

  return (
    <form action={acao} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={negocio.id} />
      <Campo rotulo="Cliente" erro={erros.nome}>
        <input name="nome" defaultValue={negocio.nome} required className="min-h-11 rounded-[10px] border border-[#A9B4C6] px-3" />
      </Campo>
      <Campo rotulo="Negócio" erro={erros.tipo}>
        <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoNegocio)} className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3">
          <option>Locação</option>
          <option>Venda</option>
        </select>
      </Campo>
      <Campo rotulo={tipo === "Venda" ? "Valor do imóvel (R$)" : "Aluguel (R$)"} erro={erros.valor}>
        <input name="valor" type="number" min="0.01" step="0.01" defaultValue={(negocio.valorCentavos / 100).toFixed(2)} required className="min-h-11 rounded-[10px] border border-[#A9B4C6] px-3" />
      </Campo>
      <Campo rotulo="Imóvel (opcional)" erro={erros.imovel}>
        <input name="imovel" defaultValue={negocio.imovel ?? ""} className="min-h-11 rounded-[10px] border border-[#A9B4C6] px-3" />
      </Campo>
      <Campo rotulo="Telefone / WhatsApp" erro={erros.telefone}>
        <input name="telefone" type="tel" inputMode="tel" defaultValue={negocio.telefone ?? ""} required className="min-h-11 rounded-[10px] border border-[#A9B4C6] px-3" />
      </Campo>
      <Campo rotulo="E-mail (opcional)" erro={erros.email}>
        <input name="email" type="email" defaultValue={negocio.email ?? ""} className="min-h-11 rounded-[10px] border border-[#A9B4C6] px-3" />
      </Campo>
      <Campo rotulo="Origem (opcional)" erro={erros.origem}>
        <select name="origem" defaultValue={negocio.origem ?? ""} className="min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3">
          <option value="">Não informado</option>
          {ORIGENS_LEAD.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </Campo>
      <Campo rotulo="Cidade (opcional)" erro={erros.cidade}>
        <input name="cidade" defaultValue={negocio.cidade ?? ""} className="min-h-11 rounded-[10px] border border-[#A9B4C6] px-3" />
      </Campo>
      <Campo rotulo="Próximo passo (opcional)" erro={erros.proximoPasso}>
        <input name="proximoPasso" defaultValue={negocio.proximoPasso ?? ""} className="min-h-11 rounded-[10px] border border-[#A9B4C6] px-3" />
      </Campo>
      <label className="flex items-center gap-2 font-semibold">
        <input name="urgente" type="checkbox" defaultChecked={negocio.urgente} className="h-5 w-5" />
        Urgente
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={enviando} className="min-h-11 flex-[1_1_150px] rounded-[10px] bg-navy px-4 font-bold text-white disabled:opacity-50">
          Salvar alterações
        </button>
        <button type="button" onClick={aoCancelar} className="min-h-11 flex-[1_1_120px] rounded-[10px] border border-[#A9B4C6] bg-white px-4 font-medium text-navy">
          Cancelar
        </button>
      </div>
      {erroGeral && (
        <p role="alert" className="text-[#A32020]">
          {erroGeral}
        </p>
      )}
    </form>
  );
}
