import { validarDocumento } from "./documentos";

// Regras de cadastro do locador (docs/historias/fatia-3-cadastros.md, US-3.2 e ajuste de layout).
// Função pura: não acessa o banco. Os valores de repasse e Pix seguem o que já existe na tabela owners.

export const FORMAS_DE_REPASSE = ["PIX", "TRANSFERÊNCIA BANCÁRIA"] as const;
export const TIPOS_DE_PIX = ["CPF", "CNPJ", "E-MAIL", "TELEFONE", "ALEATÓRIA"] as const;
export const TIPOS_DE_CONTA = ["CONTA CORRENTE", "CONTA POUPANÇA"] as const;

/** Textos que aparecem na tela para cada valor gravado. */
export const ROTULO_FORMA_DE_REPASSE: Record<(typeof FORMAS_DE_REPASSE)[number], string> = {
  PIX: "Pix",
  "TRANSFERÊNCIA BANCÁRIA": "Conta bancária",
};
export const ROTULO_TIPO_DE_PIX: Record<(typeof TIPOS_DE_PIX)[number], string> = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  "E-MAIL": "E-mail",
  TELEFONE: "Telefone",
  ALEATÓRIA: "Aleatória",
};

/** Taxa padrão de administração: 10%, guardada em centésimos de ponto percentual (1000). */
export const TAXA_PADRAO_BASIS_POINTS = 1000;

export type EntradaLocador = {
  nome: string;
  documento: string;
  email: string;
  cidade: string;
  whatsapp: string;
  taxa: string;
  formaRepasse: string;
  tipoPix: string;
  chavePix: string;
  banco: string;
  /** Preservado ao editar (o design não mostra o campo). */
  codigoBanco: string;
  agencia: string;
  /** Conta com dígito, ex.: "12345-6". */
  conta: string;
  /** Preservado ao editar (o design não mostra o campo). */
  tipoConta: string;
};

export type DadosLocador = {
  full_name: string;
  document: string;
  email: string | null;
  city: string | null;
  phone: string | null;
  admin_fee_percent_basis_points: number;
  preferred_repass_method: string | null;
  pix_type: string | null;
  pix_key: string | null;
  bank_name: string | null;
  bank_code: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  bank_account_digit: string | null;
  account_type: string | null;
};

export type ResultadoLocador =
  | { ok: true; dados: DadosLocador }
  | { ok: false; erros: Partial<Record<keyof EntradaLocador, string>> };

/** Telefone "(27) 99999-8888" vira "5527999998888". Vazio vira null (campo opcional). */
export function normalizarWhatsApp(texto: string): { ok: true; valor: string | null } | { ok: false; erro: string } {
  const digitos = texto.replace(/\D/g, "");
  if (!digitos) return { ok: true, valor: null };
  if (digitos.length === 10 || digitos.length === 11) return { ok: true, valor: `55${digitos}` };
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) return { ok: true, valor: digitos };
  return { ok: false, erro: "Informe o telefone com DDD. Ex.: (27) 99999-8888." };
}

/** Taxa em porcentagem ("10" ou "10,5") vira centésimos de ponto percentual. Aceita de 0 a 100. */
export function normalizarTaxa(texto: string): { ok: true; valor: number } | { ok: false; erro: string } {
  const limpo = texto.trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(limpo)) return { ok: false, erro: "Informe a taxa em porcentagem. Ex.: 10." };
  const percentual = Number(limpo);
  if (percentual < 0 || percentual > 100) return { ok: false, erro: "A taxa deve ficar entre 0 e 100." };
  return { ok: true, valor: Math.round(percentual * 100) };
}

/** "12345-6" vira conta "12345" e dígito "6". Sem traço, tudo é conta. */
export function separarContaComDigito(texto: string): { conta: string; digito: string | null } {
  const limpo = texto.trim();
  const posicao = limpo.lastIndexOf("-");
  if (posicao <= 0) return { conta: limpo, digito: null };
  const digito = limpo.slice(posicao + 1).trim();
  return { conta: limpo.slice(0, posicao).trim(), digito: digito || null };
}

function normalizarChavePix(tipo: string, chave: string): string {
  const texto = chave.trim();
  if (tipo === "E-MAIL") return texto.toLowerCase();
  if (tipo === "CPF" || tipo === "CNPJ" || tipo === "TELEFONE") return texto.replace(/\D/g, "");
  return texto;
}

/** Valores iniciais do formulário, a partir do que está gravado (ou da taxa padrão, se é novo). */
export function paraFormulario(dados: Partial<DadosLocador> & { full_name?: string }): EntradaLocador {
  const digitos = (dados.phone ?? "").replace(/\D/g, "").replace(/^55/, "");
  let whatsapp = "";
  if (digitos.length === 10) whatsapp = `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  if (digitos.length === 11) whatsapp = `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  const taxa = dados.admin_fee_percent_basis_points ?? TAXA_PADRAO_BASIS_POINTS;
  const conta = dados.bank_account ?? "";
  return {
    nome: dados.full_name ?? "",
    documento: dados.document ?? "",
    email: dados.email ?? "",
    cidade: dados.city ?? "",
    whatsapp,
    taxa: String(taxa / 100).replace(".", ","),
    formaRepasse: dados.preferred_repass_method ?? "PIX",
    tipoPix: dados.pix_type ?? "CPF",
    chavePix: dados.pix_key ?? "",
    banco: dados.bank_name ?? "",
    codigoBanco: dados.bank_code ?? "",
    agencia: dados.bank_agency ?? "",
    conta: dados.bank_account_digit ? `${conta}-${dados.bank_account_digit}` : conta,
    tipoConta: dados.account_type ?? "",
  };
}

/** Confere o formulário inteiro e devolve os dados prontos para gravar, ou os erros por campo. */
export function validarLocador(entrada: EntradaLocador): ResultadoLocador {
  const erros: Partial<Record<keyof EntradaLocador, string>> = {};

  const nome = entrada.nome.trim();
  if (!nome) erros.nome = "Informe o nome.";

  let documento = "";
  const doc = validarDocumento(entrada.documento);
  if (doc.ok) documento = doc.valor;
  else erros.documento = doc.erro;

  const email = entrada.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.email = "Informe um e-mail válido.";

  const telefone = normalizarWhatsApp(entrada.whatsapp);
  if (!telefone.ok) erros.whatsapp = telefone.erro;

  const taxa = normalizarTaxa(entrada.taxa);
  if (!taxa.ok) erros.taxa = taxa.erro;

  const dados: Partial<DadosLocador> = {};
  if (entrada.formaRepasse === "PIX") {
    if (!(TIPOS_DE_PIX as readonly string[]).includes(entrada.tipoPix)) erros.tipoPix = "Escolha o tipo da chave Pix.";
    const chave = normalizarChavePix(entrada.tipoPix, entrada.chavePix);
    if (!chave) erros.chavePix = "Informe a chave Pix.";
    dados.pix_type = entrada.tipoPix || null;
    dados.pix_key = chave || null;
  } else if (entrada.formaRepasse === "TRANSFERÊNCIA BANCÁRIA") {
    const conta = separarContaComDigito(entrada.conta);
    if (!entrada.banco.trim()) erros.banco = "Informe o banco.";
    if (!entrada.agencia.trim()) erros.agencia = "Informe a agência.";
    if (!conta.conta) erros.conta = "Informe a conta com dígito. Ex.: 12345-6.";
    dados.bank_name = entrada.banco.trim() || null;
    dados.bank_code = entrada.codigoBanco.trim() || null;
    dados.bank_agency = entrada.agencia.trim() || null;
    dados.bank_account = conta.conta || null;
    dados.bank_account_digit = conta.digito;
    dados.account_type = (TIPOS_DE_CONTA as readonly string[]).includes(entrada.tipoConta) ? entrada.tipoConta : null;
  } else {
    erros.formaRepasse = "Escolha a forma de repasse.";
  }

  if (Object.keys(erros).length > 0 || !taxa.ok || !telefone.ok) {
    return { ok: false, erros };
  }

  return {
    ok: true,
    dados: {
      full_name: nome,
      document: documento,
      email: email || null,
      city: entrada.cidade.trim() || null,
      phone: telefone.valor,
      admin_fee_percent_basis_points: taxa.valor,
      preferred_repass_method: entrada.formaRepasse,
      pix_type: dados.pix_type ?? null,
      pix_key: dados.pix_key ?? null,
      bank_name: dados.bank_name ?? null,
      bank_code: dados.bank_code ?? null,
      bank_agency: dados.bank_agency ?? null,
      bank_account: dados.bank_account ?? null,
      bank_account_digit: dados.bank_account_digit ?? null,
      account_type: dados.account_type ?? null,
    },
  };
}
