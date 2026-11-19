import { randomInt } from "node:crypto";

// Regra de senha do design (Usuários e acessos): mínimo 10 caracteres, só letras e números, com pelo menos uma letra e um número.
const CARACTERES = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const REGRA_SENHA = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{10,}$/;

/** Senha provisória de 12 caracteres que atende à regra acima (sorteada com gerador seguro). */
export function gerarSenhaProvisoria(): string {
  let senha = "";
  for (let i = 0; i < 12; i++) senha += CARACTERES[randomInt(CARACTERES.length)];
  // Garante uma letra e um número mesmo no sorteio improvável de só um tipo.
  if (!REGRA_SENHA.test(senha)) return gerarSenhaProvisoria();
  return senha;
}

export function senhaAtendeRegras(senha: string): boolean {
  return REGRA_SENHA.test(senha);
}
