CREATE OR REPLACE FUNCTION public.sync_fuel_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.expenses (
    user_id, fuel_record_id, motorcycle_id, group_name, category,
    amount, date, description
  ) VALUES (
    NEW.user_id, NEW.id, NEW.motorcycle_id, 'Moto', 'Combustível',
    NEW.total, NEW.date,
    'Abastecimento' || CASE
      WHEN NEW.station IS NOT NULL AND btrim(NEW.station) <> ''
        THEN ' · ' || NEW.station
      ELSE ''
    END
  )
  ON CONFLICT (fuel_record_id) WHERE fuel_record_id IS NOT NULL
  DO UPDATE SET
    motorcycle_id = EXCLUDED.motorcycle_id,
    group_name = EXCLUDED.group_name,
    category = EXCLUDED.category,
    amount = EXCLUDED.amount,
    date = EXCLUDED.date,
    description = EXCLUDED.description;

  RETURN NEW;
END;
$$;

DROP TRIGGER protect_linked_fuel_expense_trigger ON public.expenses;

CREATE TRIGGER protect_linked_fuel_expense_trigger
BEFORE UPDATE ON public.expenses
FOR EACH ROW
WHEN (OLD.fuel_record_id IS NOT NULL)
EXECUTE FUNCTION public.protect_linked_fuel_expense();