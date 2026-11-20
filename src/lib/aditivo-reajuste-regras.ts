// Regras puras do aditivo de reajuste (US-4.7). Sem banco e sem PDF.
// ATENÇÃO: o texto das cláusulas abaixo é um RASCUNHO. Confirmar com o modelo aprovado pelo dono antes do merge.

import { formatarReais } from "./dinheiro";

export const EMPRESA_ADMINISTRADORA = { nome: "GM Soluções Imobiliárias", cnpj: "55.816.252/0001-85" };
export const CIDADE_ASSINATURA = "Rio Bananal/ES";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** AAAA-MM-DD -> DD/MM/AAAA */
export function dataBR(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

/** AAAA-MM-DD -> "20 de novembro de 2026" */
export function dataPorExtenso(iso: string): string {
  return `${Number(iso.slice(8, 10))} de ${MESES[Number(iso.slice(5, 7)) - 1]} de ${iso.slice(0, 4)}`;
}

/** Só dígitos -> CPF (11) ou CNPJ (14) formatado. CNPJ alfanumérico volta como está. */
export function documentoFormatado(valor: string | null): string {
  if (!valor) return "";
  const limpo = valor.trim();
  if (/^\d{11}$/.test(limpo)) return limpo.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  if (/^\d{14}$/.test(limpo)) return limpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  return limpo;
}

/** Lê a observação gravada pelo reajuste: "Reajuste IPCA 4,50%". */
export function lerObservacaoReajuste(observacao: string | null): { indice: string; percentual: string } | null {
  const m = /^Reajuste (.+) (\d+,\d{2})%$/.exec(observacao ?? "");
  return m ? { indice: m[1], percentual: m[2] } : null;
}

export type DadosAditivo = {
  contratoId: number;
  locadorNome: string;
  locadorDocumento: string | null;
  locatarioNome: string;
  locatarioDocumento: string | null;
  imovel: string;
  indice: string;
  percentual: string;
  anteriorCentavos: number;
  novoCentavos: number;
  dataEfetiva: string;
};

export type LinhaAditivo = { tipo: "titulo" | "texto" | "destaque" | "espaco" | "assinatura"; texto: string };

/** Texto do aditivo em linhas. Não inventa dado: o que faltar aparece vazio e a tela deve impedir a geração. */
export function montarLinhasAditivo(d: DadosAditivo): LinhaAditivo[] {
  const docLocador = documentoFormatado(d.locadorDocumento);
  const docLocatario = documentoFormatado(d.locatarioDocumento);
  return [
    { tipo: "titulo", texto: "ADITIVO DE REAJUSTE DE ALUGUEL" },
    { tipo: "texto", texto: `Contrato de locação nº ${d.contratoId}` },
    { tipo: "espaco", texto: "" },
    { tipo: "texto", texto: `LOCADOR: ${d.locadorNome}${docLocador ? `, CPF/CNPJ ${docLocador}` : ""}.` },
    { tipo: "texto", texto: `LOCATÁRIO: ${d.locatarioNome}${docLocatario ? `, CPF/CNPJ ${docLocatario}` : ""}.` },
    { tipo: "texto", texto: `ADMINISTRADORA: ${EMPRESA_ADMINISTRADORA.nome}, CNPJ ${EMPRESA_ADMINISTRADORA.cnpj}.` },
    { tipo: "texto", texto: `IMÓVEL: ${d.imovel}.` },
    { tipo: "espaco", texto: "" },
    { tipo: "texto", texto: "As partes acordam o reajuste anual do aluguel, nos termos abaixo. Os demais termos do contrato original continuam válidos." },
    { tipo: "espaco", texto: "" },
    { tipo: "destaque", texto: `Cláusula 1ª: o aluguel mensal, que era de ${formatarReais(d.anteriorCentavos)}, passa a ser de ${formatarReais(d.novoCentavos)}, a partir de ${dataBR(d.dataEfetiva)}, pelo índice ${d.indice} de ${d.percentual}%.` },
    { tipo: "texto", texto: "Cláusula 2ª: o novo valor vale para o mês inteiro em que começa, sem efeito retroativo." },
    { tipo: "texto", texto: "Cláusula 3ª: as demais cláusulas do contrato original permanecem em vigor." },
    { tipo: "espaco", texto: "" },
    { tipo: "texto", texto: `${CIDADE_ASSINATURA}, ${dataPorExtenso(d.dataEfetiva)}.` },
    { tipo: "espaco", texto: "" },
    { tipo: "assinatura", texto: "Locador" },
    { tipo: "assinatura", texto: "Locatário" },
    { tipo: "assinatura", texto: `${EMPRESA_ADMINISTRADORA.nome}` },
  ];
}
