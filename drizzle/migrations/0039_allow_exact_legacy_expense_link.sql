-- F-05: permite somente ligar uma despesa ainda sem vínculo ao seu registro de origem,
-- quando nenhum outro campo muda e todos os campos já batem com a origem. Demais proteções intactas.
CREATE OR REPLACE FUNCTION public.protect_linked_fuel_expense()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  _fuel public.fuel_records;
  _expected_description text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.fuel_record_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.fuel_records
      WHERE id = OLD.fuel_record_id AND user_id = OLD.user_id
    ) THEN
      RAISE EXCEPTION 'linked_fuel_expense_delete_forbidden';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.fuel_record_id IS DISTINCT FROM NEW.fuel_record_id THEN
    IF NOT (
      OLD.fuel_record_id IS NULL AND NEW.fuel_record_id IS NOT NULL
      AND OLD.maintenance_record_id IS NULL AND NEW.maintenance_record_id IS NULL
      AND (NEW.id, NEW.user_id, NEW.motorcycle_id, NEW.work_session_id, NEW.group_name, NEW.category, NEW.amount, NEW.date, NEW.description)
          IS NOT DISTINCT FROM
          (OLD.id, OLD.user_id, OLD.motorcycle_id, OLD.work_session_id, OLD.group_name, OLD.category, OLD.amount, OLD.date, OLD.description)
    ) THEN
      RAISE EXCEPTION 'fuel_expense_link_change_forbidden';
    END IF;
  END IF;

  IF NEW.fuel_record_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO _fuel
  FROM public.fuel_records
  WHERE id = NEW.fuel_record_id AND user_id = NEW.user_id;

  IF _fuel.id IS NULL THEN
    RAISE EXCEPTION 'fuel_expense_owner_mismatch';
  END IF;

  _expected_description := 'Abastecimento' || CASE
    WHEN _fuel.station IS NOT NULL AND btrim(_fuel.station) <> ''
      THEN ' · ' || _fuel.station
    ELSE ''
  END;

  IF NEW.motorcycle_id IS DISTINCT FROM _fuel.motorcycle_id
    OR NEW.work_session_id IS DISTINCT FROM _fuel.work_session_id
    OR NEW.group_name IS DISTINCT FROM 'Moto'
    OR NEW.category IS DISTINCT FROM 'Combustível'
    OR NEW.amount IS DISTINCT FROM _fuel.total
    OR NEW.date IS DISTINCT FROM _fuel.date
    OR NEW.description IS DISTINCT FROM _expected_description
  THEN
    RAISE EXCEPTION 'linked_fuel_expense_fields_forbidden';
  END IF;

  RETURN NEW;
END;
$function$;

-- O gatilho existente só roda quando a despesa já tinha vínculo; este cobre o momento do vínculo novo.
CREATE TRIGGER protect_new_fuel_expense_link_trigger
  BEFORE UPDATE OF fuel_record_id ON public.expenses
  FOR EACH ROW WHEN (old.fuel_record_id IS NULL AND new.fuel_record_id IS NOT NULL)
  EXECUTE FUNCTION public.protect_linked_fuel_expense();

CREATE OR REPLACE FUNCTION public.protect_linked_maintenance_expense()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  _maintenance public.maintenance_records;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.maintenance_record_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.maintenance_records
      WHERE id = OLD.maintenance_record_id AND user_id = OLD.user_id
    ) THEN
      RAISE EXCEPTION 'linked_maintenance_expense_delete_forbidden';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.maintenance_record_id IS DISTINCT FROM NEW.maintenance_record_id THEN
    IF NOT (
      OLD.maintenance_record_id IS NULL AND NEW.maintenance_record_id IS NOT NULL
      AND OLD.fuel_record_id IS NULL AND NEW.fuel_record_id IS NULL
      AND (NEW.id, NEW.user_id, NEW.motorcycle_id, NEW.work_session_id, NEW.group_name, NEW.category, NEW.amount, NEW.date, NEW.description)
          IS NOT DISTINCT FROM
          (OLD.id, OLD.user_id, OLD.motorcycle_id, OLD.work_session_id, OLD.group_name, OLD.category, OLD.amount, OLD.date, OLD.description)
    ) THEN
      RAISE EXCEPTION 'maintenance_expense_link_change_forbidden';
    END IF;
  END IF;

  IF NEW.maintenance_record_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO _maintenance
  FROM public.maintenance_records
  WHERE id = NEW.maintenance_record_id AND user_id = NEW.user_id;

  IF _maintenance.id IS NULL THEN
    RAISE EXCEPTION 'maintenance_expense_owner_mismatch';
  END IF;

  IF NEW.motorcycle_id IS DISTINCT FROM _maintenance.motorcycle_id
    OR NEW.work_session_id IS DISTINCT FROM _maintenance.work_session_id
    OR NEW.group_name IS DISTINCT FROM 'Moto'
    OR NEW.category IS DISTINCT FROM 'Manutenção'
    OR NEW.amount IS DISTINCT FROM _maintenance.cost
    OR NEW.date IS DISTINCT FROM _maintenance.date
    OR NEW.description IS DISTINCT FROM _maintenance.category
  THEN
    RAISE EXCEPTION 'linked_maintenance_expense_fields_forbidden';
  END IF;

  RETURN NEW;
END;
$function$;