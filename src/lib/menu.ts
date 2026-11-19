export type ItemMenu = { rota: string; rotulo: string };
export type GrupoMenu = { rotulo: string; itens: ItemMenu[] };

// Menu da v1 (docs/04-UI-UX.md). Módulos fora do escopo não entram.
export const MENU: GrupoMenu[] = [
  { rotulo: "Dashboard", itens: [{ rota: "dashboard", rotulo: "Dashboard" }] },
  { rotulo: "Imóveis", itens: [{ rota: "imoveis", rotulo: "Imóveis" }] },
  {
    rotulo: "Locação",
    itens: [
      { rota: "contratos", rotulo: "Contratos" },
      { rota: "locadores", rotulo: "Locadores" },
      { rota: "locatarios", rotulo: "Locatários" },
      { rota: "lancamentos", rotulo: "Lançamentos" },
      { rota: "relatorio", rotulo: "Relatório mensal" },
    ],
  },
  { rotulo: "Usuários", itens: [{ rota: "usuarios", rotulo: "Usuários e acessos" }] },
];

export const TODAS_AS_ROTAS = MENU.flatMap((g) => g.itens);

/** Grupo do menu a que pertence um caminho como "/locadores/12". */
export function grupoDoCaminho(caminho: string, menu: GrupoMenu[] = MENU): GrupoMenu | undefined {
  const rota = caminho.split("/")[1] ?? "";
  return menu.find((g) => g.itens.some((i) => i.rota === rota));
}
