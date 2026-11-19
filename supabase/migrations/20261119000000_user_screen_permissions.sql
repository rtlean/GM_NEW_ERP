-- US-2.2: telas liberadas para o perfil operacional (aditiva; não altera tabelas existentes).
-- Aplicar no banco de produção só após aprovação do dono do projeto.
create table if not exists public.user_screen_permissions (
  id bigint generated always as identity primary key,
  company_id integer not null default 1,
  user_id integer not null references public.users (id),
  screen_key text not null,
  created_at timestamptz not null default now(),
  unique (company_id, user_id, screen_key)
);

create index if not exists user_screen_permissions_user_idx
  on public.user_screen_permissions (user_id);

-- Só o servidor (chave secreta) lê ou grava esta tabela.
alter table public.user_screen_permissions enable row level security;
