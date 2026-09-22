ALTER TABLE public.maintenance_records
  ADD CONSTRAINT maintenance_records_cost_positive CHECK (cost > 0) NOT VALID;

ALTER TABLE public.maintenance_records
  ADD CONSTRAINT maintenance_records_category_present CHECK (length(btrim(category)) > 0) NOT VALID;