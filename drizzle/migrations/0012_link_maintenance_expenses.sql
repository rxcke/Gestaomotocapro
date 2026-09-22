ALTER TABLE public.expenses
  ADD COLUMN maintenance_record_id UUID REFERENCES public.maintenance_records(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX expenses_maintenance_record_unique
  ON public.expenses (maintenance_record_id)
  WHERE maintenance_record_id IS NOT NULL;