import "server-only";
import { obterClienteServidor } from "./supabase/server";

// Regras e acesso a dados dos locadores (docs/historias/fatia-1-banco.md, US-1.2).
// Só leitura. Toda consulta filtra company_id = 1.

const EMPRESA_ID = 1;

export type LocadorLinha = {
  id: number;
  nome: string;
  documento: string | null;
  telefone: string | null;
};

/** Mostra só os dois últimos caracteres do CPF ou CNPJ. Ex.: ***.***.***-09 */
export function mascararDocumento(documento: string | null): string {
  if (!documento) return "—";
  const limpo = documento.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
  const ultimos = limpo.slice(-2);
  if (limpo.length === 11) return `***.***.***-${ultimos}`;
  if (limpo.length === 14) return `**.***.***/****-${ultimos}`;
  return "—";
}

/**
 * Mostra o telefone como (27) 99999-8888 (celular) ou (27) 9999-8888 (fixo).
 * O valor guardado continua no formato 5527999998888, que é o usado pelo WhatsApp.
 */
export function formatarTelefone(telefone: string | null): string {
  if (!telefone) return "—";
  const digitos = telefone.replace(/\D/g, "");
  if (!digitos.startsWith("55") || (digitos.length !== 12 && digitos.length !== 13)) {
    return telefone;
  }
  const ddd = digitos.slice(2, 4);
  const numero = digitos.slice(4);
  if (numero.length === 9) return `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`;
  return `(${ddd}) ${numero.slice(0, 4)}-${numero.slice(4)}`;
}

/**
 * Monta o filtro de busca por nome ou documento.
 * Remove caracteres que quebrariam o filtro. Para documento, compara só letras e números.
 */
export function montarFiltroBusca(busca: string): string | null {
  const termo = busca.trim().replace(/[,()%*]/g, "");
  if (!termo) return null;
  const condicoes = [`full_name.ilike.%${termo}%`];
  // Só procura no documento quando o termo tem números (senão "Maria" também casaria).
  const documento = termo.replace(/[^0-9A-Za-z]/g, "");
  if (/[0-9]/.test(documento)) condicoes.push(`document.ilike.%${documento}%`);
  return condicoes.join(",");
}

/** Lista os locadores da empresa, em ordem de nome, com busca opcional. */
export async function listarLocadores(busca = ""): Promise<LocadorLinha[]> {
  let consulta = obterClienteServidor()
    .from("owners")
    .select("id, full_name, document, phone")
    .eq("company_id", EMPRESA_ID)
    .order("full_name", { ascending: true });

  const filtro = montarFiltroBusca(busca);
  if (filtro) consulta = consulta.or(filtro);

  const { data, error } = await consulta;
  if (error) throw new Error(`Não foi possível carregar os locadores: ${error.message}`);

  return (data ?? []).map((linha) => ({
    id: linha.id,
    nome: linha.full_name,
    documento: linha.document,
    telefone: linha.phone,
  }));
}
