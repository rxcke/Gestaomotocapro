CREATE TABLE public.demo_usage (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  income_id uuid,
  expense_id uuid,
  income_used boolean NOT NULL DEFAULT false,
  expense_used boolean NOT NULL DEFAULT false,
  welcomed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.demo_usage TO authenticated;
GRANT ALL ON public.demo_usage TO service_role;
ALTER TABLE public.demo_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own demo usage" ON public.demo_usage FOR SELECT TO authenticated USING (user_id = auth.uid());
COMMENT ON TABLE public.demo_usage IS 'Permanent demo consumption; financial rows remain in incomes and expenses. Never reset on deletion or subscription conversion.';

CREATE OR REPLACE FUNCTION public.has_demo_access(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT COALESCE(_user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id)
    AND NOT public.has_app_access(_user_id)
    AND NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = _user_id AND
      (status::text IN ('active','trial','canceled','expired','refunded','chargeback') OR provider_status IN ('late','paused'))), false)
$$;
REVOKE ALL ON FUNCTION public.has_demo_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_demo_access(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.start_demo() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_demo_access(auth.uid()) THEN RAISE EXCEPTION 'demo_access_forbidden'; END IF;
  INSERT INTO public.demo_usage(user_id,welcomed_at) VALUES(auth.uid(),now())
  ON CONFLICT(user_id) DO UPDATE SET welcomed_at = COALESCE(demo_usage.welcomed_at,EXCLUDED.welcomed_at), updated_at = now();
END $$;
REVOKE ALL ON FUNCTION public.start_demo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_demo() TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_demo_financial_limit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE _used boolean; _uid uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    IF current_user IN ('postgres','service_role','supabase_admin') THEN
      IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;
    RAISE EXCEPTION 'demo_access_forbidden';
  END IF;
  _uid := auth.uid();
  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'financial_owner_change_forbidden'; END IF;
  IF TG_OP = 'DELETE' THEN
    IF OLD.user_id <> _uid OR NOT public.has_app_access(_uid) THEN RAISE EXCEPTION 'demo_limit_reached'; END IF;
    RETURN OLD;
  END IF;
  IF NEW.user_id <> _uid THEN RAISE EXCEPTION 'financial_owner_mismatch'; END IF;
  IF public.has_app_access(_uid) THEN RETURN NEW; END IF;
  IF TG_OP <> 'INSERT' OR NOT public.has_demo_access(_uid) THEN RAISE EXCEPTION 'demo_limit_reached'; END IF;
  IF NEW.motorcycle_id IS NOT NULL OR NEW.work_session_id IS NOT NULL OR NEW.amount <= 0 OR NEW.amount::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'demo_input_forbidden'; END IF;
  IF TG_TABLE_NAME = 'expenses' AND (NEW.fuel_record_id IS NOT NULL OR NEW.maintenance_record_id IS NOT NULL) THEN RAISE EXCEPTION 'demo_input_forbidden'; END IF;
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
REVOKE ALL ON FUNCTION public.enforce_demo_financial_limit() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER enforce_demo_income BEFORE INSERT OR UPDATE OR DELETE ON public.incomes FOR EACH ROW EXECUTE FUNCTION public.enforce_demo_financial_limit();
CREATE TRIGGER enforce_demo_expense BEFORE INSERT OR UPDATE OR DELETE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.enforce_demo_financial_limit();

DROP POLICY "own incomes" ON public.incomes;
CREATE POLICY "read own incomes" ON public.incomes FOR SELECT TO authenticated USING (user_id = auth.uid() AND (public.has_app_access(auth.uid()) OR (public.has_demo_access(auth.uid()) AND id = (SELECT income_id FROM public.demo_usage WHERE user_id = auth.uid()))));
CREATE POLICY "insert own incomes" ON public.incomes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND (public.has_app_access(auth.uid()) OR public.has_demo_access(auth.uid())));
CREATE POLICY "update full own incomes" ON public.incomes FOR UPDATE TO authenticated USING (user_id = auth.uid() AND public.has_app_access(auth.uid())) WITH CHECK (user_id = auth.uid() AND public.has_app_access(auth.uid()));
CREATE POLICY "delete full own incomes" ON public.incomes FOR DELETE TO authenticated USING (user_id = auth.uid() AND public.has_app_access(auth.uid()));
DROP POLICY "own expenses" ON public.expenses;
CREATE POLICY "read own expenses" ON public.expenses FOR SELECT TO authenticated USING (user_id = auth.uid() AND (public.has_app_access(auth.uid()) OR (public.has_demo_access(auth.uid()) AND id = (SELECT expense_id FROM public.demo_usage WHERE user_id = auth.uid()))));
CREATE POLICY "insert own expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND (public.has_app_access(auth.uid()) OR public.has_demo_access(auth.uid())));
CREATE POLICY "update full own expenses" ON public.expenses FOR UPDATE TO authenticated USING (user_id = auth.uid() AND public.has_app_access(auth.uid())) WITH CHECK (user_id = auth.uid() AND public.has_app_access(auth.uid()));
CREATE POLICY "delete full own expenses" ON public.expenses FOR DELETE TO authenticated USING (user_id = auth.uid() AND public.has_app_access(auth.uid()));

CREATE TABLE public.signup_attribution (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 referral_code text,
 campaign jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.signup_attribution TO authenticated;
GRANT ALL ON public.signup_attribution TO service_role;
ALTER TABLE public.signup_attribution ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own signup attribution" ON public.signup_attribution FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "record own signup attribution" ON public.signup_attribution FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND length(COALESCE(referral_code,'')) <= 200 AND octet_length(campaign::text) <= 4000);
COMMENT ON TABLE public.signup_attribution IS 'Immutable original signup attribution only; not an ambassador role, commission or payment record.';