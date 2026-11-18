# Fatia 5 — Relatório mensal e Dashboard

**Objetivo:** relatório por locador igual ao modelo antigo, em PDF, e visão do mês para o dono.
**Pronto quando:** o relatório Locatelli 11/2026 sai idêntico ao PDF modelo.
Envio por e-mail/WhatsApp está **fora do escopo**: o PDF é baixado e enviado manualmente.

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
