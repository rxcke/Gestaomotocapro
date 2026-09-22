ALTER TABLE public.fuel_records ALTER COLUMN km DROP NOT NULL;
ALTER TABLE public.fuel_records ALTER COLUMN liters DROP NOT NULL;
ALTER TABLE public.fuel_records ALTER COLUMN price_per_liter DROP NOT NULL;
