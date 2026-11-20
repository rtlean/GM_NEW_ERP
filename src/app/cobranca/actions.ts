"use server";

import { exigirAcesso, idUsuarioAtual } from "@/lib/acesso";
import { gerarCobrancasDoMes, type ResumoGeracao } from "@/lib/cobrancas";
import { competenciaValida } from "@/lib/lancamentos-regras";

export type EstadoGerar = { erro?: string; resumo?: ResumoGeracao & { competencia: string } } | undefined;

/** Gera as cobranças do mês que ainda não existem (US-4.1). Não altera nem apaga cobrança existente. */
export async function gerarCobrancasAction(_anterior: EstadoGerar, formData: FormData): Promise<EstadoGerar> {
  await exigirAcesso("cobranca");

  const competencia = String(formData.get("competencia") ?? "");
  if (!competenciaValida(competencia)) return { erro: "Escolha uma competência válida." };

  const usuarioId = await idUsuarioAtual();
  if (!usuarioId) return { erro: "Sua sessão expirou. Entre de novo." };

  try {
    const resumo = await gerarCobrancasDoMes({ competencia, usuarioId });
    return { resumo: { ...resumo, competencia } };
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Não foi possível gerar as cobranças." };
  }
}
