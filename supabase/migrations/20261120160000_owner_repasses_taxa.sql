-- US-4.8 Repasses: registra o valor da taxa de administração de cada repasse.
-- Aditiva: só cria uma coluna nova que aceita vazio. Os repasses antigos ficam com taxa vazia.
alter table public.owner_repasses add column if not exists admin_fee_cents integer;
