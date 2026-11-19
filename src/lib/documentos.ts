// Validação de CPF e CNPJ (docs/historias/fatia-3-cadastros.md, US-3.2).
// CNPJ alfanumérico é aceito: nas 12 primeiras posições vale letra ou número,
// e o valor de cada caractere é o código ASCII menos 48. Os dois últimos são sempre números.

export type TipoDocumento = "CPF" | "CNPJ";

export type ResultadoDocumento =
  | { ok: true; tipo: TipoDocumento; valor: string }
  | { ok: false; erro: string };

/** Deixa só letras e números, em maiúsculas. Ex.: "12.345.678/0001-95" -> "12345678000195". */
export function normalizarDocumento(texto: string): string {
  return texto.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
}

function digitoVerificador(valores: number[], pesos: number[]): number {
  const soma = valores.reduce((total, valor, i) => total + valor * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const numeros = cpf.split("").map(Number);
  const dv1 = digitoVerificador(numeros.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = digitoVerificador(numeros.slice(0, 9).concat(dv1), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return numeros[9] === dv1 && numeros[10] === dv2;
}

export function cnpjValido(cnpj: string): boolean {
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj) || /^(.)\1{13}$/.test(cnpj)) return false;
  const valores = cnpj.split("").map((c) => c.charCodeAt(0) - 48);
  const dv1 = digitoVerificador(valores.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = digitoVerificador(valores.slice(0, 12).concat(dv1), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return valores[12] === dv1 && valores[13] === dv2;
}

/** Aceita CPF (11 dígitos) ou CNPJ (14 caracteres). Devolve o valor limpo, pronto para salvar. */
export function validarDocumento(texto: string): ResultadoDocumento {
  const valor = normalizarDocumento(texto);
  if (!valor) return { ok: false, erro: "Informe o CPF ou CNPJ." };
  if (valor.length === 11) {
    return cpfValido(valor) ? { ok: true, tipo: "CPF", valor } : { ok: false, erro: "CPF inválido." };
  }
  if (valor.length === 14) {
    return cnpjValido(valor) ? { ok: true, tipo: "CNPJ", valor } : { ok: false, erro: "CNPJ inválido." };
  }
  return { ok: false, erro: "CPF ou CNPJ inválido. Confira os números." };
}
