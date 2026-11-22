// Integração WhatsApp (layout do design WhatsApp.dc.html). Só a API oficial da Meta.
// Token e ID do número ficam em variáveis do servidor, nunca no banco nem na tela.

/** Modelos de mensagem do design. Na API oficial, envio fora de conversa aberta exige modelo aprovado pela Meta. */
export const MODELOS_MENSAGEM: { nome: string; texto: string; categoria: string; status: "Aprovado" | "Em análise" | "Rascunho" }[] = [
  { nome: "Boleto do aluguel", texto: "Olá, {{1}}! O boleto do aluguel de {{2}}, no valor de {{3}}, vence em {{4}}. Linha digitável: {{5}}", categoria: "Utilidade", status: "Aprovado" },
  { nome: "Lembrete de vencimento", texto: "Olá, {{1}}! Lembramos que o aluguel de {{2}} vence amanhã, {{3}}. Se já pagou, desconsidere.", categoria: "Utilidade", status: "Aprovado" },
  { nome: "Aluguel em atraso", texto: "Olá, {{1}}. Não identificamos o pagamento do aluguel de {{2}}, vencido em {{3}}. Podemos ajudar?", categoria: "Utilidade", status: "Em análise" },
  { nome: "Nota fiscal ao locador", texto: "Olá, {{1}}! Segue a nota fiscal nº {{2}} dos honorários de {{3}}.", categoria: "Utilidade", status: "Aprovado" },
  { nome: "Relatório mensal ao locador", texto: "Olá, {{1}}! Seu relatório de {{2}} está pronto. Valor líquido a repassar: {{3}}.", categoria: "Utilidade", status: "Rascunho" },
];

export const AUTOMACOES: { chave: string; nome: string; descricao: string; padrao: boolean }[] = [
  { chave: "boleto", nome: "Enviar boleto ao emitir", descricao: "Assim que o boleto for registrado no Sicredi", padrao: true },
  { chave: "lembrete", nome: "Lembrete 1 dia antes do vencimento", descricao: "Só para quem ainda não pagou", padrao: true },
  { chave: "atraso", nome: "Aviso de atraso (1, 3 e 7 dias)", descricao: "Para automaticamente quando o pagamento entra", padrao: false },
  { chave: "nota", nome: "Enviar nota fiscal ao locador", descricao: "Quando a nota for autorizada", padrao: true },
  { chave: "relatorio", nome: "Enviar relatório mensal ao locador", descricao: "Depois que o mês for fechado", padrao: false },
  { chave: "repasse", nome: "Avisar o locador sobre o repasse", descricao: "Quando o repasse for pago", padrao: false },
];
