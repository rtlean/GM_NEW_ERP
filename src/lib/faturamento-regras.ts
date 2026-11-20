// Regras puras da tela Faturamento em lote (US-4.9). Sem banco. Valores em centavos.
// Decisão do dono: contrato só é bloqueado se o inquilino não tem nem e-mail nem WhatsApp de cobrança.

export type LinhaFaturamento = {
  contratoId: number;
  inquilino: string;
  vencimento: string;
  aluguelCentavos: number;
  /** Inquilino sem e-mail e sem WhatsApp de cobrança. */
  semContato: boolean;
  /** Já existe cobrança deste contrato na competência. */
  jaGerada: boolean;
  /** Inquilino com cobrança de mês anterior ainda com saldo em aberto. */
  emAtraso: boolean;
};

export type SituacaoLinha = {
  texto: string;
  cor: string;
  /** Não pode ser marcada (bloqueio por e-mail ou já gerada). */
  bloqueada: boolean;
  /** Começa marcada na prévia. */
  marcadaInicialmente: boolean;
};

export function situacaoDaLinha(linha: LinhaFaturamento): SituacaoLinha {
  if (linha.jaGerada) return { texto: "Cobrança já gerada", cor: "#4F5B72", bloqueada: true, marcadaInicialmente: false };
  if (linha.semContato) return { texto: "Falta e-mail ou WhatsApp", cor: "#A9480B", bloqueada: true, marcadaInicialmente: false };
  if (linha.emAtraso) return { texto: "Inquilino em atraso", cor: "#A32020", bloqueada: false, marcadaInicialmente: true };
  return { texto: "Pronta", cor: "#4F5B72", bloqueada: false, marcadaInicialmente: true };
}

function preenchido(valor: string | null | undefined): boolean {
  return typeof valor === "string" && valor.trim().length > 0;
}

/** Tem como cobrar: e-mail ou WhatsApp cadastrados. */
export function temContatoDeCobranca(email: string | null | undefined, telefone: string | null | undefined): boolean {
  return preenchido(email) || preenchido(telefone);
}

/** Soma o aluguel das linhas marcadas. Só conta linhas que existem na prévia. */
export function totalDaSelecao(linhas: LinhaFaturamento[], marcados: Set<number>): number {
  return linhas.filter((l) => marcados.has(l.contratoId)).reduce((soma, l) => soma + l.aluguelCentavos, 0);
}

/**
 * Confere a seleção antes de gravar. Nunca confia só na tela: o servidor refaz a checagem.
 * Devolve os contratos a gerar ou o motivo da recusa.
 */
export function validarSelecao(
  linhas: LinhaFaturamento[],
  pedidos: number[],
): { ok: true; contratoIds: number[] } | { ok: false; erro: string } {
  const unicos = [...new Set(pedidos)];
  if (unicos.length === 0) return { ok: false, erro: "Marque pelo menos um contrato para gerar." };

  const porId = new Map(linhas.map((l) => [l.contratoId, l]));
  for (const id of unicos) {
    const linha = porId.get(id);
    if (!linha) return { ok: false, erro: `O contrato ${id} não está na lista deste mês. Atualize a tela.` };
    if (linha.jaGerada) return { ok: false, erro: `O contrato ${id} já tem cobrança neste mês. Tire a marcação dele.` };
    if (linha.semContato) return { ok: false, erro: `O contrato ${id} está bloqueado: o inquilino ${linha.inquilino} não tem e-mail nem WhatsApp de cobrança.` };
  }
  return { ok: true, contratoIds: unicos };
}
