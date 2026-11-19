import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

// Cliente com a sessão do usuário que está logado (cookie no navegador).
// Usa a chave pública: é o login do usuário, não o acesso total do servidor.

/** Cria o cliente de login ligado aos cookies da requisição atual. */
export async function criarClienteSessao() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chavePublica = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chavePublica) {
    throw new Error("Configuração do Supabase incompleta: confira o .env.local.");
  }

  const armazenamento = await cookies();
  return createServerClient<Database>(url, chavePublica, {
    cookies: {
      getAll: () => armazenamento.getAll(),
      setAll: (cookiesParaGravar) => {
        try {
          cookiesParaGravar.forEach(({ name, value, options }) =>
            armazenamento.set(name, value, options),
          );
        } catch {
          // Em alguns contextos o Next não permite gravar cookies; a sessão é renovada pelo proxy.
        }
      },
    },
  });
}
