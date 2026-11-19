// Dinheiro sempre em centavos (inteiro). Só converte para texto na hora de mostrar.

/** 1234500 centavos → "R$ 12.345,00". */
export function formatarReais(centavos: number): string {
  const valor = (centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `R$ ${valor}`;
}
