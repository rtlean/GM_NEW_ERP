"use client";

import { useMemo, useState } from "react";

// Passos 1 a 3 do assistente de novo contrato (US-3.5a). Só escolhe: ainda não grava nada.
// Passo 4 (condições) e 5 (gravar) entram na US-3.5b.

export type OpcaoLocador = { id: number; nome: string };
export type OpcaoImovel = { id: number; codigo: string | null; tipo: string | null; endereco: string | null; ownerId: number | null; ocupadoPor: string | null };
export type OpcaoLocatario = { id: number; nome: string };

const chip = (ativo: boolean) =>
  `min-h-11 rounded-[10px] border px-3 text-left text-[13px] font-medium ${ativo ? "border-navy bg-navy text-white" : "border-[#D8DEE9] bg-white text-navy"}`;

export function AssistenteNovoContrato({
  locadores,
  imoveis,
  locatarios,
}: {
  locadores: OpcaoLocador[];
  imoveis: OpcaoImovel[];
  locatarios: OpcaoLocatario[];
}) {
  const [passo, setPasso] = useState<1 | 2 | 3>(1);
  const [buscaLocador, setBuscaLocador] = useState("");
  const [buscaLocatario, setBuscaLocatario] = useState("");
  const [locadorId, setLocadorId] = useState<number | null>(null);
  const [imovelId, setImovelId] = useState<number | null>(null);
  const [locatarioId, setLocatarioId] = useState<number | null>(null);

  const locadoresFiltrados = useMemo(() => {
    const t = buscaLocador.trim().toLowerCase();
    return locadores.filter((l) => !t || l.nome.toLowerCase().includes(t)).slice(0, 12);
  }, [locadores, buscaLocador]);

  const imoveisDoLocador = imoveis.filter((i) => i.ownerId === locadorId);
  const imovel = imoveis.find((i) => i.id === imovelId) ?? null;
  const locatarioEscolhido = locatarios.find((l) => l.id === locatarioId) ?? null;
  const locadorEscolhido = locadores.find((l) => l.id === locadorId) ?? null;

  const locatariosFiltrados = useMemo(() => {
    const t = buscaLocatario.trim().toLowerCase();
    return locatarios.filter((l) => !t || l.nome.toLowerCase().includes(t)).slice(0, 12);
  }, [locatarios, buscaLocatario]);

  // Imóvel alugado para outro locatário: a regra de bloqueio é aplicada na gravação (US-3.5b).
  const avisoImovel =
    imovel?.ocupadoPor && locatarioEscolhido && imovel.ocupadoPor !== locatarioEscolhido.nome
      ? `Este imóvel está alugado para ${imovel.ocupadoPor}. Encerre o contrato atual antes de alugar para outro locatário.`
      : imovel?.ocupadoPor && locatarioEscolhido
        ? "Renovação: o imóvel já está com este locatário. O contrato anterior será encerrado na data de início do novo."
        : imovel?.ocupadoPor
          ? `Este imóvel está alugado para ${imovel.ocupadoPor}.`
          : null;

  return (
    <section aria-label="Novo contrato" className="flex flex-col gap-4 rounded-2xl border-2 border-gold bg-white p-5">
      <h2 className="text-[20px] font-extrabold text-navy">Novo contrato</h2>
      <ol className="flex flex-wrap gap-2 text-[13px] font-semibold text-muted" aria-label="Passos">
        {["Locador", "Imóvel", "Locatário", "Condições", "Revisão"].map((nome, i) => (
          <li key={nome} aria-current={passo === i + 1 ? "step" : undefined} className={passo === i + 1 ? "text-navy" : ""}>
            {i + 1}. {nome}
          </li>
        ))}
      </ol>

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
            <button
              type="button"
              disabled={locadorId === null}
              onClick={() => setPasso(2)}
              className="min-h-11 rounded-[10px] bg-navy px-5 font-bold text-white disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
        </div>
      ) : null}

      {passo === 2 ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-[16px] font-bold text-navy">2. Imóvel de {locadorEscolhido?.nome}</h3>
          <div className="flex flex-wrap gap-1.5">
            {imoveisDoLocador.length === 0 ? <p className="text-muted">Este locador não tem imóveis cadastrados.</p> : null}
            {imoveisDoLocador.map((i) => (
              <button key={i.id} type="button" aria-pressed={imovelId === i.id} onClick={() => setImovelId(i.id)} className={chip(imovelId === i.id)}>
                {[i.codigo, i.tipo, i.endereco].filter(Boolean).join(" · ")}
                {i.ocupadoPor ? ` · alugado para ${i.ocupadoPor}` : " · vago"}
              </button>
            ))}
          </div>
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
          </div>
          {avisoImovel ? (
            <p role="status" className="rounded-[10px] bg-[#FBF3D9] p-3.5 font-semibold text-[#7A4A00]">
              {avisoImovel}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button type="button" onClick={() => setPasso(2)} className="min-h-11 rounded-[10px] border border-[#A9B4C6] px-4 text-navy">
              Voltar
            </button>
            <button type="button" disabled={locatarioId === null} onClick={() => undefined} className="min-h-11 rounded-[10px] bg-navy px-5 font-bold text-white disabled:opacity-50">
              Próximo
            </button>
          </div>
          <p className="text-muted">Condições (aluguel, vencimento, datas e garantia) chegam na próxima entrega.</p>
        </div>
      ) : null}
    </section>
  );
}
