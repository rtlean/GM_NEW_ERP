// Integração WhatsApp (layout do design WhatsApp.dc.html). Nesta fatia nada é salvo nem enviado:
// a validação roda no formulário e o token não sai do navegador. Guardar tokens depende de decisão do dono.

export type ProvedorWhatsApp = "meta" | "evolution";

export const PROVEDORES: { id: ProvedorWhatsApp; nome: string; descricao: string; aviso: string; recomendado: boolean }[] = [
  {
    id: "meta",
    nome: "API oficial do WhatsApp (Meta)",
    descricao: "Pela Meta ou por um provedor oficial. Exige verificação da empresa e modelos aprovados.",
    aviso: "Recomendado: menor risco de bloqueio",
    recomendado: true,
  },
  {
    id: "evolution",
    nome: "Evolution API (não oficial)",
    descricao: "Usa o WhatsApp do aparelho por um servidor próprio. Sem custo por mensagem.",
    aviso: "Risco: pode violar os termos e ter o número bloqueado",
    recomendado: false,
  },
];

export type EntradaConexao = {
  provedor: ProvedorWhatsApp;
  numero: string;
  nomeExibido: string;
  idNumero: string;
  token: string;
  url: string;
};

export type CampoConexao = "numero" | "idNumero" | "token" | "url";

export type ResultadoConexao = { ok: true } | { ok: false; erros: Partial<Record<CampoConexao, string>> };

/** Valida o formulário de conexão. Não guarda nem envia nada. */
export function validarConexao(entrada: EntradaConexao): ResultadoConexao {
  const erros: Partial<Record<CampoConexao, string>> = {};
  const digitos = entrada.numero.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 13) erros.numero = "Informe o número com DDD.";

  if (entrada.provedor === "meta") {
    if (!entrada.token.trim()) erros.token = "Informe o token de acesso.";
    if (!entrada.idNumero.trim()) erros.idNumero = "Informe o ID do número na Meta.";
  } else {
    if (!entrada.token.trim()) erros.token = "Informe a chave da API.";
    if (!/^https:\/\/\S+$/.test(entrada.url.trim())) erros.url = "A URL do servidor precisa começar com https://";
  }

  return Object.keys(erros).length === 0 ? { ok: true } : { ok: false, erros };
}

/** Modelos de mensagem do design (somente leitura). Os modelos são aprovados pela Meta antes do uso. */
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
