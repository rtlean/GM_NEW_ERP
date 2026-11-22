import { describe, expect, it, vi } from "vitest";
import { enviarModeloWhatsApp, estadoConfiguracaoWhatsApp, lerConfiguracaoWhatsApp, montarEnvioModelo, verificarConexaoWhatsApp } from "./whatsapp";

const config = { token: "TOKEN_FAKE", phoneId: "1234", versao: "v21.0" };

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
}

describe("configuração no servidor", () => {
  it("sem token ou ID, a configuração é nula e o estado só diz o que falta", () => {
    expect(lerConfiguracaoWhatsApp({})).toBeNull();
    expect(estadoConfiguracaoWhatsApp({ WHATSAPP_ACCESS_TOKEN: "x" })).toEqual({ token: true, phoneId: false });
  });

  it("usa a versão padrão quando não é informada", () => {
    expect(lerConfiguracaoWhatsApp({ WHATSAPP_ACCESS_TOKEN: "t", WHATSAPP_PHONE_NUMBER_ID: "1" })?.versao).toBe("v21.0");
  });
});

describe("verificarConexaoWhatsApp", () => {
  it("sem configuração, nem chama a Meta", async () => {
    const fetchFn = vi.fn();
    const r = await verificarConexaoWhatsApp(null, fetchFn as unknown as typeof fetch);
    expect(r.ok).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("lê número e nome sem enviar mensagem", async () => {
    const fetchFn = vi.fn(async () => respostaJson({ display_phone_number: "+55 27 99999-9999", verified_name: "Soluções" }));
    const r = await verificarConexaoWhatsApp(config, fetchFn as unknown as typeof fetch);
    expect(r).toEqual({ ok: true, numero: "+55 27 99999-9999", nome: "Soluções" });
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/v21.0/1234?");
    expect(init.method).toBeUndefined();
  });

  it("quando a Meta recusa, a mensagem não traz o token", async () => {
    const fetchFn = vi.fn(async () => respostaJson({ error: { message: "bad" } }, 401));
    const r = await verificarConexaoWhatsApp(config, fetchFn as unknown as typeof fetch);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).not.toContain("TOKEN_FAKE");
  });
});

describe("envio de modelo", () => {
  it("monta o corpo com idioma pt_BR e os parâmetros na ordem", () => {
    const corpo = montarEnvioModelo({ para: "5527999990000", modelo: "lembrete_vencimento", parametros: ["Ana", "Rua A", "10/12"] });
    expect(corpo.to).toBe("5527999990000");
    expect(corpo.template.language.code).toBe("pt_BR");
    expect(corpo.template.components[0].parameters.map((p) => p.text)).toEqual(["Ana", "Rua A", "10/12"]);
  });

  it("devolve o id da mensagem aceita", async () => {
    const fetchFn = vi.fn(async () => respostaJson({ messages: [{ id: "wamid.1" }] }));
    const r = await enviarModeloWhatsApp(config, { para: "5527999990000", modelo: "m", parametros: [] }, fetchFn as unknown as typeof fetch);
    expect(r).toEqual({ ok: true, idMensagem: "wamid.1" });
  });

  it("falha de rede vira erro amigável", async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error("rede");
    });
    const r = await enviarModeloWhatsApp(config, { para: "5527999990000", modelo: "m", parametros: [] }, fetchFn as unknown as typeof fetch);
    expect(r.ok).toBe(false);
  });
});
