# CLAUDE.md — Regras do projeto

@AGENTS.md

## Contexto
ERP de gestão de locação da GM Soluções Imobiliárias (Rio Bananal/ES). Usuários: dono (admin) e secretária (operacional).
Leia `docs/01-PRD.md`, `docs/02-TRD.md`, `docs/05-Backend-Schema.md` e a história da tarefa antes de começar.
O dono do projeto **não é programador**: explique cada decisão em português simples e diga o que ele deve testar.

## Escopo (v1)
Login/usuários, Locadores, Locatários, Imóveis, Contratos, Lançamentos, Relatório mensal (PDF) e Dashboard.
**Fora — não implementar nem preparar código para:** Pix, NFS-e, e-mail automático, Consórcio, Financiamento, Conta digital. (Sicredi e WhatsApp entram na v1 por decisão do dono em 19/11/2026.)

## Stack (não trocar sem aprovação)
- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS** — um único projeto, telas e servidor juntos.
- **Supabase** `azdqwlvcltbooxbnjetv`: banco com as **tabelas existentes** (owners, tenants, properties, contracts...) e **Supabase Auth** para login.
- Acesso ao banco **só no servidor** (Server Components, Server Actions, Route Handlers) com `@supabase/supabase-js`. A chave secreta nunca vai para o navegador.
- Testes: **Vitest**. Publicação: VPS da Integrator (`output: "standalone"`), ver `docs/08-Deploy-VPS.md`.

## Organização
- `src/app/<modulo>/` — telas de cada módulo: `dashboard`, `imoveis`, `contratos`, `locadores`, `locatarios`, `lancamentos`, `relatorio`, `usuarios`, `login`.
- `src/lib/<modulo>.ts` — regras e acesso a dados de cada módulo (um módulo não consulta tabela de outro; chama a função dele).
- `src/components/` — componentes visuais reutilizáveis. Tokens de cor em `src/app/globals.css` (`docs/04-UI-UX.md`).

## Forma de trabalho
1. Uma história por vez (`docs/historias/`). **Mostre o plano antes do código** e espere o "ok".
2. Branch `feat/us-X.Y`, nunca direto na `main`.
3. Antes de entregar: `npm run lint`, `npm test` e `npm run build` passando; roteiro de teste manual em 3–5 passos; PR.
4. Atualize a documentação afetada no mesmo PR.

## Padrões
- Dinheiro em **centavos** (inteiro). Nunca somar reais com casas decimais em `number`.
- Competência é texto `AAAA-MM` (formato do banco).
- Toda consulta filtra `company_id = 1`.
- Telefone salvo em `phone` só dígitos E.164 (`5527999998888`). CPF/CNPJ só dígitos/letras (CNPJ alfanumérico suportado).
- Mudança de banco: SQL em `supabase/migrations/`, **só aditiva** (nunca renomear/apagar/mudar tipo), testada em branch antes.
- Textos da interface em português do Brasil.

## Proibido
- Chaves, senhas ou tokens no código/Git. Use `.env.local` (ignorado) e as variáveis do servidor.
- `SUPABASE_SECRET_KEY` (service role) em componente com `"use client"` ou em variável `NEXT_PUBLIC_*`.
- Gravar ou alterar estrutura no banco de produção sem aprovação do dono do projeto.
- Apagar registros de negócio (use status).
- Adicionar dependência sem dizer para que serve.

## Regras de negócio
- Imóvel pertence a um locador. Locatário é único por CPF/CNPJ e pode ter contratos com vários locadores.
- Alteração de aluguel vale para o **mês inteiro** escolhido: sem proporcional, sem retroativo (decisão de 18/11/2026).
- Taxa de administração padrão 10% sobre aluguel pago, editável por locador (decisão do dono, 20/11/2026). Taxa incide só sobre o aluguel, não sobre multa nem seguro. Pagamento abate primeiro o aluguel (decisão do dono, 20/11/2026): a base da taxa é o menor valor entre o pago e o aluguel da cobrança.
- Despesas "cobrar de locador" são descontadas no relatório mensal.
- Perfis: `admin` (tudo) e `user` = operacional (sem usuários, sem excluir), de `users.role`.
