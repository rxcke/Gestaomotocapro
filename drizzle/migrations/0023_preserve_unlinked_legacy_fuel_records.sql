CREATE OR REPLACE FUNCTION public.sync_fuel_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
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
  ELSE
    UPDATE public.expenses
    SET motorcycle_id = NEW.motorcycle_id,
        group_name = 'Moto',
        category = 'Combustível',
        amount = NEW.total,
        date = NEW.date,
        description = 'Abastecimento' || CASE
          WHEN NEW.station IS NOT NULL AND btrim(NEW.station) <> ''
            THEN ' · ' || NEW.station
          ELSE ''
        END
    WHERE fuel_record_id = NEW.id
      AND user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER protect_linked_fuel_expense_trigger ON public.expenses;

CREATE TRIGGER protect_linked_fuel_expense_trigger
BEFORE UPDATE OR DELETE ON public.expenses
FOR EACH ROW
WHEN (OLD.fuel_record_id IS NOT NULL)
EXECUTE FUNCTION public.protect_linked_fuel_expense();