CREATE FUNCTION public.has_app_access(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT COALESCE(_user_id = auth.uid() AND (
    public.has_active_subscription(_user_id)
    OR public.has_role(_user_id, 'admin'::public.app_role)
    OR public.has_role(_user_id, 'ambassador'::public.app_role)
  ), false)
$$;
REVOKE ALL ON FUNCTION public.has_app_access(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_app_access(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_app_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_app_access(uuid) TO service_role;

ALTER POLICY "own motorcycles" ON public.motorcycles USING (auth.uid() = user_id AND public.has_app_access(auth.uid())) WITH CHECK (auth.uid() = user_id AND public.has_app_access(auth.uid()));
ALTER POLICY "own incomes" ON public.incomes USING (auth.uid() = user_id AND public.has_app_access(auth.uid())) WITH CHECK (auth.uid() = user_id AND public.has_app_access(auth.uid()));
ALTER POLICY "own expenses" ON public.expenses USING (auth.uid() = user_id AND public.has_app_access(auth.uid())) WITH CHECK (auth.uid() = user_id AND public.has_app_access(auth.uid()));
ALTER POLICY "own fuel" ON public.fuel_records USING (auth.uid() = user_id AND public.has_app_access(auth.uid())) WITH CHECK (auth.uid() = user_id AND public.has_app_access(auth.uid()));
ALTER POLICY "own maintenance" ON public.maintenance_records USING (auth.uid() = user_id AND public.has_app_access(auth.uid())) WITH CHECK (auth.uid() = user_id AND public.has_app_access(auth.uid()));
ALTER POLICY "own goals" ON public.goals USING (auth.uid() = user_id AND public.has_app_access(auth.uid())) WITH CHECK (auth.uid() = user_id AND public.has_app_access(auth.uid()));
ALTER POLICY "own documents" ON public.documents USING (auth.uid() = user_id AND public.has_app_access(auth.uid())) WITH CHECK (auth.uid() = user_id AND public.has_app_access(auth.uid()));
ALTER POLICY "own notifications" ON public.notifications USING (auth.uid() = user_id AND public.has_app_access(auth.uid())) WITH CHECK (auth.uid() = user_id AND public.has_app_access(auth.uid()));
ALTER POLICY "own sessions" ON public.work_sessions USING (auth.uid() = user_id AND public.has_app_access(auth.uid())) WITH CHECK (auth.uid() = user_id AND public.has_app_access(auth.uid()));
ALTER POLICY "own session pauses" ON public.work_session_pauses USING (auth.uid() = user_id AND public.has_app_access(auth.uid()));

CREATE OR REPLACE FUNCTION public.set_work_session_pause(_session_id uuid, _pause boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  _owner uuid;
  _open_id uuid;
  _ended_at timestamptz;
BEGIN
  IF auth.uid() IS NULL OR _session_id IS NULL OR _pause IS NULL THEN
    RAISE EXCEPTION 'invalid_session_pause';
  END IF;
  SELECT user_id, end_time INTO _owner, _ended_at
  FROM public.work_sessions WHERE id = _session_id AND user_id = auth.uid() FOR UPDATE;
  IF _owner IS NULL OR _ended_at IS NOT NULL OR NOT public.has_app_access(auth.uid()) THEN
    RAISE EXCEPTION 'session_pause_forbidden';
  END IF;
  SELECT id INTO _open_id FROM public.work_session_pauses
  WHERE work_session_id = _session_id AND ended_at IS NULL;
  IF _pause THEN
    IF _open_id IS NOT NULL THEN RAISE EXCEPTION 'session_already_paused'; END IF;
    INSERT INTO public.work_session_pauses (work_session_id, user_id, started_at)
    VALUES (_session_id, _owner, clock_timestamp());
  ELSE
    IF _open_id IS NULL THEN RAISE EXCEPTION 'session_not_paused'; END IF;
    UPDATE public.work_session_pauses SET ended_at = GREATEST(started_at, clock_timestamp())
    WHERE id = _open_id;
  END IF;
END;
$$;