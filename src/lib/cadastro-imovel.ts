// Regras de cadastro do imóvel (docs/historias/fatia-3-cadastros.md, US-3.4 e ajuste de layout).
// Função pura. Tipos, situações e campos seguem o design "Imóveis".

export const TIPOS_DE_IMOVEL = [
  "Apartamento",
  "Casa",
  "Sala comercial",
  "Consultório",
  "Kitnet",
  "Loja",
  "Ponto comercial",
  "Galpão",
  "Garagem",
  "Depósito",
  "Outro",
  "Terreno",
] as const;

export const FINALIDADES = ["Locação", "Venda", "Locação e venda"] as const;
export const MOBILIAS = ["Sem mobília", "Semimobiliado", "Mobiliado"] as const;
export const OPCOES_PETS = ["Não informado", "Sim", "Não"] as const;

export const COMODIDADES = [
  "Elevador",
  "Portaria 24h",
  "Piscina",
  "Academia",
  "Salão de festas",
  "Varanda",
  "Churrasqueira",
  "Quintal",
  "Ar-condicionado",
  "Armários embutidos",
  "Energia solar",
  "Acessibilidade",
] as const;

/** Situação que o cadastro pode definir. "Alugado" vem do contrato (US-3.5), então não aparece aqui. */
export const SITUACOES_DO_CADASTRO = [
  { valor: "vacant", rotulo: "Disponível" },
  { valor: "maintenance", rotulo: "Em manutenção" },
  { valor: "sold", rotulo: "Vendido" },
] as const;

export type EntradaImovel = {
  ownerId: string;
  nome: string;
  tipo: string;
  finalidade: string;
  situacao: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  matricula: string;
  inscricaoIptu: string;
  quartos: string;
  suites: string;
  banheiros: string;
  vagas: string;
  areaUtil: string;
  areaTotal: string;
  andar: string;
  mobilia: string;
  pets: string;
  comodidades: string[];
  aluguel: string;
  valorVenda: string;
  condominio: string;
  iptu: string;
};

/** Campos de uma linha de `properties` que o formulário usa (formato do banco). */
export type LinhaImovel = {
  owner_id: number | null;
  name: string | null;
  type: string | null;
  finality: string | null;
  occupancy_status: string;
  zip_code: string | null;
  address: string;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  city: string;
  state: string;
  matricula: string | null;
  iptu_registration: string | null;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parking_spots: number | null;
  useful_area_m2: number | string | null;
  total_area_m2: number | string | null;
  floor: string | null;
  furnishing: string | null;
  pets_allowed: string | null;
  amenities: string[] | null;
  rent_cents: number;
  sale_value_cents: number | null;
  condominium_cents: number | null;
  iptu_cents: number | null;
};

export type DadosImovel = {
  owner_id: number;
  name: string | null;
  type: string;
  finality: string | null;
  occupancy_status: "vacant" | "maintenance" | "occupied" | "sold";
  zip_code: string | null;
  address: string;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  city: string;
  state: string;
  matricula: string | null;
  iptu_registration: string | null;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parking_spots: number | null;
  useful_area_m2: number | null;
  total_area_m2: number | null;
  floor: string | null;
  furnishing: string | null;
  pets_allowed: string | null;
  amenities: string[];
  rent_cents: number;
  sale_value_cents: number | null;
  condominium_cents: number | null;
  iptu_cents: number | null;
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

/** Valor opcional em reais: vazio vira null. */
function reaisOpcionais(texto: string): { ok: true; valor: number | null } | { ok: false; erro: string } {
  if (!texto.trim()) return { ok: true, valor: null };
  const r = reaisParaCentavos(texto);
  return r.ok && r.valor > 0 ? { ok: true, valor: r.valor } : r.ok ? { ok: true, valor: null } : r;
}

/** Quantidade inteira opcional (quartos, vagas...). Vazio vira null. */
function inteiroOpcional(texto: string): { ok: true; valor: number | null } | { ok: false } {
  const limpo = texto.trim();
  if (!limpo) return { ok: true, valor: null };
  if (!/^\d{1,3}$/.test(limpo)) return { ok: false };
  return { ok: true, valor: Number(limpo) };
}

/** Área em m² opcional, com até 2 casas. Vazio vira null. */
function areaOpcional(texto: string): { ok: true; valor: number | null } | { ok: false } {
  const limpo = texto.trim().replace(",", ".");
  if (!limpo) return { ok: true, valor: null };
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(limpo)) return { ok: false };
  return { ok: true, valor: Number(limpo) };
}

const textoOpcional = (texto: string) => texto.trim() || null;

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
  const situacao = mantemAlugado ? { valor: "occupied" as const } : SITUACOES_DO_CADASTRO.find((s) => s.valor === entrada.situacao);
  if (!situacao) erros.situacao = "Escolha a situação do imóvel.";

  const finalidade = entrada.finalidade.trim();
  if (finalidade && !(FINALIDADES as readonly string[]).includes(finalidade)) erros.finalidade = "Escolha a finalidade.";

  const nome = entrada.nome.trim();
  if (nome.length > 120) erros.nome = "Use até 120 caracteres.";

  const endereco = entrada.endereco.trim();
  if (!endereco) erros.endereco = "Informe o endereço.";

  const cidade = entrada.cidade.trim();
  if (!cidade) erros.cidade = "Informe a cidade.";

  const uf = entrada.uf.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(uf)) erros.uf = "Informe a UF com 2 letras. Ex.: ES.";

  const cep = entrada.cep.replace(/\D/g, "");
  if (cep && cep.length !== 8) erros.cep = "O CEP deve ter 8 números.";

  const mobilia = entrada.mobilia.trim();
  if (mobilia && !(MOBILIAS as readonly string[]).includes(mobilia)) erros.mobilia = "Escolha a mobília.";
  const pets = entrada.pets.trim();
  if (pets && !(OPCOES_PETS as readonly string[]).includes(pets)) erros.pets = "Escolha uma opção.";

  const inteiros = {
    quartos: inteiroOpcional(entrada.quartos),
    suites: inteiroOpcional(entrada.suites),
    banheiros: inteiroOpcional(entrada.banheiros),
    vagas: inteiroOpcional(entrada.vagas),
  };
  for (const [campo, r] of Object.entries(inteiros)) {
    if (!r.ok) erros[campo as keyof EntradaImovel] = "Use somente números inteiros.";
  }
  const areaUtil = areaOpcional(entrada.areaUtil);
  if (!areaUtil.ok) erros.areaUtil = "Informe a área em m² (ex.: 65,5).";
  const areaTotal = areaOpcional(entrada.areaTotal);
  if (!areaTotal.ok) erros.areaTotal = "Informe a área em m² (ex.: 80).";

  const aluguel = reaisParaCentavos(entrada.aluguel);
  if (!aluguel.ok) erros.aluguel = aluguel.erro;
  const venda = reaisOpcionais(entrada.valorVenda);
  if (!venda.ok) erros.valorVenda = venda.erro;
  const condominio = reaisOpcionais(entrada.condominio);
  if (!condominio.ok) erros.condominio = condominio.erro;
  const iptu = reaisOpcionais(entrada.iptu);
  if (!iptu.ok) erros.iptu = iptu.erro;

  if (Object.keys(erros).length > 0 || !aluguel.ok || !situacao || !areaUtil.ok || !areaTotal.ok || !venda.ok || !condominio.ok || !iptu.ok || !inteiros.quartos.ok || !inteiros.suites.ok || !inteiros.banheiros.ok || !inteiros.vagas.ok) {
    return { ok: false, erros };
  }

  return {
    ok: true,
    dados: {
      owner_id: ownerId,
      name: textoOpcional(nome),
      type: entrada.tipo,
      finality: finalidade || null,
      occupancy_status: situacao.valor,
      zip_code: cep || null,
      address: endereco,
      numero: textoOpcional(entrada.numero),
      complemento: textoOpcional(entrada.complemento),
      bairro: textoOpcional(entrada.bairro),
      city: cidade,
      state: uf,
      matricula: textoOpcional(entrada.matricula),
      iptu_registration: textoOpcional(entrada.inscricaoIptu),
      bedrooms: inteiros.quartos.valor,
      suites: inteiros.suites.valor,
      bathrooms: inteiros.banheiros.valor,
      parking_spots: inteiros.vagas.valor,
      useful_area_m2: areaUtil.valor,
      total_area_m2: areaTotal.valor,
      floor: textoOpcional(entrada.andar),
      furnishing: mobilia || null,
      pets_allowed: pets || null,
      amenities: entrada.comodidades.filter((c) => (COMODIDADES as readonly string[]).includes(c)),
      rent_cents: aluguel.valor,
      sale_value_cents: venda.valor,
      condominium_cents: condominio.valor,
      iptu_cents: iptu.valor,
    },
  };
}

/** Converte uma linha do banco para os textos do formulário (inverso de validarImovel). */
export function paraEntrada(linha: LinhaImovel): EntradaImovel {
  const centavosTexto = (c: number | null) => (c ? (c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");
  const texto = (v: number | string | null | undefined) => (v === null || v === undefined ? "" : String(v).replace(".", ","));
  const situacao = linha.occupancy_status;
  return {
    ownerId: linha.owner_id ? String(linha.owner_id) : "",
    nome: linha.name ?? "",
    tipo: linha.type ?? "Outro",
    finalidade: linha.finality ?? "",
    situacao,
    cep: linha.zip_code ?? "",
    endereco: linha.address,
    numero: linha.numero ?? "",
    complemento: linha.complemento ?? "",
    bairro: linha.bairro ?? "",
    cidade: linha.city,
    uf: linha.state,
    matricula: linha.matricula ?? "",
    inscricaoIptu: linha.iptu_registration ?? "",
    quartos: texto(linha.bedrooms),
    suites: texto(linha.suites),
    banheiros: texto(linha.bathrooms),
    vagas: texto(linha.parking_spots),
    areaUtil: texto(linha.useful_area_m2),
    areaTotal: texto(linha.total_area_m2),
    andar: linha.floor ?? "",
    mobilia: linha.furnishing ?? "",
    pets: linha.pets_allowed ?? "",
    comodidades: linha.amenities ?? [],
    aluguel: centavosTexto(linha.rent_cents),
    valorVenda: centavosTexto(linha.sale_value_cents),
    condominio: centavosTexto(linha.condominium_cents),
    iptu: centavosTexto(linha.iptu_cents),
  };
}

/** Campos que contam para "Cadastro X% completo" (lista de campos do design). */
export const CAMPOS_DO_PROGRESSO = [
  "nome",
  "cep",
  "endereco",
  "bairro",
  "matricula",
  "inscricaoIptu",
  "banheiros",
  "areaUtil",
  "areaTotal",
  "aluguel",
  "iptu",
  "locador",
] as const;
export type CampoProgresso = (typeof CAMPOS_DO_PROGRESSO)[number];

const ROTULO_DO_CAMPO: Record<CampoProgresso, string> = {
  nome: "nome",
  cep: "CEP",
  endereco: "endereço",
  bairro: "bairro",
  matricula: "matrícula",
  inscricaoIptu: "inscrição do IPTU",
  banheiros: "banheiros",
  areaUtil: "área útil",
  areaTotal: "área total",
  aluguel: "valor",
  iptu: "IPTU",
  locador: "locador",
};

/** Nomes dos campos ainda vazios, na ordem do design. */
export function camposFaltando(preenchidos: Record<CampoProgresso, boolean>): string[] {
  return CAMPOS_DO_PROGRESSO.filter((c) => !preenchidos[c]).map((c) => ROTULO_DO_CAMPO[c]);
}

/** Percentual de campos preenchidos, arredondado. */
export function percentualDoCadastro(preenchidos: Record<CampoProgresso, boolean>): number {
  const feitos = CAMPOS_DO_PROGRESSO.filter((c) => preenchidos[c]).length;
  return Math.round((feitos / CAMPOS_DO_PROGRESSO.length) * 100);
}
