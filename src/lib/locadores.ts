import "server-only";
import { obterClienteServidor } from "./supabase/server";
import { resumoImoveisPorLocador } from "./imoveis";

// Regras e acesso a dados dos locadores (docs/historias/fatia-1-banco.md, US-1.2).
// Só leitura. Toda consulta filtra company_id = 1.

const EMPRESA_ID = 1;

export type LocadorLinha = {
  id: number;
  nome: string;
  documento: string | null;
  telefone: string | null;
  quantidadeImoveis: number;
  totalAluguelCentavos: number;
  status: "Com imóvel" | "Sem imóvel";
};

/** Status mostrado no design: "Com imóvel" quando há pelo menos um imóvel cadastrado. */
export function statusDoLocador(quantidadeImoveis: number): "Com imóvel" | "Sem imóvel" {
  return quantidadeImoveis > 0 ? "Com imóvel" : "Sem imóvel";
}

/** Locador tem WhatsApp quando o telefone tem algum dígito. */
export function temWhatsApp(telefone: string | null): boolean {
  return !!telefone && /\d/.test(telefone);
}

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

export type FiltrosLocadores = { busca?: string; semWhatsApp?: boolean };

/** Lista os locadores da empresa, em ordem de nome, com busca e filtro "Sem WhatsApp". */
export async function listarLocadores(filtros: FiltrosLocadores = {}): Promise<LocadorLinha[]> {
  let consulta = obterClienteServidor()
    .from("owners")
    .select("id, full_name, document, phone")
    .eq("company_id", EMPRESA_ID)
    .order("full_name", { ascending: true });

  const filtro = montarFiltroBusca(filtros.busca ?? "");
  if (filtro) consulta = consulta.or(filtro);
  // Sem WhatsApp: telefone vazio ou nulo. Cada .or() é combinado com os demais (E).
  if (filtros.semWhatsApp) consulta = consulta.or("phone.is.null,phone.eq.");

  const [{ data, error }, imoveis] = await Promise.all([consulta, resumoImoveisPorLocador()]);
  if (error) throw new Error(`Não foi possível carregar os locadores: ${error.message}`);

  return (data ?? []).map((linha) => {
    const resumo = imoveis.get(linha.id) ?? { quantidade: 0, totalAluguelCentavos: 0 };
    return {
      id: linha.id,
      nome: linha.full_name,
      documento: linha.document,
      telefone: linha.phone,
      quantidadeImoveis: resumo.quantidade,
      totalAluguelCentavos: resumo.totalAluguelCentavos,
      status: statusDoLocador(resumo.quantidade),
    };
  });
}

export type LocadorParaPainel = { id: number; nome: string; taxaPropria: boolean; taxaBps: number | null };

/** Nome e se o locador tem taxa de administração própria, para o painel (Dashboard). Só leitura. */
export async function listarLocadoresParaPainel(): Promise<LocadorParaPainel[]> {
  const { data, error } = await obterClienteServidor()
    .from("owners")
    .select("id, full_name, admin_fee_percent_basis_points")
    .eq("company_id", EMPRESA_ID);
  if (error) throw new Error("Não foi possível carregar os locadores.");

  return (data ?? []).map((o) => ({ id: o.id, nome: o.full_name, taxaPropria: o.admin_fee_percent_basis_points != null, taxaBps: o.admin_fee_percent_basis_points }));
}
