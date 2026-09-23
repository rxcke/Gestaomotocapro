CREATE OR REPLACE FUNCTION public.protect_linked_fuel_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _fuel public.fuel_records;
  _expected_description text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.fuel_record_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.fuel_records
      WHERE id = OLD.fuel_record_id
        AND user_id = OLD.user_id
    ) THEN
      RAISE EXCEPTION 'linked_fuel_expense_delete_forbidden';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.fuel_record_id IS DISTINCT FROM NEW.fuel_record_id THEN
    RAISE EXCEPTION 'fuel_expense_link_change_forbidden';
  END IF;

  IF NEW.fuel_record_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO _fuel
  FROM public.fuel_records
  WHERE id = NEW.fuel_record_id
    AND user_id = NEW.user_id;

  IF _fuel.id IS NULL THEN
    RAISE EXCEPTION 'fuel_expense_owner_mismatch';
  END IF;

  _expected_description := 'Abastecimento' || CASE
    WHEN _fuel.station IS NOT NULL AND btrim(_fuel.station) <> ''
      THEN ' · ' || _fuel.station
    ELSE ''
  END;

  IF NEW.motorcycle_id IS DISTINCT FROM _fuel.motorcycle_id
    OR NEW.group_name IS DISTINCT FROM 'Moto'
    OR NEW.category IS DISTINCT FROM 'Combustível'
    OR NEW.amount IS DISTINCT FROM _fuel.total
    OR NEW.date IS DISTINCT FROM _fuel.date
    OR NEW.description IS DISTINCT FROM _expected_description
    OR NEW.work_session_id IS NOT NULL
  THEN
    RAISE EXCEPTION 'linked_fuel_expense_fields_forbidden';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_linked_fuel_expense() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.protect_linked_fuel_expense() TO authenticated;
GRANT EXECUTE ON FUNCTION public.protect_linked_fuel_expense() TO service_role;

CREATE TRIGGER protect_linked_fuel_expense_trigger
BEFORE UPDATE OR DELETE ON public.expenses
FOR EACH ROW
WHEN (OLD.fuel_record_id IS NOT NULL)
EXECUTE FUNCTION public.protect_linked_fuel_expense();