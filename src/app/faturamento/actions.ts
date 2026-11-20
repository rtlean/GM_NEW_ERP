"use server";

import { exigirAcesso, idUsuarioAtual } from "@/lib/acesso";
import { gerarFaturamento } from "@/lib/faturamento";
import type { ResumoGeracao } from "@/lib/cobrancas";
import { competenciaValida } from "@/lib/lancamentos-regras";

export type EstadoFaturamento = { erro?: string; resumo?: ResumoGeracao & { competencia: string } } | undefined;

/** Gera as cobranças dos contratos marcados na prévia (US-4.9). Não altera nem apaga cobrança existente. */
export async function gerarFaturamentoAction(_anterior: EstadoFaturamento, formData: FormData): Promise<EstadoFaturamento> {
  await exigirAcesso("faturamento");

  const competencia = String(formData.get("competencia") ?? "");
  if (!competenciaValida(competencia)) return { erro: "Escolha uma competência válida." };

  const contratoIds = formData
    .getAll("contratoId")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);

  const usuarioId = await idUsuarioAtual();
  if (!usuarioId) return { erro: "Sua sessão expirou. Entre de novo." };

  try {
    const resumo = await gerarFaturamento({ competencia, contratoIds, usuarioId });
    return { resumo: { ...resumo, competencia } };
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Não foi possível gerar as cobranças." };
  }
}
