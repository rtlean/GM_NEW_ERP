-- US-3.4: detalhes do endereço e características do imóvel.
-- Só aditivo: colunas novas, sem alterar as existentes.
alter table public.properties
  add column if not exists numero text,
  add column if not exists complemento text,
  add column if not exists bairro text,
  add column if not exists caracteristicas text;
