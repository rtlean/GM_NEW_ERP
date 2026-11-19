import { MENU, type GrupoMenu, type ItemMenu } from "./menu";

// Regras de acesso (docs/historias/fatia-2-acesso.md, US-2.2). Função pura: sem banco, sem cookies.

export type PerfilAcesso = {
  role: "admin" | "user";
  status: "active" | "inactive";
  /** Telas liberadas pelo admin para o perfil operacional (chave = rota, ex.: "locadores"). */
  telas: string[];
};

/** Tela que só o administrador abre; nunca liberada para o operacional. */
export const TELA_SO_ADMIN = "usuarios";

/** Conta bloqueada (status inactive) não entra, nem com senha correta. */
export function podeEntrar(perfil: Pick<PerfilAcesso, "status">): boolean {
  return perfil.status === "active";
}

/** Admin abre tudo; operacional só as telas liberadas, exceto as exclusivas do admin. */
export function podeAbrirTela(perfil: PerfilAcesso | null, tela: string): boolean {
  if (!perfil || !podeEntrar(perfil)) return false;
  if (perfil.role === "admin") return true;
  if (tela === TELA_SO_ADMIN) return false;
  return perfil.telas.includes(tela);
}

/** Menu que o usuário enxerga: só os itens das telas que ele pode abrir. Grupos vazios somem. */
export function menuPermitido(perfil: PerfilAcesso | null, menu: GrupoMenu[] = MENU): GrupoMenu[] {
  return menu
    .map((g) => ({ ...g, itens: g.itens.filter((i) => podeAbrirTela(perfil, i.rota)) }))
    .filter((g) => g.itens.length > 0);
}

/** Primeira tela do menu que o usuário pode abrir (usada logo após o login). */
export function primeiraRotaPermitida(perfil: PerfilAcesso | null, menu: GrupoMenu[] = MENU): ItemMenu | undefined {
  return menuPermitido(perfil, menu).flatMap((g) => g.itens)[0];
}
