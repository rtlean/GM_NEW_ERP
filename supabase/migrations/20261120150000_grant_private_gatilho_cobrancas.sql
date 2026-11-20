-- Correção (20/11/2026, aprovada pelo dono): a geração de cobranças falhava com
-- "permission denied for schema private". O gatilho do livro financeiro (monthly_entries)
-- roda com a permissão de quem grava, e a conta do servidor (service_role) não tinha acesso
-- ao schema private. Só concessão de acesso: não altera função, regra nem dado.
-- Para desfazer: REVOKE EXECUTE ... e REVOKE USAGE ON SCHEMA private FROM service_role.

grant usage on schema private to service_role;

grant execute on function private.on_monthly_entry_financial_ledger() to service_role;
grant execute on function private.sync_monthly_entry_financial_ledger(integer) to service_role;
grant execute on function private.sync_adjustments_for_monthly_entry(integer) to service_role;
grant execute on function private.upsert_financial_ledger_entry(integer, character varying, integer, integer, integer, integer, character varying, character varying, text, integer, character varying, character varying, integer, character varying, date, boolean, boolean, boolean, character varying, integer) to service_role;
