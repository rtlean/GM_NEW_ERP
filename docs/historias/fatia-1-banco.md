# Fatia 1 — Banco (tabelas existentes)

**Pronto quando:** `/locadores` lista os 22 locadores reais, somente leitura.

## US-1.1 Conexão com o Supabase
**Como** construtor **quero** o app conectado ao Supabase **para** usar os dados reais.
- `src/lib/supabase/server.ts` cria o cliente **só no servidor** com `SUPABASE_SECRET_KEY` (`import "server-only"`).
- `.env.example` com as 3 variáveis do TRD §5, sem valores.
- Tipos gerados em `src/lib/database.types.ts`.
- Teste: build falha se a chave secreta for importada em componente cliente (`server-only`).

Tamanho: P · Pré-requisito: chaves no `.env.local`

## US-1.2 Lista de locadores (leitura)
**Como** dono **quero** ver os locadores reais **para** confirmar a conexão.
- `/locadores`: tabela com nome, CPF/CNPJ mascarado, telefone, nº de imóveis; busca por nome ou documento.
- Só `company_id = 1`; nenhuma gravação.

Tamanho: P · Depende de: US-1.1

## US-1.3 Regra do aluguel vigente
**Como** dono **quero** a regra do mês inteiro num só lugar **para** não errar valores.
- `aluguelVigente(contrato, mudanças, "AAAA-MM")` em `src/lib/aluguel.ts`: última `contract_rent_changes` com `effective_date` ≤ dia 1 do mês; senão `contracts.rent_cents`.
- Teste: R$ 1.000 → R$ 1.200 a partir de 2027-03 → 100000 (2027-02), 120000 (2027-03 e 2027-04).

Tamanho: P
