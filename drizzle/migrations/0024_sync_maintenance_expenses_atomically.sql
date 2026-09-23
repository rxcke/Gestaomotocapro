ALTER TABLE public.maintenance_records
  ADD CONSTRAINT maintenance_records_id_user_unique UNIQUE (id, user_id);

ALTER TABLE public.expenses
  DROP CONSTRAINT expenses_maintenance_record_id_fkey;

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_maintenance_record_owner_fkey
  FOREIGN KEY (maintenance_record_id, user_id)
  REFERENCES public.maintenance_records (id, user_id)
  ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.sync_maintenance_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.expenses (
      user_id, maintenance_record_id, motorcycle_id, group_name, category,
      amount, date, description
    ) VALUES (
      NEW.user_id, NEW.id, NEW.motorcycle_id, 'Moto', 'Manutenção',
      NEW.cost, NEW.date, NEW.category
    )
    ON CONFLICT (maintenance_record_id) WHERE maintenance_record_id IS NOT NULL
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

REVOKE ALL ON FUNCTION public.sync_maintenance_expense() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_maintenance_expense() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_maintenance_expense() TO service_role;

CREATE TRIGGER sync_maintenance_expense_trigger
AFTER INSERT OR UPDATE OF motorcycle_id, category, cost, date ON public.maintenance_records
FOR EACH ROW
EXECUTE FUNCTION public.sync_maintenance_expense();

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
      SELECT 1
      FROM public.maintenance_records
      WHERE id = OLD.maintenance_record_id
        AND user_id = OLD.user_id
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
  WHERE id = NEW.maintenance_record_id
    AND user_id = NEW.user_id;

  IF _maintenance.id IS NULL THEN
    RAISE EXCEPTION 'maintenance_expense_owner_mismatch';
  END IF;

  IF NEW.motorcycle_id IS DISTINCT FROM _maintenance.motorcycle_id
    OR NEW.group_name IS DISTINCT FROM 'Moto'
    OR NEW.category IS DISTINCT FROM 'Manutenção'
    OR NEW.amount IS DISTINCT FROM _maintenance.cost
    OR NEW.date IS DISTINCT FROM _maintenance.date
    OR NEW.description IS DISTINCT FROM _maintenance.category
    OR NEW.work_session_id IS NOT NULL
  THEN
    RAISE EXCEPTION 'linked_maintenance_expense_fields_forbidden';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_linked_maintenance_expense() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.protect_linked_maintenance_expense() TO authenticated;
GRANT EXECUTE ON FUNCTION public.protect_linked_maintenance_expense() TO service_role;

CREATE TRIGGER protect_linked_maintenance_expense_trigger
BEFORE INSERT OR UPDATE OR DELETE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.protect_linked_maintenance_expense();