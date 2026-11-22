-- Pipeline: contato e origem do lead (decisão do dono, 22/11/2026).
-- Aditiva: só cria colunas novas, todas opcionais no banco. Telefone é obrigatório na tela (regra da aplicação).
-- Nada existente é renomeado, apagado ou alterado de tipo.
-- Para desfazer: alter table public.pipeline_negocios drop column telefone, drop column email, drop column origem, drop column cidade; (só se nenhum lead tiver sido gravado com esses campos).

alter table public.pipeline_negocios
  add column if not exists telefone character varying(20),
  add column if not exists email character varying(160),
  add column if not exists origem character varying(40),
  add column if not exists cidade character varying(80);
