-- US-3.5b: dia de vencimento do aluguel no contrato (1 a 28). Migração só aditiva: coluna nova, sem mexer nas existentes.
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS due_day smallint;

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_due_day_check,
  ADD CONSTRAINT contracts_due_day_check CHECK (due_day IS NULL OR due_day BETWEEN 1 AND 28);
