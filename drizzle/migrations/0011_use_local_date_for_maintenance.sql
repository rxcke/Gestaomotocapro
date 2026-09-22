ALTER TABLE public.maintenance_records
  ALTER COLUMN date SET DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date);