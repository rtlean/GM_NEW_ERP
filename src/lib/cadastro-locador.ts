import { validarDocumento } from "./documentos";

// Regras de cadastro do locador (docs/historias/fatia-3-cadastros.md, US-3.2).
// Função pura: não acessa o banco. Os valores de repasse e Pix seguem o que já existe na tabela owners.

export const FORMAS_DE_REPASSE = ["PIX", "TRANSFERÊNCIA BANCÁRIA"] as const;
export const TIPOS_DE_PIX = ["CPF", "CNPJ", "E-MAIL", "TELEFONE"] as const;
export const TIPOS_DE_CONTA = ["CONTA CORRENTE", "CONTA POUPANÇA"] as const;

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
  codigoBanco: string;
  agencia: string;
  conta: string;
  digitoConta: string;
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

/** WhatsApp "(27) 99999-8888" vira "5527999998888". Vazio vira null (campo opcional). */
export function normalizarWhatsApp(texto: string): { ok: true; valor: string | null } | { ok: false; erro: string } {
  const digitos = texto.replace(/\D/g, "");
  if (!digitos) return { ok: true, valor: null };
  if (digitos.length === 10 || digitos.length === 11) return { ok: true, valor: `55${digitos}` };
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) return { ok: true, valor: digitos };
  return { ok: false, erro: "Informe o WhatsApp com DDD. Ex.: (27) 99999-8888." };
}

/** Taxa em porcentagem ("10" ou "10,5") vira centésimos de ponto percentual. Aceita de 0 a 100. */
export function normalizarTaxa(texto: string): { ok: true; valor: number } | { ok: false; erro: string } {
  const limpo = texto.trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(limpo)) return { ok: false, erro: "Informe a taxa em porcentagem. Ex.: 10." };
  const percentual = Number(limpo);
  if (percentual < 0 || percentual > 100) return { ok: false, erro: "A taxa deve ficar entre 0 e 100." };
  return { ok: true, valor: Math.round(percentual * 100) };
}

function normalizarChavePix(tipo: string, chave: string): string {
  const texto = chave.trim();
  if (tipo === "E-MAIL") return texto.toLowerCase();
  if (tipo === "CPF" || tipo === "CNPJ" || tipo === "TELEFONE") return texto.replace(/\D/g, "");
  return texto;
}

/** Valores iniciais do formulário de edição, a partir do que está gravado. */
export function paraFormulario(dados: Partial<DadosLocador> & { full_name?: string }): EntradaLocador {
  const digitos = (dados.phone ?? "").replace(/\D/g, "").replace(/^55/, "");
  let whatsapp = "";
  if (digitos.length === 10) whatsapp = `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  if (digitos.length === 11) whatsapp = `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  const taxa = dados.admin_fee_percent_basis_points ?? TAXA_PADRAO_BASIS_POINTS;
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
    conta: dados.bank_account ?? "",
    digitoConta: dados.bank_account_digit ?? "",
    tipoConta: dados.account_type ?? "CONTA CORRENTE",
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

  const whatsapp = normalizarWhatsApp(entrada.whatsapp);
  if (!whatsapp.ok) erros.whatsapp = whatsapp.erro;

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
    if (!entrada.banco.trim()) erros.banco = "Informe o banco.";
    if (!entrada.agencia.trim()) erros.agencia = "Informe a agência.";
    if (!entrada.conta.trim()) erros.conta = "Informe a conta.";
    if (!(TIPOS_DE_CONTA as readonly string[]).includes(entrada.tipoConta)) erros.tipoConta = "Escolha o tipo de conta.";
    dados.bank_name = entrada.banco.trim() || null;
    dados.bank_code = entrada.codigoBanco.trim() || null;
    dados.bank_agency = entrada.agencia.trim() || null;
    dados.bank_account = entrada.conta.trim() || null;
    dados.bank_account_digit = entrada.digitoConta.trim() || null;
    dados.account_type = entrada.tipoConta || null;
  } else {
    erros.formaRepasse = "Escolha a forma de repasse.";
  }

  if (Object.keys(erros).length > 0 || !taxa.ok || !whatsapp.ok) {
    return { ok: false, erros };
  }

  return {
    ok: true,
    dados: {
      full_name: nome,
      document: documento,
      email: email || null,
      city: entrada.cidade.trim() || null,
      phone: whatsapp.valor,
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
