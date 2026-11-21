-- Pipeline (módulo incluído na v1 em 21/11/2026, docs/historias/fatia-pipeline.md).
-- Aditiva: cria só a tabela nova. Nada existente é renomeado, apagado ou alterado.
-- Não há exclusão de negócio no sistema: uma oportunidade só muda de etapa.
-- Para desfazer: drop table public.pipeline_negocios; (só se nenhum negócio tiver sido gravado).

create table if not exists public.pipeline_negocios (
  id bigserial primary key,
  company_id integer not null default 1,
  nome character varying(120) not null check (length(btrim(nome)) > 0),
  tipo character varying(10) not null check (tipo in ('Locação', 'Venda')),
  imovel character varying(160),
  valor_centavos integer not null check (valor_centavos > 0),
  etapa character varying(20) not null default 'Prospecção'
    check (etapa in ('Prospecção', 'Visita', 'Proposta', 'Fechamento')),
  proximo_passo character varying(160),
  urgente boolean not null default false,
  criado_em timestamp with time zone not null default now(),
  criado_por integer references public.users(id),
  atualizado_em timestamp with time zone not null default now(),
  atualizado_por integer references public.users(id)
);

create index if not exists pipeline_negocios_company_etapa_idx
  on public.pipeline_negocios (company_id, etapa);

alter table public.pipeline_negocios enable row level security;
