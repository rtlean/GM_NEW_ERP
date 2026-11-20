import { validarDocumento } from "./documentos";
import { normalizarWhatsApp } from "./cadastro-locador";

// Regras de cadastro do locatário (layout do design, docs/historias/fatia-3-cadastros.md, US-3.3).
// Função pura. O locatário não é ligado a um locador aqui: o vínculo nasce no contrato (US-3.5).

export type EntradaLocatario = {
  nome: string;
  documento: string;
  rg: string;
  email: string;
  whatsapp: string;
  observacoes: string;
};

export type DadosLocatario = {
  full_name: string;
  document: string;
  cpf: string;
  rg: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export type ResultadoLocatario =
  | { ok: true; dados: DadosLocatario }
  | { ok: false; erros: Partial<Record<keyof EntradaLocatario, string>> };

export function validarLocatario(entrada: EntradaLocatario): ResultadoLocatario {
  const erros: Partial<Record<keyof EntradaLocatario, string>> = {};

  const nome = entrada.nome.trim().toUpperCase();
  if (!nome) erros.nome = "Informe o nome ou a razão social.";

  let documento = "";
  const doc = validarDocumento(entrada.documento);
  if (doc.ok) documento = doc.valor;
  else erros.documento = doc.erro;

  const email = entrada.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.email = "E-mail inválido.";

  const telefone = normalizarWhatsApp(entrada.whatsapp);
  if (!telefone.ok) erros.whatsapp = telefone.erro;

  if (Object.keys(erros).length > 0 || !telefone.ok) return { ok: false, erros };

  return {
    ok: true,
    dados: {
      full_name: nome,
      document: documento,
      cpf: documento,
      rg: entrada.rg.trim() || null,
      email: email || null,
      phone: telefone.valor,
      notes: entrada.observacoes.trim() || null,
    },
  };
}

// Sufixos de razão social que não diferenciam uma empresa da outra na comparação de nomes.
const SUFIXOS_LEGAIS = /\b(LTDA|EIRELI|S\/?A|ME|EPP)\b/g;

/** Nome em forma comparável: maiúsculas, sem pontuação, sem sufixos legais e com espaços simples. */
export function nomeParaComparar(nome: string): string {
  return nome
    .toUpperCase()
    .replace(SUFIXOS_LEGAIS, " ")
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Número mínimo de trocas de letra para transformar um texto em outro. */
export function distanciaEntreTextos(a: string, b: string): number {
  let anterior = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(anterior[j] + 1, atual[j - 1] + 1, anterior[j - 1] + custo);
    }
    anterior = atual;
  }
  return anterior[b.length];
}

const LIMITE_DE_PARECIDO = 2;
const TAMANHO_MINIMO_DO_NOME = 8;

/**
 * Locatários com nome muito parecido com o informado (até 2 letras de diferença).
 * Serve só de aviso: quem decide se é o mesmo cadastro é o CPF/CNPJ.
 */
export function nomesParecidos(nome: string, existentes: { id: number; nome: string }[], ignorarId?: number): { id: number; nome: string }[] {
  const alvo = nomeParaComparar(nome);
  if (alvo.length < TAMANHO_MINIMO_DO_NOME) return [];
  return existentes.filter((e) => {
    if (e.id === ignorarId) return false;
    const outro = nomeParaComparar(e.nome);
    return outro.length >= TAMANHO_MINIMO_DO_NOME && distanciaEntreTextos(alvo, outro) <= LIMITE_DE_PARECIDO;
  });
}
