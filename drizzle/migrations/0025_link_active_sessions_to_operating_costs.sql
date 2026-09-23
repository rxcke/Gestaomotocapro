ALTER TABLE public.work_sessions
  ADD CONSTRAINT work_sessions_id_user_unique UNIQUE (id, user_id);

CREATE UNIQUE INDEX work_sessions_one_active_per_user
  ON public.work_sessions (user_id)
  WHERE end_time IS NULL;

ALTER TABLE public.fuel_records
  ADD COLUMN work_session_id UUID;

ALTER TABLE public.maintenance_records
  ADD COLUMN work_session_id UUID;

ALTER TABLE public.fuel_records
  ADD CONSTRAINT fuel_records_work_session_owner_fkey
  FOREIGN KEY (work_session_id, user_id)
  REFERENCES public.work_sessions (id, user_id)
  ON DELETE SET NULL (work_session_id);

ALTER TABLE public.maintenance_records
  ADD CONSTRAINT maintenance_records_work_session_owner_fkey
  FOREIGN KEY (work_session_id, user_id)
  REFERENCES public.work_sessions (id, user_id)
  ON DELETE SET NULL (work_session_id);

CREATE OR REPLACE FUNCTION public.assign_active_work_session_to_cost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _active_session_id uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.work_session_id IS DISTINCT FROM OLD.work_session_id THEN
      RAISE EXCEPTION 'cost_work_session_change_forbidden';
    END IF;
    RETURN NEW;
  END IF;

  SELECT id INTO _active_session_id
  FROM public.work_sessions
  WHERE user_id = NEW.user_id
    AND end_time IS NULL
  LIMIT 1;

  IF NEW.work_session_id IS NOT NULL
    AND NEW.work_session_id IS DISTINCT FROM _active_session_id
  THEN
    RAISE EXCEPTION 'active_work_session_owner_mismatch';
  END IF;

  NEW.work_session_id := _active_session_id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_active_work_session_to_cost() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_active_work_session_to_cost() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_active_work_session_to_cost() TO service_role;

CREATE TRIGGER assign_active_work_session_to_fuel_trigger
BEFORE INSERT OR UPDATE OF work_session_id ON public.fuel_records
FOR EACH ROW
EXECUTE FUNCTION public.assign_active_work_session_to_cost();

CREATE TRIGGER assign_active_work_session_to_maintenance_trigger
BEFORE INSERT OR UPDATE OF work_session_id ON public.maintenance_records
FOR EACH ROW
EXECUTE FUNCTION public.assign_active_work_session_to_cost();

CREATE OR REPLACE FUNCTION public.sync_fuel_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.expenses (
      user_id, fuel_record_id, motorcycle_id, work_session_id,
      group_name, category, amount, date, description
    ) VALUES (
      NEW.user_id, NEW.id, NEW.motorcycle_id, NEW.work_session_id,
      'Moto', 'Combustível', NEW.total, NEW.date,
      'Abastecimento' || CASE
        WHEN NEW.station IS NOT NULL AND btrim(NEW.station) <> ''
          THEN ' · ' || NEW.station
        ELSE ''
      END
    )
    ON CONFLICT (fuel_record_id) WHERE fuel_record_id IS NOT NULL
    DO UPDATE SET
      motorcycle_id = EXCLUDED.motorcycle_id,
      work_session_id = EXCLUDED.work_session_id,
      group_name = EXCLUDED.group_name,
      category = EXCLUDED.category,
      amount = EXCLUDED.amount,
      date = EXCLUDED.date,
      description = EXCLUDED.description;
  ELSE
    UPDATE public.expenses
    SET motorcycle_id = NEW.motorcycle_id,
        work_session_id = NEW.work_session_id,
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

DROP TRIGGER sync_fuel_expense_trigger ON public.fuel_records;
CREATE TRIGGER sync_fuel_expense_trigger
AFTER INSERT OR UPDATE OF motorcycle_id, work_session_id, total, date, station ON public.fuel_records
FOR EACH ROW
EXECUTE FUNCTION public.sync_fuel_expense();

CREATE OR REPLACE FUNCTION public.sync_maintenance_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.expenses (
      user_id, maintenance_record_id, motorcycle_id, work_session_id,
      group_name, category, amount, date, description
    ) VALUES (
      NEW.user_id, NEW.id, NEW.motorcycle_id, NEW.work_session_id,
      'Moto', 'Manutenção', NEW.cost, NEW.date, NEW.category
    )
    ON CONFLICT (maintenance_record_id) WHERE maintenance_record_id IS NOT NULL
    DO UPDATE SET
      motorcycle_id = EXCLUDED.motorcycle_id,
      work_session_id = EXCLUDED.work_session_id,
      group_name = EXCLUDED.group_name,
      category = EXCLUDED.category,
      amount = EXCLUDED.amount,
      date = EXCLUDED.date,
      description = EXCLUDED.description;
  ELSE
    UPDATE public.expenses
    SET motorcycle_id = NEW.motorcycle_id,
        work_session_id = NEW.work_session_id,
        group_name = 'Moto',
        category = 'Manutenção',
        amount = NEW.cost,
        date = NEW.date,
        description = NEW.category
    WHERE maintenance_record_id = NEW.id
      AND user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER sync_maintenance_expense_trigger ON public.maintenance_records;
CREATE TRIGGER sync_maintenance_expense_trigger
AFTER INSERT OR UPDATE OF motorcycle_id, work_session_id, category, cost, date ON public.maintenance_records
FOR EACH ROW
EXECUTE FUNCTION public.sync_maintenance_expense();

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
      SELECT 1 FROM public.fuel_records
      WHERE id = OLD.fuel_record_id AND user_id = OLD.user_id
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
$$;

CREATE OR REPLACE FUNCTION public.protect_linked_maintenance_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
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
    RAISE EXCEPTION 'maintenance_expense_link_change_forbidden';
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
$$;