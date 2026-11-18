# ERP Flow — Fluxos de operação

## 1. Visão geral do ciclo mensal
```mermaid
flowchart TD
  A[Contratos ativos] --> B[Gerar cobranças do mês]
  B --> C{Pagou?}
  C -- sim --> D[Registrar pagamento]
  C -- não --> X[Inadimplência: lembrete e acordo]
  X --> C
  D --> E[Lançamentos do locador<br/>despesas e créditos]
  E --> F[Calcular taxa 10% sobre aluguel pago]
  F --> G[Gerar relatório mensal por locador]
  G --> H[Conferência do dono]
  H --> I[Baixar PDF e enviar manualmente]
```

## 2. Cadastro de novo contrato
```mermaid
flowchart LR
  L1[Locador existe?] -- não --> L2[Cadastrar locador]
  L1 -- sim --> I1
  L2 --> I1[Imóvel do locador existe?]
  I1 -- não --> I2[Cadastrar imóvel]
  I1 -- sim --> T1
  I2 --> T1[Buscar locatário por CPF/CNPJ]
  T1 -- não achou --> T2[Cadastrar locatário]
  T1 -- achou --> C1
  T2 --> C1[Contrato: aluguel, taxa, início, fim]
  C1 --> C2[Anexar PDF]
  C2 --> C3[Ativo]
```

## 3. Alteração de aluguel
1. Usuário escolhe o contrato e o **mês de vigência** (atual ou futuro).
2. Informa o novo valor.
3. Sistema grava em `alteracoes_aluguel` (histórico) e a partir daquele mês a cobrança usa o novo valor **para o mês inteiro**.
4. Mês passado não pode ser escolhido (sem retroativo). Cobrança já paga não é recalculada.

## 4. Encerramento de contrato
Status → `encerrado`, data de fim registrada; não gera cobranças a partir do mês seguinte; histórico preservado.

## 5. Relatório mensal (6 seções, A4 paisagem)
1. Cabeçalho: locador, competência, imobiliária.
2. Aluguéis recebidos por imóvel/locatário.
3. Taxa de administração.
4. Despesas descontadas (cobrar de locador).
5. Créditos/outros lançamentos.
6. Totais e valor líquido do repasse.

Critério: igual ao PDF modelo (ex.: Locatelli 11/2026 — 43.028 / 29.808 / 27.592,49).

## 6. Estados
| Entidade | Estados |
|---|---|
| Contrato | rascunho → ativo → encerrado |
| Cobrança mensal | aberta → paga / atrasada → paga / cancelada |
| Relatório | gerado → conferido |

## 7. Perfis × ações
| Ação | Admin | Operacional |
|---|---|---|
| Cadastros e contratos | ✔ | ✔ |
| Lançamentos e pagamentos | ✔ | ✔ |
| Gerar/enviar relatório | ✔ | ✔ |
| Conferir relatório | ✔ | — |
| Usuários e permissões | ✔ | — |
