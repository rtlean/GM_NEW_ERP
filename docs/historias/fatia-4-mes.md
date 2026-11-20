# Fatia 4 — Operação do mês

**Objetivo:** gerar o aluguel do mês, registrar pagamentos e lançamentos e calcular a taxa.
**Pronto quando:** os totais do mês no ERP batem com a conferência do dono.

## US-4.1 Gerar cobranças do mês
**Como** secretária **quero** gerar as cobranças de uma competência **para** saber o que deve ser recebido.
- Dado competência 12/2026, quando clico "Gerar", então cria 1 cobrança por contrato ativo com o aluguel vigente e vencimento **no dia 10** do mês (decisão do dono, 20/11/2026: igual ao sistema antigo).
- Dado que gero de novo, então não duplica (único por contrato + competência).
- Mostra resumo: quantidade e total.

Tamanho: M · Depende de: US-3.7

**Entregue (feat/us-4.1-gerar-cobrancas)** — decisões do dono:
- Tela nova **Cobranças** (`/cobranca`), com o botão "Gerar cobranças de MM/AAAA" e o resumo: criadas, já existentes e total.
- Só cria para contrato ativo que ainda não tem cobrança no mês. Cobrança que já existe (ex.: set/out/nov de 2026, vindas do sistema antigo) não é alterada nem duplicada.
- Aluguel do mês pela regra já testada (`src/lib/aluguel.ts`). A função `fn_aluguel_vigente`, citada acima, não existe no banco.
- Grava em `monthly_entries`: pago zero, pendente igual ao aluguel, status `open`. Auditoria `charges.generated`. Nada apagado.
- Não duplica: o banco já tem trava única por contrato + competência (`monthly_entries_contract_competence_uq`). Dois cliques ao mesmo tempo não criam duplicata: o segundo ignora a linha que já existe.
- Tela de atrasos, negociação e negativação (US-4.3) continuam fora desta entrega; o desenho `Cobranca.dc.html` é dessa tela.

## US-4.2 Registrar pagamento
**Como** secretária **quero** marcar uma cobrança como paga **para** controlar o recebido.
- Informo data e valor pago; status vira `paga`.
- Dado valor pago diferente do devido, então pede confirmação e registra a diferença.
- Posso desfazer um pagamento (com motivo, fica na auditoria).

Tamanho: M · Depende de: US-4.1

## US-4.3 Ver atrasos
**Como** dono **quero** ver cobranças vencidas **para** agir rápido.
- Dado cobrança aberta com vencimento passado, então aparece como `atrasada` e com dias de atraso.
- Filtro por competência, locador e status; total em aberto no rodapé.

Tamanho: P · Depende de: US-4.1

## US-4.4 Lançamentos do locador
**Como** secretária **quero** lançar despesas e créditos por locador e mês **para** que entrem no relatório.
- Campos: locador*, competência*, contrato (opcional), descrição*, valor*, cobrar de (locador/locatário).
- Despesas "cobrar de locador" serão descontadas no relatório.
- Lista por locador e competência com total; editar e excluir (exclusão só admin).

Tamanho: M · Depende de: US-3.2

**Entregue (feat/lancamentos-locador)** — decisões do dono:
- Categoria obrigatória, vinda das contas de controle ativas (`controles_conta`, `ativo = true`), gravada em `control_account_id`.
- Imóvel opcional no lugar de contrato ("Geral do locador" quando vazio). O imóvel tem de ser do próprio locador.
- Sem exclusão nesta etapa: corrigir é editar. Auditoria `expense.created` / `expense.updated`.
- "Cobrar de": locador ou locatário. "Imobiliária" do design **não** entra (o banco não aceita esse valor).
- Prévia para o relatório (aluguéis dos imóveis, despesas cobradas do locador, saldo antes da taxa), como no design. O PDF do relatório fica para a fatia 5.
- Cobranças do mês (US-4.1 a 4.3) continuam fora desta entrega.

## US-4.5 Calcular taxa de administração
**Como** dono **quero** a taxa calculada automaticamente **para** não errar contas.
- Taxa = valor pago × `taxa_bp` / 10000, arredondada ao centavo (meio para cima).
- Só sobre aluguel **pago** na competência.
- Teste: aluguel pago R$ 1.850,00 com 10% → R$ 185,00; R$ 1.234,55 → R$ 123,46.
- ⚠️ Confirmar regra de arredondamento com o modelo antigo (Locatelli 11/2026).

Tamanho: P · Depende de: US-4.2

## US-4.6 Reajuste pelo índice (entregue em feat/us-4.6-reajustes)
**Como** secretária **quero** agendar o reajuste anual do aluguel **para** aplicar o índice no aniversário do contrato.
- Tela **Reajustes**: contratos ativos com aniversário nos próximos 60 dias. Cada linha tem índice, percentual, valor atual e novo valor.
- O novo valor é o atual × (1 + percentual), arredondado para o centavo. Vale a partir do aniversário, para o mês inteiro, sem retroativo.
- Grava pela alteração de aluguel (US-3.7): linha nova em `contract_rent_changes`, com observação "Reajuste IPCA 4,50%". Nada é apagado.
- Não aplica duas vezes: se já existe reajuste daquele contrato na mesma data, recusa.
- Auditoria: a alteração de aluguel já registra `contract.rent_changed`.

Fora desta história: renovações com aditivo (envio para assinatura, tela "Renovações" do desenho).

## US-4.7 Aditivo de reajuste em PDF (em feat/us-4.7-aditivo-reajuste)
**Como** secretária **quero** gerar o aditivo do reajuste já agendado **para** ter o documento para o locador e o locatário.
- Na tela Reajustes, seção "Reajustes agendados · aditivo": botão **Gerar aditivo** em cada reajuste agendado.
- PDF com a logo da Soluções Imobiliárias, dados do locador, locatário e imóvel, índice, percentual, valor anterior e novo, e vigência. Sem testemunhas e sem validação jurídica (uso interno).
- Os valores vêm da alteração de aluguel já gravada (não são digitados de novo).
- Guardado como nova versão em `contract_documents` (bucket privado `contract-documents`). Nada é apagado.
- Recusa se faltar CPF/CNPJ do locador ou do locatário.
- Auditoria: `contract.addendum_generated`.
- Sem migração: usa as tabelas existentes. Dependência nova: `pdf-lib`.
- Efeito colateral: o aditivo passa a ser a versão atual do arquivo do contrato (a maior versão). Ver a PR.

## US-4.8 Repasses manuais ao locador (em feat/us-4.8-repasses)
**Como** secretária **quero** liberar o repasse de cada locador **para** registrar o que foi pago, sem fazer o Pix pelo sistema.
- Tela **Repasses** por competência. Para cada locador: recebido (aluguel pago), taxa, despesas cobradas do locador e repasse líquido.
- Taxa padrão 10%, editável por locador. Taxa incide só sobre o aluguel pago (não sobre multa nem seguro).
- Repasse = total recebido − taxa − despesas cobradas do locador (mesma regra do relatório mensal).
- **Liberar** grava em `owner_repasses`: data, valor, taxa (coluna nova `admin_fee_cents`) e os dados bancários e Pix do locador no momento.
- Um repasse por locador e competência. Não libera se já existe repasse, nem se o valor for zero ou negativo.
- Repasses antigos (51 linhas de outubro e novembro/2026, vindas do sistema antigo) ficam como estão, sem alteração. Foram erros de digitação do sistema antigo, e a tela os mostra como "Liberado em…".
- Sem Pix, TED nem repasse automático.
- Auditoria: `repass.released`.
- Migração aditiva: `20261120160000_owner_repasses_taxa.sql` (coluna `admin_fee_cents`, aceita vazio), aplicada em produção depois de teste em transação desfeita.


## US-4.9 Faturamento em lote (tela /faturamento, design `Faturamento.dc.html`)
**Como** secretária **quero** escolher os contratos do mês e gerar as cobranças de uma vez **para** conferir o total antes de gerar.
- Uma linha por contrato ativo: caixa de seleção, contrato, inquilino, vencimento, valor e situação.
- Total e quantidade atualizam conforme a seleção ("N de M selecionadas").
- Botão "Gerar cobranças" (decisão do dono, 20/11/2026: não "Emitir faturas", porque NFS-e está fora da v1). Gera só as linhas marcadas.
- Reaproveita a regra da US-4.1 (`gerarCobrancasDoMes`): vencimento dia 10, não duplica contrato + competência, não altera cobrança existente, auditoria `charges.generated`.
- Ajuste aditivo: `gerarCobrancasDoMes` aceita lista opcional de contratos. Sem lista, a US-4.1 continua igual.
- Após gerar: "N cobranças geradas" e link "Acompanhar cobrança" (para /cobranca). "Voltar à prévia" só limpa a tela, não apaga nada.
- Situação da linha: "Pronta", "Falta e-mail de cobrança", "Inquilino em atraso".
- **Bloqueio (decisão do dono, 20/11/2026):** contrato cujo inquilino não tem e-mail de cobrança cadastrado não pode ser gerado. A caixa fica desabilitada e a linha começa desmarcada.
- Permissão: tela `faturamento` (já existe em `permissoes.ts`).

Critérios:
- Dado 6 contratos ativos e 5 marcados, quando clico "Gerar", então são criadas 5 cobranças e a 6ª não existe.
- Dado que gero de novo o mesmo mês, então nada é duplicado (resumo mostra "já existentes").
- Dado nenhuma linha marcada, então o botão fica desabilitado.
- Dado contrato sem e-mail do inquilino, então a linha não pode ser marcada.

Tamanho: M · Depende de: US-4.1 (entregue)

**Implementada (feat/us-4.9-faturamento)** — arquivos: `src/lib/faturamento.ts`, `src/lib/faturamento-regras.ts`, `src/app/faturamento/`, `src/components/faturamento/`.
- Sem mudança de banco. Reaproveita `gerarCobrancasDoMes` com lista opcional de contratos.
- Definições escolhidas na implementação (dono confirma):
  - **Inquilino em atraso** = tem alguma cobrança de mês anterior com saldo em aberto (`pending_cents > 0`). Não bloqueia.
  - **Cobrança já gerada** = o contrato já tem cobrança no mês. Aparece bloqueado e desmarcado.
  - **Falta e-mail de cobrança** = inquilino sem e-mail preenchido. Bloqueia.
- O servidor refaz a checagem: um contrato bloqueado não é gerado mesmo que a tela seja alterada.
- Roteiro de teste manual: (1) abrir Faturamento no mês atual e conferir linhas e totais; (2) desmarcar uma linha e ver o total mudar; (3) tentar marcar um contrato sem e-mail (deve estar bloqueado); (4) gerar, conferir em Cobrança e gerar de novo (não pode duplicar).
