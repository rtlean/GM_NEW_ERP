"use server";

import { exigirAcesso } from "@/lib/acesso";
import { lerConfiguracaoWhatsApp, verificarConexaoWhatsApp, type ResultadoConexao } from "@/lib/whatsapp";

/** Confere a conexão com a Meta. Só lê dados do número; não envia mensagem. */
export async function testarConexaoWhatsAppAction(): Promise<ResultadoConexao> {
  await exigirAcesso("whatsapp");
  return verificarConexaoWhatsApp(lerConfiguracaoWhatsApp());
}
