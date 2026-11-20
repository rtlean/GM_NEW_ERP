"use server";

import { redirect } from "next/navigation";
import { exigirAcesso, idUsuarioAtual } from "@/lib/acesso";
import { liberarRepasse } from "@/lib/repasses";
import { hojeSaoPaulo } from "@/lib/contratos-encerrar-regras";
import { competenciaValida } from "@/lib/lancamentos-regras";

/** Libera o repasse de um locador na competência (US-4.8). */
export async function liberarRepasseAction(formData: FormData): Promise<void> {
  await exigirAcesso("repasses");
  const ownerId = Number(formData.get("ownerId"));
  const competencia = String(formData.get("competencia") ?? "");

  let params: URLSearchParams;
  const usuarioId = await idUsuarioAtual();
  if (!Number.isInteger(ownerId) || ownerId <= 0 || !competenciaValida(competencia)) {
    params = new URLSearchParams({ erro: "Dados do repasse inválidos.", competencia });
  } else if (!usuarioId) {
    params = new URLSearchParams({ erro: "Sua sessão expirou. Entre de novo.", competencia });
  } else {
    try {
      const r = await liberarRepasse({ ownerId, competencia, hoje: hojeSaoPaulo(), usuarioId });
      params = r.ok
        ? new URLSearchParams({ ok: "Repasse liberado.", competencia })
        : new URLSearchParams({ erro: r.erro, competencia });
    } catch (erro) {
      params = new URLSearchParams({ erro: erro instanceof Error ? erro.message : "Não foi possível liberar o repasse.", competencia });
    }
  }
  redirect(`/repasses?${params.toString()}`);
}
