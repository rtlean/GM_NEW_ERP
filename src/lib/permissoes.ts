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

/** Telas que o admin pode liberar para o operacional, nos mesmos grupos do design "Usuários e acessos". */
export const GRUPOS_DE_TELAS: { chave: string; rotulo: string; telas: { chave: string; rotulo: string }[] }[] = [
  {
    chave: "crm",
    rotulo: "CRM",
    telas: [
      { chave: "dashboard", rotulo: "Dashboard" },
      { chave: "hoje", rotulo: "Hoje" },
      { chave: "pipeline", rotulo: "Pipeline" },
      { chave: "imoveis", rotulo: "Imóveis" },
    ],
  },
  {
    chave: "locacao",
    rotulo: "Locação",
    telas: [
      { chave: "contratos", rotulo: "Contratos" },
      { chave: "locadores", rotulo: "Locadores" },
      { chave: "locatarios", rotulo: "Locatários" },
      { chave: "lancamentos", rotulo: "Lançamentos" },
      { chave: "faturamento", rotulo: "Faturamento" },
      { chave: "reajustes", rotulo: "Reajustes" },
      { chave: "cobranca", rotulo: "Cobrança" },
      { chave: "repasses", rotulo: "Repasses" },
      { chave: "relatorio", rotulo: "Relatório mensal" },
    ],
  },
  {
    chave: "financeiro",
    rotulo: "Financeiro",
    telas: [
      { chave: "extrato", rotulo: "Pagar e receber" },
      { chave: "leitura", rotulo: "Ler documento" },
      { chave: "conciliacao", rotulo: "Conciliação" },
      { chave: "relatorios", rotulo: "Relatórios" },
    ],
  },
  {
    chave: "conta-digital",
    rotulo: "Conta digital",
    telas: [
      { chave: "conta", rotulo: "Extrato da conta" },
      { chave: "pagamentos", rotulo: "Pagamentos e Pix" },
    ],
  },
  {
    chave: "fiscal",
    rotulo: "Fiscal",
    telas: [
      { chave: "notas", rotulo: "Notas fiscais" },
      { chave: "dimob", rotulo: "DIMOB e IR" },
    ],
  },
  {
    chave: "protecao",
    rotulo: "Proteção",
    telas: [
      { chave: "seguros", rotulo: "Seguros" },
      { chave: "garantias", rotulo: "Garantias" },
    ],
  },
  {
    chave: "credito",
    rotulo: "Crédito",
    telas: [
      { chave: "consorcio", rotulo: "Consórcio" },
      { chave: "financiamento", rotulo: "Financiamento" },
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

/** Modelos de acesso do design: um clique marca ou desmarca um conjunto de telas. */
export const MODELOS_DE_ACESSO: { chave: string; rotulo: string; telas: string[] }[] = [
  {
    chave: "secretaria",
    rotulo: "Secretária",
    telas: ["hoje", "pipeline", "imoveis", "contratos", "locadores", "locatarios", "lancamentos", "faturamento", "reajustes", "cobranca", "leitura"],
  },
  { chave: "nenhuma", rotulo: "Nenhuma tela", telas: [] },
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

/** Atalhos da barra (ex.: "Hoje") que o usuário pode abrir. */
export function atalhosPermitidos(perfil: PerfilAcesso | null, atalhos: ItemMenu[] = []): ItemMenu[] {
  return atalhos.filter((i) => podeAbrirTela(perfil, i.rota));
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
