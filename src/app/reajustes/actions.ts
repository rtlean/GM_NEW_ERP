"use server";

import { redirect } from "next/navigation";
import { exigirAcesso, idUsuarioAtual } from "@/lib/acesso";
import { aplicarReajuste } from "@/lib/reajustes";
import { gerarAditivoReajuste } from "@/lib/aditivo-reajuste";
import { hojeSaoPaulo } from "@/lib/contratos-encerrar-regras";

/** Agenda o reajuste do contrato no próximo aniversário (US-4.6). */
export async function aplicarReajusteAction(formData: FormData): Promise<void> {
  await exigirAcesso("reajustes");

  const contratoId = Number(formData.get("contratoId"));
  const entrada = { percentual: String(formData.get("percentual") ?? ""), indice: String(formData.get("indice") ?? "") };

  let mensagem: string;
  let ok = false;
  const usuarioId = await idUsuarioAtual();
  if (!Number.isInteger(contratoId) || contratoId <= 0) {
    mensagem = "Contrato inválido.";
  } else if (!usuarioId) {
    mensagem = "Sua sessão expirou. Entre de novo.";
  } else {
    try {
      const r = await aplicarReajuste({ contratoId, entrada, hoje: hojeSaoPaulo(), usuarioId });
      if (r.ok) {
        ok = true;
        mensagem = `Reajuste agendado para ${r.dataEfetiva.split("-").reverse().join("/")}.`;
      } else {
        mensagem = r.erro;
      }
    } catch (erro) {
      mensagem = erro instanceof Error ? erro.message : "Não foi possível aplicar o reajuste.";
    }
  }

  const params = new URLSearchParams(ok ? { ok: mensagem } : { erro: mensagem });
  redirect(`/reajustes?${params.toString()}`);
}

/** Gera o aditivo PDF do reajuste já agendado e guarda no contrato (US-4.7). */
export async function gerarAditivoAction(formData: FormData): Promise<void> {
  await exigirAcesso("reajustes");
  const contratoId = Number(formData.get("contratoId"));
  const dataEfetiva = String(formData.get("dataEfetiva") ?? "");

  let mensagem: string;
  let ok = false;
  const usuarioId = await idUsuarioAtual();
  if (!Number.isInteger(contratoId) || contratoId <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(dataEfetiva)) {
    mensagem = "Reajuste inválido.";
  } else if (!usuarioId) {
    mensagem = "Sua sessão expirou. Entre de novo.";
  } else {
    try {
      const r = await gerarAditivoReajuste({ contratoId, dataEfetiva, usuarioId });
      if (r.ok) {
        ok = true;
        mensagem = `Aditivo gerado (versão ${r.versao}).`;
      } else {
        mensagem = r.erro;
      }
    } catch (erro) {
      mensagem = erro instanceof Error ? erro.message : "Não foi possível gerar o aditivo.";
    }
  }

  const params = new URLSearchParams(ok ? { ok: mensagem, arquivo: String(contratoId) } : { erro: mensagem });
  redirect(`/reajustes?${params.toString()}`);
}
