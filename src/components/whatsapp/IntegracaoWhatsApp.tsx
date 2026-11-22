"use client";

import { useState } from "react";
import { AUTOMACOES, MODELOS_MENSAGEM, PROVEDORES, validarConexao, type ProvedorWhatsApp } from "@/lib/whatsapp-regras";

// Tela Integração WhatsApp (layout do design WhatsApp.dc.html). Nesta fatia não envia nem guarda nada.

type Aba = "Conexão" | "Modelos de mensagem" | "Automações";
const ABAS: Aba[] = ["Conexão", "Modelos de mensagem", "Automações"];

const ESTILO_CAMPO = "min-h-11 rounded-[10px] border border-[#A9B4C6] bg-white px-3";

export function IntegracaoWhatsApp() {
  const [aba, setAba] = useState<Aba>("Conexão");
  const [provedor, setProvedor] = useState<ProvedorWhatsApp>("meta");
  const [numero, setNumero] = useState("");
  const [nomeExibido, setNomeExibido] = useState("Soluções Imobiliárias");
  const [idNumero, setIdNumero] = useState("");
  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [automacoes, setAutomacoes] = useState<Record<string, boolean>>(() => Object.fromEntries(AUTOMACOES.map((a) => [a.chave, a.padrao])));

  function conectar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setAviso(null);
    const r = validarConexao({ provedor, numero, nomeExibido, idNumero, token, url });
    setToken(""); // o token não fica no estado depois do envio
    if (!r.ok) {
      const primeiro = Object.values(r.erros)[0] as string;
      setErro(primeiro);
      return;
    }
    setErro(null);
    setAviso("Dados conferidos. A conexão ainda não foi ligada nesta versão: nada foi enviado nem salvo.");
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="m-0 text-muted">Envio automático de boletos, notas, relatórios e avisos</p>
          <h1 className="m-0 text-[32px] font-extrabold leading-tight text-navy">Integração WhatsApp</h1>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-[#F0F3FA] px-3.5 py-1.5 font-bold text-muted">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#A9B4C6]" />
          Não conectado
        </span>
      </header>

      <div role="tablist" className="flex flex-wrap gap-1 border-b border-[#D8DEE9]">
        {ABAS.map((nome) => {
          const on = nome === aba;
          return (
            <button
              key={nome}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setAba(nome)}
              className={`min-h-11 border-0 border-b-[3px] bg-transparent px-4 text-[14px] text-[#0E1B33] ${on ? "border-[#D4A853] font-bold" : "border-transparent font-medium"}`}
            >
              {nome}
            </button>
          );
        })}
      </div>

      {aba === "Conexão" && (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
            {PROVEDORES.map((p) => {
              const on = provedor === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setProvedor(p.id);
                    setErro(null);
                    setAviso(null);
                  }}
                  className={`flex flex-col gap-1.5 rounded-2xl bg-white p-[18px] text-left text-[#0E1B33] ${on ? "border-2 border-[#128C4A]" : "border-2 border-[#E8ECF3]"}`}
                >
                  <strong className="text-[16px] text-navy">{p.nome}</strong>
                  <span>{p.descricao}</span>
                  <span className={`font-semibold ${p.recomendado ? "text-[#17694A]" : "text-[#8A1C1C]"}`}>{p.aviso}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={conectar} noValidate className="flex flex-col gap-3.5 rounded-2xl border border-[#E8ECF3] bg-white p-5 shadow-sm">
            <h2 className="m-0 text-[18px] font-bold text-navy">Número da imobiliária</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-3">
              <label className="flex flex-col gap-1 font-semibold">
                Número (com DDD)
                <input type="tel" inputMode="tel" placeholder="(27) 99999-9999" value={numero} onChange={(e) => setNumero(e.target.value)} className={ESTILO_CAMPO} />
              </label>
              <label className="flex flex-col gap-1 font-semibold">
                Nome exibido
                <input type="text" value={nomeExibido} onChange={(e) => setNomeExibido(e.target.value)} className={ESTILO_CAMPO} />
              </label>
              {provedor === "meta" ? (
                <>
                  <label className="flex flex-col gap-1 font-semibold">
                    ID do número na Meta
                    <input type="text" autoComplete="off" value={idNumero} onChange={(e) => setIdNumero(e.target.value)} className={ESTILO_CAMPO} />
                  </label>
                  <label className="flex flex-col gap-1 font-semibold">
                    Token de acesso
                    <input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} className={ESTILO_CAMPO} />
                  </label>
                </>
              ) : (
                <>
                  <label className="flex flex-col gap-1 font-semibold">
                    URL do servidor
                    <input type="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} className={ESTILO_CAMPO} />
                  </label>
                  <label className="flex flex-col gap-1 font-semibold">
                    Chave da API
                    <input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} className={ESTILO_CAMPO} />
                  </label>
                </>
              )}
            </div>
            <p className="m-0 rounded-xl bg-[#FBF3D9] px-3.5 py-3 text-[#7A4A00]">
              Protótipo: nada é enviado nem guardado. Não digite tokens reais aqui. No sistema, eles ficam só no servidor.
            </p>
            {erro && (
              <p role="alert" className="m-0 font-semibold text-[#8A1C1C]">
                {erro}
              </p>
            )}
            {aviso && <p className="m-0 font-semibold text-[#17533B]">{aviso}</p>}
            <div>
              <button type="submit" className="min-h-11 rounded-[10px] bg-[#128C4A] px-[18px] font-bold text-white">
                Conectar número
              </button>
            </div>
          </form>
        </>
      )}

      {aba === "Modelos de mensagem" && (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-4">
            {MODELOS_MENSAGEM.map((m) => {
              const cor = m.status === "Aprovado" ? ["#DDF0E7", "#17533B"] : m.status === "Em análise" ? ["#FBF3D9", "#7A4A00"] : ["#F0F3FA", "#4F5B72"];
              return (
                <section key={m.nome} className="flex flex-col gap-2 rounded-2xl border border-[#E8ECF3] bg-white p-[18px] shadow-sm">
                  <div className="flex justify-between gap-2">
                    <h2 className="m-0 text-[16px] font-bold text-navy">{m.nome}</h2>
                    <span className="rounded-full px-2.5 py-0.5 text-[12px] font-bold" style={{ background: cor[0], color: cor[1] }}>
                      {m.status}
                    </span>
                  </div>
                  <p className="m-0 rounded-[4px_12px_12px_12px] bg-[#E7F6EC] p-3">{m.texto}</p>
                  <span className="text-[12px] text-muted">Categoria na Meta: {m.categoria}</span>
                </section>
              );
            })}
          </div>
          <p className="m-0 rounded-xl bg-[#FBF3D9] px-3.5 py-3 text-[#7A4A00]">
            Na API oficial, mensagens enviadas fora de uma conversa aberta pelo cliente precisam usar modelos aprovados pela Meta, e podem ser cobradas por mensagem.
          </p>
        </>
      )}

      {aba === "Automações" && (
        <>
          <section className="flex flex-col rounded-2xl border border-[#E8ECF3] bg-white px-5 py-2 shadow-sm">
            {AUTOMACOES.map((a) => (
              <label key={a.chave} className="flex min-h-[60px] items-center justify-between gap-4 border-b border-[#F0F3FA] last:border-0">
                <span>
                  <strong className="block">{a.nome}</strong>
                  <span className="text-muted">{a.descricao}</span>
                </span>
                <input
                  type="checkbox"
                  checked={automacoes[a.chave]}
                  onChange={() => setAutomacoes((atual) => ({ ...atual, [a.chave]: !atual[a.chave] }))}
                  className="h-[22px] w-[22px] flex-none accent-[#128C4A]"
                />
              </label>
            ))}
          </section>
          <p className="m-0 rounded-xl bg-[#FBF3D9] px-3.5 py-3 text-[#7A4A00]">
            Só envie para quem autorizou receber mensagens no WhatsApp. Guarde a data e a forma dessa autorização no cadastro, e respeite quem pedir para sair.
          </p>
          <p className="m-0 text-[13px] text-muted">Estas escolhas ainda não são salvas nesta versão.</p>
        </>
      )}
    </div>
  );
}
