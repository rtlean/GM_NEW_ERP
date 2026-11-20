# Esquema do Backend — banco existente

## 1. Decisão (18/11/2026)
O ERP usa o **mesmo banco e as mesmas tabelas** do sistema antigo: Supabase `azdqwlvcltbooxbnjetv` (https://azdqwlvcltbooxbnjetv.supabase.co).
O sistema antigo **continua em uso** sobre essas tabelas. Consequências:

- O app (Next.js, no servidor) **lê e grava nas tabelas existentes** com `@supabase/supabase-js`. Não cria esquema novo.
- Mudanças de banco são **só aditivas** (nova coluna anulável, nova tabela, novo índice) via migration SQL versionada em `supabase/migrations/`, testada antes em branch do Supabase. **Nunca** renomear, apagar ou mudar tipo de coluna existente enquanto o sistema antigo estiver ativo.
- Tipos TypeScript gerados do banco em `src/lib/database.types.ts` (Supabase CLI `gen types`).
- Toda consulta filtra `company_id = 1` (o banco é multiempresa, mas só existe 1 empresa).
- As tabelas `Locadores`/`Locatários` do projeto CRM_GM_IMOBILI-RIA deixam de ser usadas.

## 2. Tabelas usadas na v1
| Módulo | Tabela | Colunas principais | Linhas (18/11) |
|---|---|---|---|
| auth/usuarios | `users` + `company_users` | name, email, password_hash, role (`user`/`admin`), status (`active`/`inactive`), must_change_password | 5 / 3 |
| locadores | `owners` | full_name, document, email, city, phone, admin_fee_percent_basis_points, dados bancários e Pix | 22 |
| locatarios | `tenants` | full_name, cpf, document (CPF/CNPJ limpo, único por empresa), email, phone, owner_id (legado; o vínculo real está em tenant_owners), rent_cents e property_type (não editados pela tela) | 88 |
| vínculo locatário–locador | `tenant_owners` | tenant_id, owner_id, company_id (único por trio); um locatário pode ter vários locadores. A tela de locatários não grava mais este vínculo (ele nasce no contrato, US-3.5) | 88 |
| imoveis | `properties` | code, type, address, city, state, zip_code, rent_cents, occupancy_status, owner_id | 90 |
| contratos | `contracts` | property_id, tenant_id, start_date, end_date, rent_cents, status (`active`/`ended`/`draft`), admin_fee_percent_basis_points | 90 |
| contratos | `contract_rent_changes` | contract_id, rent_cents, previous_rent_cents, effective_date | 2 |
| contratos | `contract_documents` | contract_id, file_name, storage_key, storage_url | 7 |
| mês | `monthly_entries` | contract_id, competence (`AAAA-MM`), due_date, payment_date, status, rent_cents, paid_cents, pending_cents, encargos | 223 |
| lançamentos | `monthly_expense_items` | competence, owner_id, property_id, description, amount_cents, charged_to | 95 |
| relatórios | `generated_reports`, `report_notes`, `report_exclusions`, `competence_closures` | — | 234 / 6 / 1 / 4 |
| auditoria | `audit_events` | — | 2770 |

Tabelas fora da v1 (não mexer): `financial_ledger_entries`, `expense_allocations`, `owner_repasses`, `owner_repass_methods`, `controles_conta`, `descontos_acrescimos*`, `tenant_debts*`, `pendency_receipts`, `dashboard_action_items`, `contract_document_analyses`, `contract_divergences`, `brand_settings`, `company_settings*`, `contratos` (vazia, legado).

## 3. Pontos de atenção
| # | Ponto | Tratamento |
|---|---|---|
| 1 | Senhas em `users.password_hash` não estão em BCrypt (formato do app antigo, não identificado) | **Aprovado pelo dono.** Na Fatia 2: login pelo **Supabase Auth**; cada usuário define nova senha no 1º acesso. O perfil (admin/user) continua vindo de `users.role` pelo e-mail. Senhas antigas não são reaproveitadas |
| 2 | Competência é texto `AAAA-MM`, não data | Manter o formato; conversão no TypeScript |
| 3 | `tenants` também guarda `owner_id`/`rent_cents` (duplicado de `contracts`) | Fonte oficial do aluguel = `contracts` + `contract_rent_changes`; não gravar mais em `tenants.rent_cents` sem decisão |
| 4 | Sistema antigo aplica regra proporcional (RN01) em mudança de aluguel | **Decidido:** vale o mês inteiro. Alterar aluguel só pelo ERP novo; histórico antigo fica como foi cobrado |
| 5 | Sistema antigo **parado** por decisão do dono (18/11/2026) | ERP novo é o único que grava; mesmo assim, toda mudança de esquema é testada antes em **branch** do Supabase. Movimentações feitas fora do sistema nesse intervalo serão lançadas no ERP |
| 6 | `contracts.start_date` é `timestamptz` | Ler como data local (America/Sao_Paulo) |
| 7 | Arquivos do contrato (PDF ou Word) em `contract_documents.storage_key`, bucket privado `contract-documents` | Ler e gravar só pelo servidor; o navegador recebe os bytes pela rota `/api/contratos/{id}/arquivo` |

## 4. Aluguel vigente (regra do mês inteiro)
Aluguel da competência M = `rent_cents` da última `contract_rent_changes` com `effective_date` ≤ 1º dia de M; se não houver, `contracts.rent_cents`. Implementado em `src/lib/aluguel.ts` (`aluguelVigente`) com teste.

## Migração 2026-11-19 (US-3.3, tenants_multi_owner) — aditiva
- `owners.city` (nova): cidade do locador.
- `tenants.document` (nova): CPF/CNPJ só dígitos, preenchida a partir de `cpf`. Índice único parcial por (company_id, document).
- `tenant_owners` (nova): vínculo locatário–locador. Preenchida com o `tenants.owner_id` atual (88 vínculos). RLS ligada, sem políticas (acesso só pelo servidor).
- `tenants.owner_id` e `tenants.cpf` continuam existindo, só não são mais a fonte do vínculo nem do documento.
- Testada numa transação com ROLLBACK antes de aplicar.

## Migração 2026-11-19 (US-3.4, properties_detalhes_endereco) — aditiva
- `properties.numero`, `complemento`, `bairro`, `caracteristicas` (novas, texto, opcionais). Os 90 imóveis continuam os mesmos; as colunas ficam vazias até o cadastro preencher.
- `properties.address` continua guardando o endereço (logradouro).
- Testada numa transação com ROLLBACK antes de aplicar.

## Migração 2026-11-20: detalhes do imóvel (design)

Arquivo: `supabase/migrations/20261120090000_properties_detalhes_design_imoveis.sql`. Aditiva, aplicada em produção com aprovação do dono.

- `occupancy_status`: novo valor `sold` (Vendido).
- `properties`: `name`, `finality`, `matricula`, `iptu_registration`, `bedrooms`, `suites`, `bathrooms`, `parking_spots`, `useful_area_m2`, `total_area_m2`, `floor`, `furnishing`, `pets_allowed`, `sale_value_cents`, `condominium_cents`, `iptu_cents`, `amenities` (text[]).
- Valores monetários em centavos (inteiro). Áreas em m² (numeric 10,2).

## Migração: nenhuma (US-3.6, anexo do contrato)
- Usa `contract_documents` como está: `contract_id`, `file_name`, `mime_type` (PDF ou Word), `storage_key`, `version` (1, 2, 3...), `created_by`, `updated_by`.
- Cada envio é uma linha nova. A versão atual é a de maior `version` do contrato. Nada é apagado.
- Eventos de auditoria: `entity = contract`, `action = contract.document_uploaded` ou `contract.document_replaced`, `metadata` em JSON texto (`versao`, `versaoAnterior`, `arquivo`, `tipo`).
- Os 7 registros antigos têm `contract_id` vazio e não aparecem em nenhum contrato.

## Migração: nenhuma (US-3.7, alterar aluguel)
- Usa `contract_rent_changes` como está. Aluguel do mês = última alteração com `effective_date` até o dia 1 do mês; sem alteração, `contracts.rent_cents`.
- Auditoria: `entity = contract`, `action = contract.rent_changed`, `metadata` JSON texto (`competencia`, `anteriorCentavos`, `novoCentavos`, `observacao`).
- Lista de contratos, Dashboard e locatários leem o aluguel do mês atual em lote (`aluguelNoMesPorContrato`).

