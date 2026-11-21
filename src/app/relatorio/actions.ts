"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAcesso, idUsuarioAtual, perfilAtual } from "@/lib/acesso";
import { competenciaValida } from "@/lib/lancamentos-regras";
import { podeMarcarConferencia } from "@/lib/relatorio-regras";
import { definirConferencia } from "@/lib/relatorio-conferencia";

// Marcar ou desmarcar CONFERIDO (US-5.3). Só admin; o servidor confere o perfil antes de gravar.
export async function alterarConferenciaAction(formData: FormData): Promise<void> {
  await exigirAcesso("relatorio");
  if (!podeMarcarConferencia(await perfilAtual())) throw new Error("Só o administrador marca o relatório como conferido.");

  const ownerId = Number(formData.get("ownerId"));
  const competencia = String(formData.get("competencia") ?? "");
  const conferido = formData.get("conferido") === "sim";
  if (!Number.isInteger(ownerId) || ownerId <= 0 || !competenciaValida(competencia)) throw new Error("Dados da conferência inválidos.");

  const usuarioId = await idUsuarioAtual();
  if (!usuarioId) throw new Error("Sessão inválida. Entre de novo.");

  await definirConferencia({ ownerId, competencia, conferido, usuarioId });
  revalidatePath("/relatorio");
  redirect(`/relatorio?comp=${competencia}&dono=${ownerId}`);
}
