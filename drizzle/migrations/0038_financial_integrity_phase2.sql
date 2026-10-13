-- F-01: ganhos e gastos precisam ter valor maior que zero.
ALTER TABLE public.incomes ADD CONSTRAINT incomes_amount_positive CHECK (amount > 0);
ALTER TABLE public.expenses ADD CONSTRAINT expenses_amount_positive CHECK (amount > 0);

-- F-04: o vínculo com jornada só vale para jornadas do mesmo usuário.
CREATE OR REPLACE FUNCTION public.validate_entry_work_session_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.work_session_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.work_sessions s WHERE s.id = NEW.work_session_id AND s.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'work_session_owner_mismatch' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER validate_income_work_session_owner BEFORE INSERT OR UPDATE OF work_session_id, user_id ON public.incomes
  FOR EACH ROW EXECUTE FUNCTION public.validate_entry_work_session_owner();
CREATE TRIGGER validate_expense_work_session_owner BEFORE INSERT OR UPDATE OF work_session_id, user_id ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.validate_entry_work_session_owner();

-- F-02: totais de jornadas encerradas são sempre a soma real dos lançamentos vinculados.
CREATE OR REPLACE FUNCTION public.work_session_entry_totals(_session_id uuid, _user_id uuid, OUT total_income numeric, OUT total_expense numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT
    COALESCE((SELECT sum(i.amount) FROM public.incomes i WHERE i.work_session_id = _session_id AND i.user_id = _user_id), 0),
    COALESCE((SELECT sum(e.amount) FROM public.expenses e WHERE e.work_session_id = _session_id AND e.user_id = _user_id), 0)
$$;

CREATE OR REPLACE FUNCTION public.set_closed_work_session_totals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE _t record;
BEGIN
  IF NEW.end_time IS NOT NULL THEN
    SELECT * INTO _t FROM public.work_session_entry_totals(NEW.id, NEW.user_id);
    NEW.total_income := _t.total_income;
    NEW.total_expense := _t.total_expense;
    NEW.net_profit := _t.total_income - _t.total_expense;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER set_closed_work_session_totals BEFORE UPDATE ON public.work_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_closed_work_session_totals();

CREATE OR REPLACE FUNCTION public.refresh_work_session_totals_from_entry()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.work_session_id IS NOT NULL THEN
    UPDATE public.work_sessions SET total_income = total_income WHERE id = OLD.work_session_id AND end_time IS NOT NULL;
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.work_session_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.work_session_id IS DISTINCT FROM OLD.work_session_id) THEN
    UPDATE public.work_sessions SET total_income = total_income WHERE id = NEW.work_session_id AND end_time IS NOT NULL;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER refresh_work_session_totals_from_income AFTER INSERT OR UPDATE OF amount, work_session_id, user_id OR DELETE ON public.incomes
  FOR EACH ROW EXECUTE FUNCTION public.refresh_work_session_totals_from_entry();
CREATE TRIGGER refresh_work_session_totals_from_expense AFTER INSERT OR UPDATE OF amount, work_session_id, user_id OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.refresh_work_session_totals_from_entry();

REVOKE EXECUTE ON FUNCTION public.validate_entry_work_session_owner() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.work_session_entry_totals(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_closed_work_session_totals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_work_session_totals_from_entry() FROM PUBLIC, anon, authenticated;