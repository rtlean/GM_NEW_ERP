-- Migração aditiva (ajuste de layout da tela de Imóveis, 20/11/2026).
-- Só cria coisas novas. Não apaga nem altera colunas existentes.
-- Aplicada em produção com aprovação do dono do projeto.

alter type public.occupancy_status add value if not exists 'sold';

alter table public.properties
  add column if not exists name text,
  add column if not exists finality text,
  add column if not exists matricula text,
  add column if not exists iptu_registration text,
  add column if not exists bedrooms integer,
  add column if not exists suites integer,
  add column if not exists bathrooms integer,
  add column if not exists parking_spots integer,
  add column if not exists useful_area_m2 numeric(10,2),
  add column if not exists total_area_m2 numeric(10,2),
  add column if not exists floor text,
  add column if not exists furnishing text,
  add column if not exists pets_allowed text,
  add column if not exists sale_value_cents integer,
  add column if not exists condominium_cents integer,
  add column if not exists iptu_cents integer,
  add column if not exists amenities text[];
