-- US-5.3 Relatório mensal: marcar CONFERIDO e UF do locador.
-- Aditiva: só cria a coluna de UF (vazia nos cadastros atuais) e a tabela nova de conferência.
-- Nada é renomeado, apagado ou alterado de tipo. Desmarcar conferência muda o status, não apaga a linha.
-- Para desfazer: drop table public.relatorio_conferencias; alter table public.owners drop column state;
--   (só se nenhum dado novo tiver sido gravado nelas).

alter table public.owners add column if not exists state character varying(2);

create table if not exists public.relatorio_conferencias (
  id bigserial primary key,
  company_id integer not null default 1,
  owner_id integer not null references public.owners(id),
  competence character varying(7) not null check (competence ~ '^[0-9]{4}-[0-9]{2}$'),
  conferido boolean not null default false,
  conferido_por integer references public.users(id),
  conferido_em timestamp with time zone,
  constraint relatorio_conferencias_unica unique (company_id, owner_id, competence)
);

alter table public.relatorio_conferencias enable row level security;
