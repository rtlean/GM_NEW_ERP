import { MENU, type GrupoMenu, type ItemMenu } from "./menu";

// Regras de acesso (docs/historias/fatia-2-acesso.md, US-2.2 e US-2.3). Funções puras: sem banco, sem cookies.

export type PerfilAcesso = {
  role: "admin" | "user";
  status: "active" | "inactive";
  /** Telas liberadas pelo admin para o perfil operacional (chave = rota, ex.: "locadores"). */
  telas: string[];
  /** Usuário criado ou com senha redefinida: precisa trocar a senha antes de usar o ERP. */
  trocarSenha?: boolean;
  /** Quando o admin redefiniu senha ou bloqueou: sessões emitidas antes disso deixam de valer. */
  sessoesInvalidadasEm?: string | null;
};

/** Tela que só o administrador abre; nunca liberada para o operacional. */
export const TELA_SO_ADMIN = "usuarios";

/** Telas que o admin pode liberar para o operacional, agrupadas como no design "Usuários e acessos". */
export const GRUPOS_DE_TELAS: { chave: string; rotulo: string; telas: { chave: string; rotulo: string }[] }[] = [
  { chave: "visao", rotulo: "Visão geral", telas: [{ chave: "dashboard", rotulo: "Dashboard" }] },
  {
    chave: "imoveis",
    rotulo: "Imóveis e locadores",
    telas: [
      { chave: "imoveis", rotulo: "Imóveis" },
      { chave: "locadores", rotulo: "Locadores" },
      { chave: "locatarios", rotulo: "Locatários" },
    ],
  },
  {
    chave: "locacao",
    rotulo: "Locação",
    telas: [
      { chave: "contratos", rotulo: "Contratos" },
      { chave: "lancamentos", rotulo: "Lançamentos" },
      { chave: "relatorio", rotulo: "Relatório mensal" },
    ],
  },
  {
    chave: "integracoes",
    rotulo: "Integrações",
    telas: [
      { chave: "sicredi", rotulo: "Sicredi" },
      { chave: "whatsapp", rotulo: "WhatsApp" },
    ],
  },
];

/** Todas as chaves de tela que o admin pode liberar. */
export const TELAS_LIBERAVEIS: string[] = GRUPOS_DE_TELAS.flatMap((g) => g.telas.map((t) => t.chave));

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

/** Sessão emitida antes da última redefinição de senha ou bloqueio deixa de valer. */
export function sessaoValida(perfil: Pick<PerfilAcesso, "sessoesInvalidadasEm">, iatSegundos: number | null): boolean {
  if (!perfil.sessoesInvalidadasEm) return true;
  if (iatSegundos === null) return false;
  return iatSegundos * 1000 >= Date.parse(perfil.sessoesInvalidadasEm);
}

export function precisaTrocarSenha(perfil: Pick<PerfilAcesso, "trocarSenha">): boolean {
  return perfil.trocarSenha === true;
}
