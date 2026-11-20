import { nomesParecidos } from "./cadastro-locatario";
import type { ContratoParaPainel } from "./contratos";
import type { ImovelParaPainel } from "./imoveis";
import type { LocadorParaPainel } from "./locadores";
import type { LocatarioParaPainel } from "./locatarios";

// Regras do Dashboard (sem acesso ao banco). Dinheiro sempre em centavos.
// Tudo é calculado a partir dos cadastros atuais. Nada aqui tem nome ou valor fixo.

export const CATEGORIAS_DE_TIPO = [
  "Kitnet",
  "Apartamento",
  "Casa",
  "Loja e ponto comercial",
  "Sala comercial",
  "Galpão",
  "Garagem",
  "Outro",
  "Não informado",
] as const;
export type CategoriaDeTipo = (typeof CATEGORIAS_DE_TIPO)[number];

/** Sem acento e em maiúsculas, para comparar tipos digitados de jeitos diferentes ("kitnet", "KITNET"). */
function normalizarTipo(tipo: string): string {
  return tipo.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toUpperCase();
}

/** Agrupa o tipo digitado em uma das categorias. Tipo que não se encaixa vai para "Outro". */
export function categoriaDoTipo(tipo: string | null): CategoriaDeTipo {
  const t = tipo ? normalizarTipo(tipo) : "";
  if (!t) return "Não informado";
  if (t.startsWith("KITNET")) return "Kitnet";
  if (t.startsWith("APART")) return "Apartamento";
  if (t.startsWith("CASA")) return "Casa";
  if (t.startsWith("LOJA") || t.startsWith("PONTO")) return "Loja e ponto comercial";
  if (t.startsWith("SALA")) return "Sala comercial";
  if (t.startsWith("GALP")) return "Galpão";
  if (t.startsWith("GARAG")) return "Garagem";
  return "Outro";
}

export type BarraDoGrafico = { nome: string; centavos: number; quantidade: number; percentual: number };

/** Soma o aluguel por grupo e calcula a largura relativa de cada barra (maior = 100%). */
export function barrasOrdenadas(grupos: Map<string, { centavos: number; quantidade: number }>, limite?: number): BarraDoGrafico[] {
  const lista = [...grupos.entries()]
    .map(([nome, g]) => ({ nome, centavos: g.centavos, quantidade: g.quantidade }))
    .sort((a, b) => b.centavos - a.centavos || a.nome.localeCompare(b.nome, "pt-BR"));
  const maior = lista[0]?.centavos ?? 0;
  const barras = lista.map((g) => ({ ...g, percentual: maior > 0 ? Math.round((g.centavos / maior) * 100) : 0 }));
  return limite ? barras.slice(0, limite) : barras;
}

export type EntradaDoPainel = {
  contratos: ContratoParaPainel[];
  imoveis: ImovelParaPainel[];
  locadores: LocadorParaPainel[];
  locatarios: LocatarioParaPainel[];
};

export type PainelDeCarteira = {
  totalCentavos: number;
  quantidadeContratos: number;
  quantidadeLocadores: number;
  registrosARevisar: number;
  acoes: { titulo: string; descricao: string; destino: string; quantidade: number }[];
  tipos: BarraDoGrafico[];
  locadoresTop: BarraDoGrafico[];
};

/** Monta todos os números e listas que a tela do Dashboard mostra. */
export function montarPainel(entrada: EntradaDoPainel): PainelDeCarteira {
  const imoveisPorId = new Map(entrada.imoveis.map((i) => [i.id, i]));
  const locadoresPorId = new Map(entrada.locadores.map((l) => [l.id, l]));

  // Valores a conferir: aluguel zerado, ou diferente do aluguel cadastrado no imóvel.
  let semValor = 0;
  let diferenteDoImovel = 0;
  let semTaxaEmNenhum = 0;
  let usamTaxaDoLocador = 0;
  for (const c of entrada.contratos) {
    const imovel = imoveisPorId.get(c.propertyId);
    if (c.aluguelCentavos === 0) semValor++;
    else if (imovel && imovel.aluguelCentavos !== c.aluguelCentavos) diferenteDoImovel++;

    const dono = imovel?.ownerId != null ? locadoresPorId.get(imovel.ownerId) : undefined;
    if (!c.taxaPropria && !dono?.taxaPropria) semTaxaEmNenhum++;
    if (!c.taxaPropria && dono?.taxaPropria) usamTaxaDoLocador++;
  }

  // Possíveis duplicidades: locatários com nome parecido com outro cadastro.
  const nomes = entrada.locatarios.map((l) => ({ id: l.id, nome: l.nome }));
  const comNomeParecido = new Set<number>();
  for (const l of nomes) {
    if (nomesParecidos(l.nome, nomes, l.id).length > 0) comNomeParecido.add(l.id);
  }

  // Cadastros incompletos: locatário sem telefone e imóvel sem tipo.
  const semTelefone = entrada.locatarios.filter((l) => !l.telefone).length;
  const semTipo = entrada.imoveis.filter((i) => !i.tipo || !i.tipo.trim()).length;

  const valoresARevisar = semValor + diferenteDoImovel;
  const registrosARevisar = valoresARevisar + comNomeParecido.size + semTelefone + semTipo;

  // Aluguel por categoria de tipo de imóvel (valor do contrato).
  const tipos = new Map<string, { centavos: number; quantidade: number }>();
  // Aluguel por locador (dono do imóvel do contrato).
  const donos = new Map<string, { centavos: number; quantidade: number }>();
  for (const c of entrada.contratos) {
    const imovel = imoveisPorId.get(c.propertyId);
    const categoria = categoriaDoTipo(imovel?.tipo ?? null);
    const t = tipos.get(categoria) ?? { centavos: 0, quantidade: 0 };
    t.centavos += c.aluguelCentavos;
    t.quantidade++;
    tipos.set(categoria, t);

    const nomeDono = imovel?.ownerId != null ? (locadoresPorId.get(imovel.ownerId)?.nome ?? "Locador não encontrado") : "Sem locador";
    const d = donos.get(nomeDono) ?? { centavos: 0, quantidade: 0 };
    d.centavos += c.aluguelCentavos;
    d.quantidade++;
    donos.set(nomeDono, d);
  }

  return {
    totalCentavos: entrada.contratos.reduce((soma, c) => soma + c.aluguelCentavos, 0),
    quantidadeContratos: entrada.contratos.length,
    quantidadeLocadores: entrada.locadores.length,
    registrosARevisar,
    acoes: [
      {
        titulo: "Taxa de administração",
        descricao: `${semTaxaEmNenhum} contratos sem taxa em nenhum cadastro. ${usamTaxaDoLocador} usam a taxa do locador.`,
        destino: "/locadores",
        quantidade: semTaxaEmNenhum,
      },
      {
        titulo: "Valores a conferir",
        descricao: `${diferenteDoImovel} contratos com aluguel diferente do imóvel. ${semValor} sem valor.`,
        destino: "/contratos",
        quantidade: valoresARevisar,
      },
      {
        titulo: "Possíveis duplicidades",
        descricao: `${comNomeParecido.size} locatários com nome parecido a outro cadastro.`,
        destino: "/locatarios",
        quantidade: comNomeParecido.size,
      },
      {
        titulo: "Cadastros incompletos",
        descricao: `${semTelefone} locatários sem telefone e ${semTipo} imóveis sem tipo.`,
        destino: "/imoveis",
        quantidade: semTelefone + semTipo,
      },
    ],
    tipos: barrasOrdenadas(tipos),
    locadoresTop: barrasOrdenadas(donos, 6),
  };
}
