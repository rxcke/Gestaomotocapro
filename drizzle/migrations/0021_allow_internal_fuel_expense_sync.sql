ALTER FUNCTION public.sync_fuel_expense() SECURITY DEFINER;

ALTER FUNCTION public.sync_fuel_expense() SET search_path = public, pg_temp;