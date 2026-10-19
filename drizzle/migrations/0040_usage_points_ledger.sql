CREATE TABLE public.points_participants (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  public_name text NOT NULL DEFAULT ('Motoca ' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)) UNIQUE,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
GRANT SELECT ON public.points_participants TO authenticated;
GRANT ALL ON public.points_participants TO service_role;
ALTER TABLE public.points_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY points_participants_read_own ON public.points_participants FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.points_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.points_participants(user_id) ON DELETE CASCADE,
  event_type text NOT NULL,
  points integer NOT NULL,
  reference_date date NOT NULL,
  week_start date NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT points_event_kind_value CHECK ((event_type = 'daily_login' AND points = 1) OR (event_type = 'weekly_bonus' AND points = 5)),
  CONSTRAINT points_event_week CHECK (extract(isodow FROM week_start) = 1 AND reference_date BETWEEN week_start AND week_start + 6),
  CONSTRAINT points_event_unique UNIQUE (user_id, event_type, reference_date),
  CONSTRAINT points_bonus_reference CHECK (event_type <> 'weekly_bonus' OR reference_date = week_start)
);
GRANT SELECT ON public.points_events TO authenticated;
GRANT ALL ON public.points_events TO service_role;
ALTER TABLE public.points_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY points_events_read_own ON public.points_events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE UNIQUE INDEX points_one_weekly_bonus ON public.points_events(user_id, week_start) WHERE event_type = 'weekly_bonus';
CREATE INDEX points_events_user_week ON public.points_events(user_id, week_start);
CREATE FUNCTION public.credit_app_access_points_internal(_user_id uuid, _at timestamptz)
RETURNS TABLE(reference_date date, week_start date, daily_awarded boolean, bonus_awarded boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  _day date := (_at AT TIME ZONE 'America/Sao_Paulo')::date;
  _week date := date_trunc('week', _at AT TIME ZONE 'America/Sao_Paulo')::date;
  _daily boolean := false;
  _bonus boolean := false;
  _count integer;
BEGIN
  IF _user_id IS NULL OR _at IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(_user_id::text, 619));
  INSERT INTO public.points_participants(user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.points_events(user_id, event_type, points, reference_date, week_start, granted_at)
  VALUES (_user_id, 'daily_login', 1, _day, _week, _at)
  ON CONFLICT ON CONSTRAINT points_event_unique DO NOTHING;
  GET DIAGNOSTICS _count = ROW_COUNT;
  _daily := _count = 1;
  SELECT count(*) INTO _count FROM public.points_events e
    WHERE e.user_id = _user_id AND e.week_start = _week AND e.event_type = 'daily_login';
  IF _count >= 5 THEN
    INSERT INTO public.points_events(user_id, event_type, points, reference_date, week_start, granted_at)
    VALUES (_user_id, 'weekly_bonus', 5, _week, _week, _at)
    ON CONFLICT ON CONSTRAINT points_event_unique DO NOTHING;
    GET DIAGNOSTICS _count = ROW_COUNT;
    _bonus := _count = 1;
  END IF;
  RETURN QUERY SELECT _day, _week, _daily, _bonus;
END;
$$;
REVOKE ALL ON FUNCTION public.credit_app_access_points_internal(uuid, timestamptz) FROM PUBLIC, anon, authenticated, service_role;
CREATE FUNCTION public.record_app_access_points()
RETURNS TABLE(reference_date date, week_start date, daily_awarded boolean, bonus_awarded boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE _uid uuid := auth.uid(); _at timestamptz := clock_timestamp();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY SELECT * FROM public.credit_app_access_points_internal(_uid, _at);
END;
$$;
REVOKE ALL ON FUNCTION public.record_app_access_points() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.record_app_access_points() TO authenticated;
CREATE FUNCTION public.get_points_ranking(_limit integer DEFAULT 50, _offset integer DEFAULT 0)
RETURNS TABLE("position" bigint, public_name text, total_points bigint, weekly_points bigint, weekly_days bigint, weekly_progress integer, is_current_user boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE _uid uuid := auth.uid(); _week date := date_trunc('week', now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  WITH scores AS (
    SELECT p.user_id, p.public_name, coalesce(sum(e.points), 0)::bigint AS total_points,
      coalesce(sum(e.points) FILTER (WHERE e.week_start = _week), 0)::bigint AS weekly_points,
      count(e.id) FILTER (WHERE e.week_start = _week AND e.event_type = 'daily_login') AS weekly_days
    FROM public.points_participants p LEFT JOIN public.points_events e ON e.user_id = p.user_id
    GROUP BY p.user_id, p.public_name
  ), ranked AS (
    SELECT dense_rank() OVER (ORDER BY s.total_points DESC) AS "position", s.* FROM scores s
  )
  SELECT r."position", r.public_name, r.total_points, r.weekly_points, r.weekly_days,
    least(r.weekly_days, 5)::integer, r.user_id = _uid
  FROM ranked r ORDER BY r."position", r.public_name
  LIMIT least(greatest(coalesce(_limit, 50), 1), 100) OFFSET greatest(coalesce(_offset, 0), 0);
END;
$$;
REVOKE ALL ON FUNCTION public.get_points_ranking(integer, integer) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_points_ranking(integer, integer) TO authenticated;
CREATE FUNCTION public.get_my_points_summary()
RETURNS TABLE("position" bigint, public_name text, total_points bigint, weekly_points bigint, weekly_days bigint, weekly_progress integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE _uid uuid := auth.uid(); _week date := date_trunc('week', now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  WITH scores AS (
    SELECT p.user_id, p.public_name, coalesce(sum(e.points), 0)::bigint AS total_points,
      coalesce(sum(e.points) FILTER (WHERE e.week_start = _week), 0)::bigint AS weekly_points,
      count(e.id) FILTER (WHERE e.week_start = _week AND e.event_type = 'daily_login') AS weekly_days
    FROM public.points_participants p LEFT JOIN public.points_events e ON e.user_id = p.user_id
    GROUP BY p.user_id, p.public_name
  ), ranked AS (
    SELECT dense_rank() OVER (ORDER BY s.total_points DESC) AS "position", s.* FROM scores s
  )
  SELECT r."position", r.public_name, r.total_points, r.weekly_points, r.weekly_days, least(r.weekly_days, 5)::integer
  FROM ranked r WHERE r.user_id = _uid;
END;
$$;
REVOKE ALL ON FUNCTION public.get_my_points_summary() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_points_summary() TO authenticated;
COMMENT ON TABLE public.points_events IS 'Append-only usage credit history. No retroactive seed; not a financial ledger. Browser roles have owner SELECT only.';