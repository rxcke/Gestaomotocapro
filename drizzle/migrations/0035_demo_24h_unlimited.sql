ALTER TABLE public.demo_usage ADD COLUMN IF NOT EXISTS demo_started_at timestamptz, ADD COLUMN IF NOT EXISTS demo_expires_at timestamptz;
INSERT INTO public.demo_usage(user_id) SELECT p.id FROM public.profiles p ON CONFLICT (user_id) DO NOTHING;
UPDATE public.demo_usage d SET demo_started_at = p.created_at, demo_expires_at = p.created_at + interval '24 hours' FROM public.profiles p WHERE p.id = d.user_id AND d.demo_started_at IS NULL;
ALTER TABLE public.demo_usage ALTER COLUMN demo_started_at SET DEFAULT now();
COMMENT ON COLUMN public.demo_usage.income_used IS 'DEPRECATED: old one-income demo quota, no longer enforced.';
COMMENT ON COLUMN public.demo_usage.expense_used IS 'DEPRECATED: old one-expense demo quota, no longer enforced.';
COMMENT ON COLUMN public.demo_usage.income_id IS 'DEPRECATED: old demo quota.';
COMMENT ON COLUMN public.demo_usage.expense_id IS 'DEPRECATED: old demo quota.';
COMMENT ON COLUMN public.demo_usage.welcomed_at IS 'DEPRECATED: old demo welcome.';

CREATE OR REPLACE FUNCTION public.start_demo_for_new_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO public.demo_usage(user_id, demo_started_at, demo_expires_at)
  VALUES (NEW.id, NEW.created_at, NEW.created_at + interval '24 hours')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.start_demo_for_new_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER start_demo_on_profile AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.start_demo_for_new_profile();

DROP TRIGGER IF EXISTS enforce_demo_income ON public.incomes;
DROP TRIGGER IF EXISTS enforce_demo_expense ON public.expenses;
DROP FUNCTION IF EXISTS public.enforce_demo_financial_limit();
DROP FUNCTION IF EXISTS public.start_demo();

CREATE OR REPLACE FUNCTION public.has_demo_access(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.demo_usage WHERE user_id = _user_id AND demo_expires_at > now())
    AND NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = _user_id AND
      (status::text IN ('canceled','expired','refunded','chargeback') OR provider_status IN ('late','paused'))), false)
$$;
CREATE OR REPLACE FUNCTION public.has_app_access(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT COALESCE(_user_id = auth.uid() AND (public.has_active_subscription(_user_id) OR public.has_role(_user_id,'admin') OR public.has_role(_user_id,'ambassador') OR public.has_demo_access(_user_id)), false)
$$;
COMMENT ON FUNCTION public.has_app_access(uuid) IS 'Full access: paid subscription, admin, ambassador, or an unexpired 24h server-timed demo. Demo is never a subscription.';

DROP POLICY IF EXISTS "read own incomes" ON public.incomes;
DROP POLICY IF EXISTS "insert own incomes" ON public.incomes;
DROP POLICY IF EXISTS "update full own incomes" ON public.incomes;
DROP POLICY IF EXISTS "delete full own incomes" ON public.incomes;
CREATE POLICY "own incomes" ON public.incomes FOR ALL TO authenticated USING (auth.uid() = user_id AND public.has_app_access(auth.uid())) WITH CHECK (auth.uid() = user_id AND public.has_app_access(auth.uid()));
DROP POLICY IF EXISTS "read own expenses" ON public.expenses;
DROP POLICY IF EXISTS "insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "update full own expenses" ON public.expenses;
DROP POLICY IF EXISTS "delete full own expenses" ON public.expenses;
CREATE POLICY "own expenses" ON public.expenses FOR ALL TO authenticated USING (auth.uid() = user_id AND public.has_app_access(auth.uid())) WITH CHECK (auth.uid() = user_id AND public.has_app_access(auth.uid()));