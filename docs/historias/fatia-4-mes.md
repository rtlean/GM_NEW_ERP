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
- Limite conhecido: o banco não tem trava única por contrato + competência. Dois cliques ao mesmo tempo podem criar duplicata. Trava no banco exige migração aprovada à parte.
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
