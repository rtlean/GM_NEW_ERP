import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Cliente do banco com a chave secreta. Só pode ser importado por código do servidor
// (o pacote "server-only" faz o build falhar se alguém usar isto em tela do navegador).
// Docs: docs/02-TRD.md §5 e §6.

let cliente: SupabaseClient<Database> | undefined;

/** Devolve o cliente do Supabase, criando-o na primeira chamada. */
export function obterClienteServidor(): SupabaseClient<Database> {
  if (cliente) return cliente;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chaveSecreta = process.env.SUPABASE_SECRET_KEY;
  if (!url || !chaveSecreta) {
    throw new Error(
      "Configuração do Supabase incompleta: confira NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no .env.local.",
    );
  }

  cliente = createClient<Database>(url, chaveSecreta, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}
