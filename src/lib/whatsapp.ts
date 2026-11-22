// Cliente da API oficial do WhatsApp (Meta Cloud API). Só roda no servidor.
// Variáveis: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_API_VERSION (opcional).
// A versão padrão precisa ser conferida na documentação da Meta antes de ligar em produção.

const VERSAO_PADRAO = "v21.0";

export type ConfiguracaoWhatsApp = { token: string; phoneId: string; versao: string };

export function lerConfiguracaoWhatsApp(ambiente: Record<string, string | undefined> = process.env): ConfiguracaoWhatsApp | null {
  const token = ambiente.WHATSAPP_ACCESS_TOKEN?.trim() ?? "";
  const phoneId = ambiente.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? "";
  if (!token || !phoneId) return null;
  return { token, phoneId, versao: ambiente.WHATSAPP_API_VERSION?.trim() || VERSAO_PADRAO };
}

/** Estado da configuração sem expor valores: só diz o que está preenchido. */
export function estadoConfiguracaoWhatsApp(ambiente: Record<string, string | undefined> = process.env) {
  return {
    token: Boolean(ambiente.WHATSAPP_ACCESS_TOKEN?.trim()),
    phoneId: Boolean(ambiente.WHATSAPP_PHONE_NUMBER_ID?.trim()),
  };
}

export type ResultadoConexao = { ok: true; numero: string; nome: string } | { ok: false; erro: string };

/** Confere o token e o número com uma leitura simples. Não envia mensagem. */
export async function verificarConexaoWhatsApp(
  config: ConfiguracaoWhatsApp | null,
  fetchFn: typeof fetch = fetch,
): Promise<ResultadoConexao> {
  if (!config) return { ok: false, erro: "Configuração incompleta no servidor. Preencha o token e o ID do número." };
  try {
    const resposta = await fetchFn(`https://graph.facebook.com/${config.versao}/${config.phoneId}?fields=display_phone_number,verified_name`, {
      headers: { Authorization: `Bearer ${config.token}` },
    });
    if (!resposta.ok) return { ok: false, erro: "A Meta recusou a conexão. Confira o token e o ID do número." };
    const dados = (await resposta.json()) as { display_phone_number?: string; verified_name?: string };
    return { ok: true, numero: dados.display_phone_number ?? "", nome: dados.verified_name ?? "" };
  } catch {
    return { ok: false, erro: "Não foi possível falar com a Meta agora. Tente de novo." };
  }
}

/** Monta o corpo do envio de um modelo aprovado. `para` já vem em E.164 sem sinais. */
export function montarEnvioModelo({ para, modelo, parametros }: { para: string; modelo: string; parametros: string[] }) {
  return {
    messaging_product: "whatsapp",
    to: para,
    type: "template",
    template: {
      name: modelo,
      language: { code: "pt_BR" },
      components: [{ type: "body", parameters: parametros.map((texto) => ({ type: "text", text: texto })) }],
    },
  };
}

export async function enviarModeloWhatsApp(
  config: ConfiguracaoWhatsApp,
  envio: { para: string; modelo: string; parametros: string[] },
  fetchFn: typeof fetch = fetch,
): Promise<{ ok: true; idMensagem: string } | { ok: false; erro: string }> {
  try {
    const resposta = await fetchFn(`https://graph.facebook.com/${config.versao}/${config.phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(montarEnvioModelo(envio)),
    });
    if (!resposta.ok) return { ok: false, erro: `A Meta não aceitou o envio (HTTP ${resposta.status}).` };
    const dados = (await resposta.json()) as { messages?: { id?: string }[] };
    return { ok: true, idMensagem: dados.messages?.[0]?.id ?? "" };
  } catch {
    return { ok: false, erro: "Não foi possível enviar agora. Tente de novo." };
  }
}
