# Fatia 5 — Relatório mensal e Dashboard

**Objetivo:** relatório por locador igual ao modelo antigo, em PDF, e visão do mês para o dono.
**Pronto quando:** o relatório Locatelli 11/2026 sai idêntico ao PDF modelo.
Envio por e-mail/WhatsApp **não é automático**: os botões abrem o próprio app (e-mail ou WhatsApp) com texto pronto e o PDF é anexado manualmente (decisão do dono, 20/11/2026).

## US-5.1 Calcular o relatório
**Como** dono **quero** os números calculados pelo back-end **para** ter um resultado único e confiável.
- `GET /api/relatorios/{locadorId}/{competencia}` retorna: aluguéis recebidos, taxa, despesas descontadas, créditos e líquido.
- Teste com dados do Locatelli 11/2026 (confirmados pelo dono em 20/11/2026): previsto R$ 43.028,00 e total recebido R$ 29.808,00. Taxa 0% (acordo entre o locador e o Geruzio, como está no banco). O valor R$ 27.592,49 do sistema antigo não é usado como teste.

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


## Implementação (feat/us-5.1-relatorio)
- Tela `/relatorio` segue o design `RelatorioMensal.dc.html` e o PDF `RelatorioPDF.dc.html`, com todas as linhas do design.
- Números vêm da mesma conta da tela de Repasses (taxa sobre o aluguel pago, despesas cobradas do locador). Nada é gravado.
- Seguro imóvel e seguro fiança ficam zerados até o módulo de Seguros existir. Taxa de pintura, água, luz e limpeza vêm das despesas do mês.
- "Valor boleto" = aluguel mais multa (decisão do dono, 20/11/2026).
- "Valor líquido recebido" = total recebido. "Valor líquido a repassar" = total recebido menos taxa e despesas do locador.
- Desempenho das locações fica fora desta versão (decisão do dono).
- Botões de e-mail e WhatsApp abrem o app com texto pronto. Não enviam sozinhos.
- Pendente: campo CONFERIDO (só admin), da US-5.3.

## Correção de layout e página de Desempenho (feat/us-5.2-correcao-relatorio)
- Folha em cinco páginas A4 paisagem, como o design: (1) Locatários e totais, (2) Rateio e Pendências, (3) Resumo final e Despesa do mês, (4) Conta para repasse, (5) Desempenho das locações.
- Cabeçalho em todas as páginas: logo (`public/logo.png`), linha dourada, PROPRIETÁRIO e CIDADE.
- Tabelas com largura fixa de colunas, sem barra de rolagem na impressão (a tabela de locatários cabe na página).
- Desempenho: receita prevista e recebida dos seis meses até a competência (mês sem cobrança aparece como "sem dados"); ocupação dos imóveis do locador; variação do recebido em relação ao mês anterior; locatários ativos; índice de recebimento.
- Fora desta versão, por falta de regra definida: "Crescimento da receita", "Saúde da carteira" (pontuação) e "Por que esta classificação?".
- Impressão: `@page` A4 paisagem sem margem (a margem é o próprio espaçamento das páginas).

## Implementação — US-5.3 Conferido e UF do locador (feat/us-5.3-conferido)
- Botão "Marcar como conferido" / "Desmarcar conferido" na tela do relatório. Só administrador vê e usa o botão; o servidor confere o perfil antes de gravar.
- Quem marcou e quando aparece na tela e, no PDF, em uma linha "CONFERIDO por … em …" no cabeçalho.
- Cada alteração vai para a auditoria.
- Cadastro do locador: campo UF ao lado da cidade (2 letras, opcional). O cabeçalho mostra "Cidade / UF" puxado do cadastro; sem cidade, o campo fica vazio.
- Nome do arquivo ao baixar o PDF: já estava pronto (Relatorio_<locador>_<aaaa-mm>).
- Migração aditiva `20261121120000_relatorio_conferencia_e_uf_locador.sql`, testada num banco temporário e aplicada em produção com aprovação do dono (21/11/2026).

Roteiro de teste (como admin):
1. Abra Relatório mensal, competência 11/2026, locador Locatelli.
2. Clique em "Marcar como conferido": o texto muda para "Conferido por <seu nome> em <data e hora>".
3. Clique em "Desmarcar conferido": volta para "Não conferido".
4. Entre com um usuário operacional (perfil user): o botão não aparece.
5. Com o relatório conferido, baixe o PDF: a linha CONFERIDO aparece no cabeçalho.


## Implementação — US-5.4 Compartilhar PDF por e-mail e WhatsApp (feat/us-5.4-enviar-pdf)
- Os botões "Enviar por e-mail" e "Enviar por WhatsApp" (só texto, sem anexo) foram trocados por "Compartilhar PDF".
- O PDF é gerado no próprio navegador a partir da prévia do relatório (biblioteca `html2pdf.js`, usada só para isso). Nada é enviado pelo servidor.
- Celular com suporte: abre a janela de compartilhamento do aparelho já com o PDF anexado (WhatsApp, e-mail etc.).
- Aparelho sem suporte a anexo: baixa o PDF e mostra os links "Abrir e-mail" e "Abrir WhatsApp" com a mensagem pronta; a pessoa anexa o arquivo manualmente.
- O "Baixar PDF" continua igual (impressão do navegador).
- Limitação conhecida: o PDF gerado por esse método é uma imagem das páginas, não texto selecionável.

Roteiro de teste:
1. Abra Relatório mensal, competência 11/2026, locador Locatelli.
2. Clique em "Compartilhar PDF". No celular, escolha WhatsApp ou e-mail: o PDF deve aparecer anexado.
3. No computador, se aparecer a mensagem de que o PDF foi baixado, clique em "Abrir WhatsApp" ou "Abrir e-mail" e anexe o arquivo baixado.
4. Compare o PDF recebido com o "Baixar PDF": as 5 páginas e o cabeçalho devem estar iguais.
