export type ItemMenu = { rota: string; rotulo: string; emConstrucao?: boolean };
export type GrupoMenu = { rotulo: string; itens: ItemMenu[]; emConstrucao?: boolean };

// Barra superior do layout do design. Módulos fora da v1 aparecem como "Em construção" (a página mostra o aviso).
// Ordem e nomes seguem o design; os grupos de fora da v1 ficam visíveis para o menu já estar pronto.
const construcao = (rota: string, rotulo: string): ItemMenu => ({ rota, rotulo, emConstrucao: true });

export const MENU: GrupoMenu[] = [
  { rotulo: "Dashboard", itens: [{ rota: "dashboard", rotulo: "Dashboard" }] },
  { rotulo: "Pipeline", emConstrucao: true, itens: [construcao("pipeline", "Pipeline")] },
  { rotulo: "Imóveis", itens: [{ rota: "imoveis", rotulo: "Imóveis" }] },
  {
    rotulo: "Locação",
    itens: [
      { rota: "contratos", rotulo: "Contratos" },
      { rota: "locadores", rotulo: "Locadores" },
      { rota: "locatarios", rotulo: "Locatários" },
      { rota: "lancamentos", rotulo: "Lançamentos" },
      construcao("faturamento", "Faturamento"),
      construcao("reajustes", "Reajustes"),
      construcao("cobranca", "Cobrança"),
      construcao("repasses", "Repasses"),
      { rota: "relatorio", rotulo: "Relatório mensal" },
    ],
  },
  {
    rotulo: "Financeiro",
    emConstrucao: true,
    itens: [construcao("extrato", "Pagar e receber"), construcao("leitura", "Ler documento"), construcao("conciliacao", "Conciliação"), construcao("relatorios", "Relatórios")],
  },
  { rotulo: "Conta digital", emConstrucao: true, itens: [construcao("conta", "Extrato da conta"), construcao("pagamentos", "Pagamentos e Pix")] },
  { rotulo: "Fiscal", emConstrucao: true, itens: [construcao("notas", "Notas fiscais"), construcao("dimob", "DIMOB e IR")] },
  { rotulo: "Proteção", emConstrucao: true, itens: [construcao("seguros", "Seguros"), construcao("garantias", "Garantias")] },
  { rotulo: "Crédito", emConstrucao: true, itens: [construcao("consorcio", "Consórcio"), construcao("financiamento", "Financiamento")] },
  { rotulo: "Integrações", itens: [{ rota: "sicredi", rotulo: "Sicredi" }, { rota: "whatsapp", rotulo: "WhatsApp" }] },
  { rotulo: "Usuários", itens: [{ rota: "usuarios", rotulo: "Usuários e acessos" }] },
];

/** Atalho à direita da barra (botão "Hoje" do design). Não é um grupo. */
export const ATALHOS: ItemMenu[] = [construcao("hoje", "Hoje")];

export const TODAS_AS_ROTAS: ItemMenu[] = [...MENU.flatMap((g) => g.itens), ...ATALHOS];

/** Grupo do menu a que pertence um caminho como "/locadores/12". */
export function grupoDoCaminho(caminho: string, menu: GrupoMenu[] = MENU): GrupoMenu | undefined {
  const rota = caminho.split("/")[1] ?? "";
  return menu.find((g) => g.itens.some((i) => i.rota === rota));
}
