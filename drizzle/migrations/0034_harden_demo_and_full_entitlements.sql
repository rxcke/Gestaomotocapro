CREATE OR REPLACE FUNCTION public.has_app_access(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$ SELECT COALESCE(_user_id = auth.uid() AND (public.has_active_subscription(_user_id) OR public.has_role(_user_id,'admin') OR public.has_role(_user_id,'ambassador')),false) $$;
COMMENT ON FUNCTION public.has_app_access(uuid) IS 'Full operational access only: paid subscription, admin or ambassador. Demo is separately scoped by has_demo_access; trial never grants demonstration or paid access.';
CREATE OR REPLACE FUNCTION public.enforce_demo_financial_limit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE _used boolean; _uid uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    IF auth.role() = 'service_role' OR session_user IN ('postgres','supabase_admin') THEN
      IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;
    RAISE EXCEPTION 'demo_access_forbidden';
  END IF;
  _uid := auth.uid();
  IF TG_OP = 'UPDATE' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'financial_owner_change_forbidden'; END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN
    IF OLD.user_id <> _uid OR NOT public.has_app_access(_uid) THEN RAISE EXCEPTION 'demo_limit_reached'; END IF;
    RETURN OLD;
  END IF;
  IF NEW.user_id <> _uid THEN RAISE EXCEPTION 'financial_owner_mismatch'; END IF;
  IF public.has_app_access(_uid) THEN RETURN NEW; END IF;
  IF TG_OP <> 'INSERT' OR NOT public.has_demo_access(_uid) THEN RAISE EXCEPTION 'demo_limit_reached'; END IF;
  IF NEW.motorcycle_id IS NOT NULL OR NEW.work_session_id IS NOT NULL OR NEW.amount <= 0 OR NEW.amount::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'demo_input_forbidden'; END IF;
  IF TG_TABLE_NAME = 'expenses' THEN
    IF NEW.fuel_record_id IS NOT NULL OR NEW.maintenance_record_id IS NOT NULL THEN RAISE EXCEPTION 'demo_input_forbidden'; END IF;
  END IF;
  INSERT INTO public.demo_usage(user_id) VALUES(_uid) ON CONFLICT(user_id) DO NOTHING;
  PERFORM 1 FROM public.demo_usage WHERE user_id = _uid FOR UPDATE;
  IF TG_TABLE_NAME = 'incomes' THEN
    SELECT income_used INTO _used FROM public.demo_usage WHERE user_id = _uid;
    IF _used OR EXISTS(SELECT 1 FROM public.incomes WHERE user_id = _uid) THEN RAISE EXCEPTION 'demo_limit_reached'; END IF;
    UPDATE public.demo_usage SET income_used = true, income_id = NEW.id, updated_at = now() WHERE user_id = _uid;
  ELSE
    SELECT expense_used INTO _used FROM public.demo_usage WHERE user_id = _uid;
    IF _used OR EXISTS(SELECT 1 FROM public.expenses WHERE user_id = _uid) THEN RAISE EXCEPTION 'demo_limit_reached'; END IF;
    UPDATE public.demo_usage SET expense_used = true, expense_id = NEW.id, updated_at = now() WHERE user_id = _uid;
  END IF;
  RETURN NEW;
END $$;