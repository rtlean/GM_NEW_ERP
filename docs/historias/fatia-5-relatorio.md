# Fatia 5 — Relatório mensal e Dashboard

**Objetivo:** relatório por locador igual ao modelo antigo, em PDF, e visão do mês para o dono.
**Pronto quando:** o relatório Locatelli 11/2026 sai idêntico ao PDF modelo.
Envio por e-mail/WhatsApp **não é automático**: os botões abrem o próprio app (e-mail ou WhatsApp) com texto pronto e o PDF é anexado manualmente (decisão do dono, 20/11/2026).

## US-5.1 Calcular o relatório
**Como** dono **quero** os números calculados pelo back-end **para** ter um resultado único e confiável.
- `GET /api/relatorios/{locadorId}/{competencia}` retorna: aluguéis recebidos, taxa, despesas descontadas, créditos e líquido.
- Teste com dados do Locatelli 11/2026: totais 43.028 / 29.808 / 27.592,49.

Tamanho: M · Depende de: US-4.4, US-4.5

## US-5.2 Prévia em A4 paisagem
**Como** secretária **quero** ver o relatório como será impresso **para** conferir.
- 6 seções: cabeçalho, aluguéis, taxa, despesas, créditos, totais/líquido.
- CSS de impressão A4 paisagem, sem cortar linhas entre páginas, logo e cores da marca.
- Dono aprova comparando com o PDF modelo.

Tamanho: G → dividir em 5.2a (layout) e 5.2b (paginação) · Depende de: US-5.1

## US-5.3 Baixar PDF e conferir
**Como** dono **quero** baixar o PDF e marcar como conferido **para** enviar ao locador.
- "Baixar PDF" abre a impressão do navegador com nome sugerido `Relatorio_<locador>_<mm-aaaa>`.
- Só ADMIN marca `CONFERIDO`; fica registrado quem e quando.

Tamanho: P · Depende de: US-5.2

## US-5.4 Dashboard
**Como** dono **quero** ver o mês em uma tela **para** decidir rápido.
- Cards: aluguel previsto, recebido, em aberto, taxa do mês.
- Lista de cobranças em atraso; alertas de cadastro incompleto (sem WhatsApp, sem tipo, aluguel zero).
- Filtro por competência.

Tamanho: M · Depende de: US-4.3

## Nota de implementação — Dashboard "Carteira" (layout do design, branch feat/dashboard)
Primeira versão da tela, antes da US-4.3 (mês e cobranças). Os valores vêm só dos cadastros atuais:
- **Aluguéis cadastrados por mês:** soma do aluguel de todos os contratos ativos. Não é o valor recebido (nota fixa na tela).
- **Indicadores:** registros de locação (contratos ativos), locadores e registros a revisar (soma dos itens de "O que revisar").
- **O que revisar:**
  - Taxa de administração: contratos sem taxa própria e sem taxa no locador; e quantos usam a taxa do locador.
  - Valores a conferir: aluguel zerado, ou diferente do aluguel cadastrado no imóvel. Não é corrigido automaticamente.
  - Possíveis duplicidades: locatários com nome parecido (mesma regra do cadastro).
  - Cadastros incompletos: locatários sem telefone e imóveis sem tipo.
- **Aluguel por tipo de imóvel:** categorias Kitnet, Apartamento, Casa, Loja e ponto comercial, Sala comercial, Galpão, Garagem, Outro e Não informado. Tipo que não se encaixa vai para "Outro". Barras sem números (valor aparece ao passar o mouse).
- **Maiores locadores:** top 6 pelo aluguel dos contratos ativos dos imóveis de cada locador.

Regras puras em `src/lib/dashboard-regras.ts` (testadas). Leitura em cada módulo: `listarContratosAtivosParaPainel`, `listarImoveisParaPainel`, `listarLocadoresParaPainel`, `listarLocatariosParaPainel`.
