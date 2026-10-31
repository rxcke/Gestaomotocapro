-- Monthly goal: +10 points at 20 distinct authenticated access days in the same Brasilia month.
-- Additive: widens the event-kind CHECK (superset), keeps all existing rows and rules.
ALTER TABLE public.points_events DROP CONSTRAINT points_event_kind_value;
ALTER TABLE public.points_events ADD CONSTRAINT points_event_kind_value CHECK ((event_type = 'daily_login' AND points = 1) OR (event_type = 'weekly_bonus' AND points = 5) OR (event_type = 'monthly_bonus' AND points = 10));
ALTER TABLE public.points_events ADD CONSTRAINT points_monthly_bonus_reference CHECK (event_type <> 'monthly_bonus' OR reference_date = date_trunc('month', reference_date)::date);

DROP FUNCTION public.record_app_access_points();
DROP FUNCTION public.credit_app_access_points_internal(uuid, timestamptz);
CREATE FUNCTION public.credit_app_access_points_internal(_user_id uuid, _at timestamptz)
RETURNS TABLE(reference_date date, week_start date, daily_awarded boolean, bonus_awarded boolean, monthly_bonus_awarded boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  _day date := (_at AT TIME ZONE 'America/Sao_Paulo')::date;
  _week date := date_trunc('week', _at AT TIME ZONE 'America/Sao_Paulo')::date;
  _month date := date_trunc('month', _at AT TIME ZONE 'America/Sao_Paulo')::date;
  _daily boolean := false;
  _bonus boolean := false;
  _monthly boolean := false;
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
  SELECT count(DISTINCT e.reference_date) INTO _count FROM public.points_events e
    WHERE e.user_id = _user_id AND e.event_type = 'daily_login'
      AND date_trunc('month', e.reference_date)::date = _month;
  IF _count >= 20 THEN
    INSERT INTO public.points_events(user_id, event_type, points, reference_date, week_start, granted_at)
    VALUES (_user_id, 'monthly_bonus', 10, _month, date_trunc('week', _month)::date, _at)
    ON CONFLICT ON CONSTRAINT points_event_unique DO NOTHING;
    GET DIAGNOSTICS _count = ROW_COUNT;
    _monthly := _count = 1;
  END IF;
  RETURN QUERY SELECT _day, _week, _daily, _bonus, _monthly;
END;
$$;
REVOKE ALL ON FUNCTION public.credit_app_access_points_internal(uuid, timestamptz) FROM PUBLIC, anon, authenticated, service_role;
CREATE FUNCTION public.record_app_access_points()
RETURNS TABLE(reference_date date, week_start date, daily_awarded boolean, bonus_awarded boolean, monthly_bonus_awarded boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE _uid uuid := auth.uid(); _at timestamptz := clock_timestamp();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY SELECT * FROM public.credit_app_access_points_internal(_uid, _at);
END;
$$;
REVOKE ALL ON FUNCTION public.record_app_access_points() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.record_app_access_points() TO authenticated;

DROP FUNCTION public.get_points_ranking(integer, integer);
CREATE FUNCTION public.get_points_ranking(_limit integer DEFAULT 50, _offset integer DEFAULT 0, _period text DEFAULT 'all')
RETURNS TABLE("position" bigint, public_name text, total_points bigint, weekly_points bigint, weekly_days bigint, weekly_progress integer, period_points bigint, is_current_user boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  _uid uuid := auth.uid();
  _week date := date_trunc('week', now() AT TIME ZONE 'America/Sao_Paulo')::date;
  _month date := date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501'; END IF;
  IF _period NOT IN ('week', 'month', 'all') THEN RAISE EXCEPTION 'invalid_period' USING ERRCODE = '22023'; END IF;
  RETURN QUERY
  WITH scores AS (
    SELECT p.user_id, p.public_name, coalesce(sum(e.points), 0)::bigint AS total_points,
      coalesce(sum(e.points) FILTER (WHERE e.week_start = _week), 0)::bigint AS weekly_points,
      count(e.id) FILTER (WHERE e.week_start = _week AND e.event_type = 'daily_login') AS weekly_days,
      coalesce(sum(e.points) FILTER (WHERE
        (_period = 'week' AND e.week_start = _week) OR
        (_period = 'month' AND date_trunc('month', e.reference_date)::date = _month) OR
        (_period = 'all')), 0)::bigint AS period_points
    FROM public.points_participants p LEFT JOIN public.points_events e ON e.user_id = p.user_id
    GROUP BY p.user_id, p.public_name
  ), ranked AS (
    SELECT dense_rank() OVER (ORDER BY s.period_points DESC) AS "position", s.* FROM scores s
  )
  SELECT r."position", r.public_name, r.total_points, r.weekly_points, r.weekly_days,
    least(r.weekly_days, 5)::integer, r.period_points, r.user_id = _uid
  FROM ranked r ORDER BY r."position", r.public_name
  LIMIT least(greatest(coalesce(_limit, 50), 1), 100) OFFSET greatest(coalesce(_offset, 0), 0);
END;
$$;
REVOKE ALL ON FUNCTION public.get_points_ranking(integer, integer, text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_points_ranking(integer, integer, text) TO authenticated;

DROP FUNCTION public.get_my_points_summary();
CREATE FUNCTION public.get_my_points_summary()
RETURNS TABLE("position" bigint, public_name text, total_points bigint, weekly_points bigint, weekly_days bigint, weekly_progress integer, monthly_points bigint, monthly_days bigint, monthly_progress integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  _uid uuid := auth.uid();
  _week date := date_trunc('week', now() AT TIME ZONE 'America/Sao_Paulo')::date;
  _month date := date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  WITH scores AS (
    SELECT p.user_id, p.public_name, coalesce(sum(e.points), 0)::bigint AS total_points,
      coalesce(sum(e.points) FILTER (WHERE e.week_start = _week), 0)::bigint AS weekly_points,
      count(e.id) FILTER (WHERE e.week_start = _week AND e.event_type = 'daily_login') AS weekly_days,
      coalesce(sum(e.points) FILTER (WHERE date_trunc('month', e.reference_date)::date = _month), 0)::bigint AS monthly_points,
      count(DISTINCT e.reference_date) FILTER (WHERE e.event_type = 'daily_login' AND date_trunc('month', e.reference_date)::date = _month) AS monthly_days
    FROM public.points_participants p LEFT JOIN public.points_events e ON e.user_id = p.user_id
    GROUP BY p.user_id, p.public_name
  ), ranked AS (
    SELECT dense_rank() OVER (ORDER BY s.total_points DESC) AS "position", s.* FROM scores s
  )
  SELECT r."position", r.public_name, r.total_points, r.weekly_points, r.weekly_days, least(r.weekly_days, 5)::integer,
    r.monthly_points, r.monthly_days, least(r.monthly_days, 20)::integer
  FROM ranked r WHERE r.user_id = _uid;
END;
$$;
REVOKE ALL ON FUNCTION public.get_my_points_summary() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_points_summary() TO authenticated;
COMMENT ON CONSTRAINT points_monthly_bonus_reference ON public.points_events IS 'Monthly bonus reference_date is always the Brasilia month start, so points_event_unique grants it once per user per month.';