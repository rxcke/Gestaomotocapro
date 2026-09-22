ALTER TABLE public.fuel_records
ADD CONSTRAINT fuel_records_liters_positive
CHECK (liters IS NULL OR liters > 0) NOT VALID;

ALTER TABLE public.fuel_records
ADD CONSTRAINT fuel_records_price_per_liter_positive
CHECK (price_per_liter IS NULL OR price_per_liter > 0) NOT VALID;

ALTER TABLE public.fuel_records
ADD CONSTRAINT fuel_records_km_nonnegative
CHECK (km IS NULL OR km >= 0) NOT VALID;