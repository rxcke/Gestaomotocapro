ALTER TABLE public.fuel_records
ADD CONSTRAINT fuel_records_total_positive
CHECK (total > 0) NOT VALID;