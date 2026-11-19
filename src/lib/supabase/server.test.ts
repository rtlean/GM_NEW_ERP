import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Simula o ambiente do servidor: o pacote "server-only" só bloqueia navegador.
vi.mock("server-only", () => ({}));

describe("obterClienteServidor", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("cria o cliente quando as variáveis do Supabase existem", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://exemplo.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "chave-de-teste");
    const { obterClienteServidor } = await import("./server");

    const cliente = obterClienteServidor();

    expect(typeof cliente.from).toBe("function");
  });

  it("devolve sempre o mesmo cliente", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://exemplo.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "chave-de-teste");
    const { obterClienteServidor } = await import("./server");

    expect(obterClienteServidor()).toBe(obterClienteServidor());
  });

  it("avisa com clareza quando falta configuração", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    const { obterClienteServidor } = await import("./server");

    expect(() => obterClienteServidor()).toThrow(/\.env\.local/);
  });
});
