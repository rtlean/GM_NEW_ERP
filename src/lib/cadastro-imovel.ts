// Regras de cadastro do imóvel (docs/historias/fatia-3-cadastros.md, US-3.4).
// Função pura. Tipos e situações seguem o design "Imóveis".

export const TIPOS_DE_IMOVEL = [
  "Apartamento",
  "Casa",
  "Sala comercial",
  "Kitnet",
  "Loja",
  "Ponto comercial",
  "Galpão",
  "Garagem",
  "Depósito",
  "Outro",
  "Terreno",
] as const;

/** Situação que o cadastro pode definir. "Alugado" vem do contrato (US-3.5), então não aparece aqui. */
export const SITUACOES_DO_CADASTRO = [
  { valor: "vacant", rotulo: "Disponível" },
  { valor: "maintenance", rotulo: "Em manutenção" },
] as const;

export type EntradaImovel = {
  ownerId: string;
  tipo: string;
  situacao: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
  aluguel: string;
  caracteristicas: string;
};

export type DadosImovel = {
  owner_id: number;
  type: string;
  occupancy_status: "vacant" | "maintenance" | "occupied";
  address: string;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  zip_code: string | null;
  city: string;
  state: string;
  rent_cents: number;
  caracteristicas: string | null;
};

export type ResultadoImovel = { ok: true; dados: DadosImovel } | { ok: false; erros: Partial<Record<keyof EntradaImovel, string>> };

/** Aluguel em reais ("1.200,50" ou "1200") vira centavos (120050). Vazio vira 0. */
export function reaisParaCentavos(texto: string): { ok: true; valor: number } | { ok: false; erro: string } {
  const limpo = texto.trim();
  if (!limpo) return { ok: true, valor: 0 };
  const normalizado = limpo.replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return { ok: false, erro: "Informe o valor em reais. Ex.: 1.200,00." };
  return { ok: true, valor: Math.round(Number(normalizado) * 100) };
}

/**
 * situacaoAtual: situação gravada hoje. "Alugado" só é mantido se já estava alugado (vem do contrato),
 * nunca é escolhido à mão.
 */
export function validarImovel(entrada: EntradaImovel, situacaoAtual?: string): ResultadoImovel {
  const erros: Partial<Record<keyof EntradaImovel, string>> = {};

  const ownerId = Number(entrada.ownerId);
  if (!Number.isInteger(ownerId) || ownerId <= 0) erros.ownerId = "Escolha o locador do imóvel.";

  if (!(TIPOS_DE_IMOVEL as readonly string[]).includes(entrada.tipo)) erros.tipo = "Escolha o tipo do imóvel.";

  const mantemAlugado = situacaoAtual === "occupied" && entrada.situacao === "occupied";
  const situacao = mantemAlugado
    ? { valor: "occupied" as const }
    : SITUACOES_DO_CADASTRO.find((s) => s.valor === entrada.situacao);
  if (!situacao) erros.situacao = "Escolha a situação do imóvel.";

  const endereco = entrada.endereco.trim();
  if (!endereco) erros.endereco = "Informe o endereço.";

  const cidade = entrada.cidade.trim();
  if (!cidade) erros.cidade = "Informe a cidade.";

  const uf = entrada.uf.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(uf)) erros.uf = "Informe a UF com 2 letras. Ex.: ES.";

  const cep = entrada.cep.replace(/\D/g, "");
  if (cep && cep.length !== 8) erros.cep = "O CEP deve ter 8 números.";

  const aluguel = reaisParaCentavos(entrada.aluguel);
  if (!aluguel.ok) erros.aluguel = aluguel.erro;

  if (Object.keys(erros).length > 0 || !aluguel.ok || !situacao) return { ok: false, erros };

  return {
    ok: true,
    dados: {
      owner_id: ownerId,
      type: entrada.tipo,
      occupancy_status: situacao.valor,
      address: endereco,
      numero: entrada.numero.trim() || null,
      complemento: entrada.complemento.trim() || null,
      bairro: entrada.bairro.trim() || null,
      zip_code: cep || null,
      city: cidade,
      state: uf,
      rent_cents: aluguel.valor,
      caracteristicas: entrada.caracteristicas.trim() || null,
    },
  };
}
