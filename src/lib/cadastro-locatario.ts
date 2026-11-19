import { validarDocumento } from "./documentos";
import { normalizarWhatsApp } from "./cadastro-locador";

// Regras de cadastro do locatário (docs/historias/fatia-3-cadastros.md, US-3.3).
// Função pura. Um locatário pode ter imóveis de vários locadores, por isso a lista de locadores é obrigatória.

export type EntradaLocatario = {
  nome: string;
  documento: string;
  email: string;
  whatsapp: string;
  locadores: string[];
};

export type DadosLocatario = {
  full_name: string;
  document: string;
  cpf: string;
  email: string | null;
  phone: string | null;
};

export type ResultadoLocatario =
  | { ok: true; dados: DadosLocatario; locadorIds: number[] }
  | { ok: false; erros: Partial<Record<keyof EntradaLocatario, string>> };

export function validarLocatario(entrada: EntradaLocatario): ResultadoLocatario {
  const erros: Partial<Record<keyof EntradaLocatario, string>> = {};

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

  const locadorIds = [...new Set(entrada.locadores.map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  if (locadorIds.length === 0) erros.locadores = "Escolha pelo menos um locador.";

  if (Object.keys(erros).length > 0 || !whatsapp.ok) return { ok: false, erros };

  return {
    ok: true,
    locadorIds,
    dados: {
      full_name: nome,
      document: documento,
      cpf: documento,
      email: email || null,
      phone: whatsapp.valor,
    },
  };
}
