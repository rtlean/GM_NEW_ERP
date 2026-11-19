# Fatia 2 — Acesso

**Pronto quando:** só usuários ativos entram e a secretária não acessa Usuários.

## US-2.1 Entrar e sair
**Como** usuário **quero** entrar com e-mail e senha **para** acessar o ERP.
- Tela `/login` (layout do protótipo) com Supabase Auth (e-mail e senha), sessão em cookie via `@supabase/ssr`.
- Sem sessão, qualquer página leva ao `/login`; "Sair" encerra a sessão.
- Senha errada → "E-mail ou senha incorretos".

Tamanho: M

## US-2.2 Perfis
**Como** dono **quero** perfis admin e operacional **para** limitar o acesso.
- Perfil lido de `users.role` pelo e-mail do login (`admin` / `user`); `status = inactive` não entra.
- Menu esconde "Usuários" para `user`; página e ações de admin conferem o perfil no servidor.
- Teste das permissões dos dois perfis.

Tamanho: M · Depende de: US-2.1

## US-2.3 Gerenciar usuários
**Como** dono **quero** criar, desativar e redefinir senha **para** controlar quem acessa.
- Criar: convite do Supabase Auth + linha em `users` (perfil escolhido).
- Desativar: `users.status = inactive` (não apaga). Não posso desativar a mim mesmo nem o último admin.
- Usuários iniciais: dono (admin) e secretária (user), cada um define a própria senha.

Tamanho: M · Depende de: US-2.2

## Notas de implementação (US-2.2, branch feat/us-2.2)
- Regras de acesso em `src/lib/permissoes.ts` (função pura, com testes). Dados em `src/lib/usuarios.ts`; checagem no servidor em `src/lib/acesso.ts`.
- Tabela nova `user_screen_permissions` (aditiva), em `supabase/migrations/20261119000000_user_screen_permissions.sql`. **Não aplicada em produção**: depende de aprovação do dono.
- Telas liberadas para o perfil operacional são guardadas em `user_screen_permissions`. "usuarios" é exclusiva do admin.
- Conta bloqueada (`status = inactive`) não entra e é desconectada. Tela sem permissão responde 404.
- Login leva o usuário para a primeira tela liberada. Sem nenhuma tela liberada, mostra "Seu acesso ainda não tem telas liberadas".
- Layout raiz é dinâmico (`force-dynamic`): o menu depende de quem está logado. Build não precisa das chaves do Supabase.
