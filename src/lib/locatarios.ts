import "server-only";
import { obterClienteServidor } from "./supabase/server";
import { contratosAtivosPorLocatario } from "./contratos";
import { imoveisPorIds } from "./imoveis";
import { listarOpcoesDeLocador } from "./locadores-cadastro";
import type { DadosLocatario } from "./cadastro-locatario";

// Regras e acesso a dados dos locatários (US-3.3, layout do design). Toda consulta filtra company_id = 1.
// Não apaga nada. O vínculo com imóveis e locadores vem dos contratos ativos (leitura em contratos.ts e imoveis.ts).

const EMPRESA_ID = 1;

export type FiltroLocatarios = "todos" | "mais-de-um-imovel";

export type LocatarioLinha = {
  id: number;
  nome: string;
  documento: string | null;
  quantidadeImoveis: number;
};

export type ImovelDoLocatario = {
  id: number;
  codigo: string;
  tipo: string | null;
  locador: string;
  aluguelCentavos: number;
};

export type FiltrosLocatarios = { busca?: string; filtro?: FiltroLocatarios };

function filtroBusca(busca: string): string | null {
  const termo = busca.trim().replace(/[,()%*]/g, "");
  if (!termo) return null;
  const condicoes = [`full_name.ilike.%${termo}%`];
  const documento = termo.replace(/[^0-9A-Za-z]/g, "");
  if (/[0-9]/.test(documento)) condicoes.push(`document.ilike.%${documento}%`);
  return condicoes.join(",");
}

/** Lista os locatários da empresa, em ordem de nome, com a quantidade de imóveis (contratos ativos). */
export async function listarLocatarios(filtros: FiltrosLocatarios = {}): Promise<LocatarioLinha[]> {
  let consulta = obterClienteServidor()
    .from("tenants")
    .select("id, full_name, document")
    .eq("company_id", EMPRESA_ID)
    .order("full_name", { ascending: true });
  const filtro = filtroBusca(filtros.busca ?? "");
  if (filtro) consulta = consulta.or(filtro);

  const { data, error } = await consulta;
  if (error) throw new Error("Não foi possível carregar os locatários.");
  const linhas = data ?? [];
  const contratos = await contratosAtivosPorLocatario(linhas.map((l) => l.id));

  const lista = linhas.map((l) => ({
    id: l.id,
    nome: l.full_name,
    documento: l.document,
    quantidadeImoveis: contratos.get(l.id)?.length ?? 0,
  }));
  return filtros.filtro === "mais-de-um-imovel" ? lista.filter((l) => l.quantidadeImoveis > 1) : lista;
}

/** Nome e id de todos os locatários da empresa, para o aviso de nomes parecidos. */
export async function listarNomesDeLocatarios(): Promise<{ id: number; nome: string }[]> {
  const { data, error } = await obterClienteServidor()
    .from("tenants")
    .select("id, full_name")
    .eq("company_id", EMPRESA_ID);
  if (error) throw new Error("Não foi possível carregar os locatários.");
  return (data ?? []).map((l) => ({ id: l.id, nome: l.full_name }));
}

/** Locatário pelo id, com os imóveis dos contratos ativos. Null se não existir na empresa. */
export async function buscarLocatario(id: number) {
  const { data, error } = await obterClienteServidor()
    .from("tenants")
    .select("id, full_name, document, rg, email, phone, notes")
    .eq("company_id", EMPRESA_ID)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o locatário.");
  if (!data) return null;

  const contratos = (await contratosAtivosPorLocatario([id])).get(id) ?? [];
  const [imoveis, locadores] = await Promise.all([
    imoveisPorIds(contratos.map((c) => c.propertyId)),
    listarOpcoesDeLocador(),
  ]);
  const nomeDoLocador = new Map(locadores.map((o) => [o.id, o.nome]));

  const lista: ImovelDoLocatario[] = contratos.flatMap((c) => {
    const imovel = imoveis.get(c.propertyId);
    if (!imovel) return [];
    return [
      {
        id: c.propertyId,
        codigo: imovel.codigo,
        tipo: imovel.tipo,
        locador: (imovel.ownerId && nomeDoLocador.get(imovel.ownerId)) || "Locador não encontrado",
        aluguelCentavos: c.aluguelCentavos,
      },
    ];
  });

  return {
    ...data,
    imoveis: lista,
    quantidadeLocadores: new Set(lista.map((i) => i.locador)).size,
    totalAluguelCentavos: lista.reduce((soma, i) => soma + i.aluguelCentavos, 0),
  };
}

/** Outro locatário com o mesmo CPF/CNPJ, se existir. */
export async function locatarioComDocumento(documento: string, ignorarId?: number): Promise<{ id: number; nome: string } | null> {
  let consulta = obterClienteServidor()
    .from("tenants")
    .select("id, full_name")
    .eq("company_id", EMPRESA_ID)
    .eq("document", documento)
    .limit(1);
  if (ignorarId) consulta = consulta.neq("id", ignorarId);
  const { data, error } = await consulta;
  if (error) throw new Error("Não foi possível verificar o CPF/CNPJ.");
  const linha = data?.[0];
  return linha ? { id: linha.id, nome: linha.full_name } : null;
}

/** Outro locatário com exatamente o mesmo nome (sem diferenciar maiúsculas), se existir. */
export async function locatarioComNome(nome: string): Promise<{ id: number; nome: string } | null> {
  const seguro = nome.replace(/[%_\\]/g, "\\$&");
  const { data, error } = await obterClienteServidor()
    .from("tenants")
    .select("id, full_name")
    .eq("company_id", EMPRESA_ID)
    .ilike("full_name", seguro)
    .limit(1);
  if (error) throw new Error("Não foi possível verificar o nome.");
  const linha = data?.[0];
  return linha ? { id: linha.id, nome: linha.full_name } : null;
}

/** Cria ou atualiza os dados do locatário. Não mexe nos vínculos: eles nascem nos contratos. */
export async function salvarLocatario(dados: DadosLocatario, id?: number): Promise<number> {
  const cliente = obterClienteServidor();
  if (id) {
    const { error } = await cliente.from("tenants").update(dados).eq("company_id", EMPRESA_ID).eq("id", id);
    if (error) throw new Error("Não foi possível salvar as alterações.");
    return id;
  }
  const { data, error } = await cliente
    .from("tenants")
    .insert({ ...dados, company_id: EMPRESA_ID })
    .select("id")
    .single();
  if (error || !data) throw new Error("Não foi possível cadastrar o locatário.");
  return data.id;
}

export type LocatarioParaPainel = { id: number; nome: string; telefone: string | null };

/** Nome e telefone de cada locatário, para o painel (Dashboard). Só leitura. */
export async function listarLocatariosParaPainel(): Promise<LocatarioParaPainel[]> {
  const { data, error } = await obterClienteServidor().from("tenants").select("id, full_name, phone").eq("company_id", EMPRESA_ID);
  if (error) throw new Error("Não foi possível carregar os locatários.");

  return (data ?? []).map((l) => ({ id: l.id, nome: l.full_name, telefone: l.phone }));
}
