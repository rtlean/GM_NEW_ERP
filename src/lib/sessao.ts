// Regra de quais caminhos exigem login (docs/02-TRD.md §6: toda página, exceto /login).
// Função pura: não acessa o banco nem os cookies.

const CAMINHOS_PUBLICOS = ["/login", "/api/health"];

/** Verdadeiro para caminhos que podem ser abertos sem login. */
export function rotaPublica(caminho: string): boolean {
  if (CAMINHOS_PUBLICOS.some((p) => caminho === p || caminho.startsWith(`${p}/`))) return true;
  if (caminho.startsWith("/_next/")) return true;
  return /\.(png|jpg|jpeg|ico|svg|webp|css|js)$/i.test(caminho);
}
