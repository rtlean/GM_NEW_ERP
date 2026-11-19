// Regras de caminhos e de sessão (função pura: sem banco e sem cookies).

const CAMINHOS_PUBLICOS = ["/login", "/api/health"];

/** Verdadeiro para caminhos que podem ser abertos sem login. */
export function rotaPublica(caminho: string): boolean {
  if (CAMINHOS_PUBLICOS.some((p) => caminho === p || caminho.startsWith(`${p}/`))) return true;
  if (caminho.startsWith("/_next/")) return true;
  return /\.(png|jpg|jpeg|ico|svg|webp|css|js)$/i.test(caminho);
}

/** Lê o "iat" (hora de emissão, em segundos) de um token JWT. Não valida assinatura: use só depois do getUser. */
export function iatDoToken(token: string | undefined): number | null {
  if (!token) return null;
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(partes[1], "base64url").toString("utf8")) as { iat?: unknown };
    return typeof payload.iat === "number" ? payload.iat : null;
  } catch {
    return null;
  }
}
