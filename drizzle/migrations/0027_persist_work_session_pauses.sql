CREATE TABLE public.work_session_pauses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  work_session_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_session_pauses_owner_fkey FOREIGN KEY (work_session_id, user_id)
    REFERENCES public.work_sessions (id, user_id) ON DELETE CASCADE,
  CONSTRAINT work_session_pauses_valid_interval CHECK (ended_at IS NULL OR ended_at >= started_at)
);
GRANT SELECT ON public.work_session_pauses TO authenticated;
GRANT ALL ON public.work_session_pauses TO service_role;
ALTER TABLE public.work_session_pauses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own session pauses" ON public.work_session_pauses FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND (public.has_active_subscription(auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
CREATE UNIQUE INDEX work_session_pauses_one_open_per_session ON public.work_session_pauses (work_session_id) WHERE ended_at IS NULL;
CREATE INDEX work_session_pauses_session_started ON public.work_session_pauses (work_session_id, started_at);

CREATE FUNCTION public.set_work_session_pause(_session_id uuid, _pause boolean)
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
  IF _owner IS NULL OR _ended_at IS NOT NULL OR NOT (
    public.has_active_subscription(auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)
  ) THEN
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
REVOKE ALL ON FUNCTION public.set_work_session_pause(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_work_session_pause(uuid, boolean) TO authenticated;

CREATE FUNCTION public.close_work_session_pause()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF OLD.end_time IS NULL AND NEW.end_time IS NOT NULL THEN
    UPDATE public.work_session_pauses
    SET ended_at = GREATEST(started_at, NEW.end_time)
    WHERE work_session_id = NEW.id AND ended_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.close_work_session_pause() FROM PUBLIC;
CREATE TRIGGER close_work_session_pause_on_finish
AFTER UPDATE OF end_time ON public.work_sessions FOR EACH ROW
EXECUTE FUNCTION public.close_work_session_pause();