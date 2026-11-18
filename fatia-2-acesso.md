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
