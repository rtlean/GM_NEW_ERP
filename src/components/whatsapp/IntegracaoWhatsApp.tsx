"use client";

import { useState, useTransition } from "react";
import { testarConexaoWhatsAppAction } from "@/app/whatsapp/actions";
import { AUTOMACOES, MODELOS_MENSAGEM } from "@/lib/whatsapp-regras";
import type { ResultadoConexao } from "@/lib/whatsapp";

// Tela Integração WhatsApp (layout do design WhatsApp.dc.html). Token e ID ficam no servidor, não aqui.

type Aba = "Conexão" | "Modelos de mensagem" | "Automações";
const ABAS: Aba[] = ["Conexão", "Modelos de mensagem", "Automações"];

export function IntegracaoWhatsApp({ configurado }: { configurado: { token: boolean; phoneId: boolean } }) {
  const [aba, setAba] = useState<Aba>("Conexão");
  const [resultado, setResultado] = useState<ResultadoConexao | null>(null);
  const [testando, iniciarTeste] = useTransition();
  const [automacoes, setAutomacoes] = useState<Record<string, boolean>>(() => Object.fromEntries(AUTOMACOES.map((a) => [a.chave, a.padrao])));

  const conectado = resultado?.ok === true;
  const completo = configurado.token && configurado.phoneId;

  function testar() {
    iniciarTeste(async () => {
      setResultado(await testarConexaoWhatsAppAction());
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="m-0 text-muted">Envio automático de boletos, notas, relatórios e avisos</p>
          <h1 className="m-0 text-[32px] font-extrabold leading-tight text-navy">Integração WhatsApp</h1>
        </div>
        <span className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 font-bold ${conectado ? "bg-[#DDF0E7] text-[#17533B]" : "bg-[#F0F3FA] text-muted"}`}>
          <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${conectado ? "bg-[#25D366]" : "bg-[#A9B4C6]"}`} />
          {conectado ? "Conectado" : "Não conectado"}
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
          <section className="flex flex-col gap-1.5 rounded-2xl border-2 border-[#128C4A] bg-white p-[18px]">
            <strong className="text-[16px] text-navy">API oficial do WhatsApp (Meta)</strong>
            <span>Pela Meta ou por um provedor oficial. Exige verificação da empresa e modelos aprovados.</span>
            <span className="font-semibold text-[#17694A]">Recomendado: menor risco de bloqueio</span>
          </section>

          <section className="flex flex-col gap-3.5 rounded-2xl border border-[#E8ECF3] bg-white p-5 shadow-sm">
            <h2 className="m-0 text-[18px] font-bold text-navy">Dados de acesso</h2>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              <li className="flex justify-between gap-3">
                <span>Token de acesso</span>
                <span className={`font-semibold ${configurado.token ? "text-[#17533B]" : "text-[#8A1C1C]"}`}>{configurado.token ? "Configurado no servidor" : "Não configurado"}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span>ID do número na Meta</span>
                <span className={`font-semibold ${configurado.phoneId ? "text-[#17533B]" : "text-[#8A1C1C]"}`}>{configurado.phoneId ? "Configurado no servidor" : "Não configurado"}</span>
              </li>
            </ul>
            <p className="m-0 rounded-xl bg-[#FBF3D9] px-3.5 py-3 text-[#7A4A00]">
              O token e o ID ficam guardados no servidor, fora do banco de dados e desta tela. Quem configura é o responsável técnico.
            </p>

            {resultado && (
              <p role="alert" className={`m-0 font-semibold ${resultado.ok ? "text-[#17533B]" : "text-[#8A1C1C]"}`}>
                {resultado.ok ? `Conexão confirmada: ${resultado.nome} (${resultado.numero}). Nenhuma mensagem foi enviada.` : resultado.erro}
              </p>
            )}

            <div>
              <button
                type="button"
                onClick={testar}
                disabled={!completo || testando}
                className="min-h-11 rounded-[10px] bg-[#128C4A] px-[18px] font-bold text-white disabled:opacity-50"
              >
                {testando ? "Testando..." : "Testar conexão"}
              </button>
              {!completo && <p className="m-0 mt-2 text-muted">Configure o token e o ID do número no servidor para testar.</p>}
            </div>
          </section>
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
          <p className="m-0 text-[13px] text-muted">Estas escolhas ainda não são salvas, e os envios automáticos ainda não estão ligados.</p>
        </>
      )}
    </div>
  );
}
