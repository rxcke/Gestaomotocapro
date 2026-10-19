CREATE FUNCTION public.points_assert(_condition boolean, _name text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 IF NOT coalesce(_condition, false) THEN RAISE EXCEPTION 'FAIL: %', _name; END IF;
 RAISE NOTICE 'PASS: %', _name;
END;
$$;
CREATE FUNCTION public.points_denied(_sql text) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN EXECUTE _sql; RETURN false; EXCEPTION WHEN insufficient_privilege THEN RETURN true; END;
$$;

SELECT points_assert((SELECT count(*) FROM points_events)=0, 'sem créditos retroativos');
SELECT points_assert(daily_awarded AND NOT bonus_awarded, '1 primeiro acesso +1')
FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000001', '2026-10-19 12:00:00+00');
SELECT points_assert(NOT daily_awarded AND NOT bonus_awarded, '2 segundo acesso sem crédito')
FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000001', '2026-10-19 23:00:00+00');
SELECT * FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000001', '2026-10-20 12:00:00+00');
SELECT * FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000001', '2026-10-21 12:00:00+00');
SELECT * FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000001', '2026-10-22 12:00:00+00');
SELECT points_assert((SELECT sum(points) FROM points_events)=4, 'bônus não antecipado em quatro dias');
SELECT points_assert(daily_awarded AND bonus_awarded, '3 quinto dia concede bônus +5')
FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000001', '2026-10-23 12:00:00+00');
SELECT points_assert((SELECT sum(points) FROM points_events)=10, 'cinco dias totalizam exatamente 10 pontos');
SELECT points_assert(daily_awarded AND NOT bonus_awarded, '4 sexto dia somente +1')
FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000001', '2026-10-24 12:00:00+00');
SELECT points_assert(daily_awarded AND NOT bonus_awarded, '4 sétimo dia somente +1')
FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000001', '2026-10-25 12:00:00+00');
SELECT points_assert((SELECT sum(points) FROM points_events)=12, 'semana completa tem 12 pontos');
SELECT points_assert(daily_awarded AND NOT bonus_awarded AND week_start='2026-10-26', '5 nova semana reinicia contagem')
FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000001', '2026-10-26 12:00:00+00');
SELECT points_assert((SELECT sum(points) FROM points_events WHERE week_start='2026-10-19')=12, '5 histórico anterior preservado');
SELECT points_assert(NOT daily_awarded AND NOT bonus_awarded, '6 reprocessar quinto dia não duplica bônus')
FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000001', '2026-10-23 12:00:00+00');
SELECT * FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000002', '2026-10-19 12:00:00+00');
SELECT points_assert((SELECT sum(points) FROM points_events WHERE user_id='00000000-0000-0000-0000-000000000002')=1, '7 usuários diferentes têm créditos independentes');

SELECT points_assert(reference_date='2026-10-25' AND week_start='2026-10-19', '9 domingo antes da virada Brasília')
FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000002', '2026-10-26 02:59:59+00');
SELECT points_assert(reference_date='2026-10-26' AND week_start='2026-10-26', '9 segunda após virada Brasília')
FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000002', '2026-10-26 03:00:00+00');
SELECT points_assert(reference_date='2026-10-31' AND week_start='2026-10-26', '9 virada do mês antes de meia-noite Brasília')
FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000002', '2026-11-01 02:59:59+00');
SELECT points_assert(reference_date='2026-11-01' AND week_start='2026-10-26', '9 domingo novo mês continua mesma semana')
FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000002', '2026-11-01 03:00:00+00');
SELECT * FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000001', '2026-10-27 12:00:00+00');
SELECT * FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000001', '2026-10-28 12:00:00+00');
SELECT * FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000001', '2026-10-29 12:00:00+00');
SELECT points_assert(bonus_awarded, 'nova semana pode conceder seu próprio bônus')
FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000001', '2026-10-30 12:00:00+00');

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
SELECT points_assert((SELECT count(*) FROM points_events WHERE user_id <> auth.uid())=0, '7 RLS isola histórico alheio');
SELECT points_assert((SELECT count(*) FROM points_participants)=1, 'RLS isola participantes');
SELECT points_assert(points_denied($q$INSERT INTO points_events(user_id,event_type,points,reference_date,week_start) VALUES ('00000000-0000-0000-0000-000000000001','daily_login',1,'2026-10-20','2026-10-19')$q$), '8 inserção direta recusada');
SELECT points_assert(points_denied($q$UPDATE points_events SET points=999 WHERE user_id=auth.uid()$q$), '8 edição direta recusada');
SELECT points_assert(points_denied($q$DELETE FROM points_events WHERE user_id=auth.uid()$q$), '8 exclusão direta recusada');
SELECT points_assert(points_denied($q$UPDATE points_participants SET public_name='falso' WHERE user_id=auth.uid()$q$), 'apelido protegido contra alterações livres');
SELECT points_assert(points_denied($q$SELECT * FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000001','2030-01-01')$q$), 'datas e identidades arbitrárias recusadas');
SELECT points_assert((SELECT total_points FROM get_my_points_summary())=22, 'resumo real calcula total 22');
SELECT points_assert((SELECT count(*) FROM get_points_ranking(100,0))=2, 'ranking só retorna agregados dos dois participantes');
SELECT points_assert((SELECT count(*) FROM get_points_ranking(1,0))=1, 'paginação do ranking');
SELECT points_assert((SELECT count(*) FROM get_points_ranking(100,0) WHERE is_current_user)=1, 'ranking identifica somente participante atual');
SELECT set_config('request.jwt.claim.sub', '', false);
SELECT points_assert(points_denied('SELECT * FROM record_app_access_points()'), 'sessão ausente recusada');
RESET ROLE;
SET ROLE anon;
SELECT points_assert(points_denied('SELECT * FROM record_app_access_points()'), 'anônimo não concede créditos');
SELECT points_assert(points_denied('SELECT * FROM get_points_ranking()'), 'anônimo não lê ranking');
SELECT points_assert(points_denied('SELECT * FROM points_events'), 'anônimo não lê histórico');
RESET ROLE;

-- Authenticated no-argument wrapper on another disposable participant.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', false);
SELECT points_assert(daily_awarded AND reference_date=(clock_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date, 'RPC real usa identidade e relógio do servidor') FROM record_app_access_points();
SELECT points_assert(NOT daily_awarded AND NOT bonus_awarded, 'RPC real repetida é idempotente') FROM record_app_access_points();
RESET ROLE;

-- Four days prepared for the separate simultaneous fifth-day test.
SELECT * FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000004','2026-10-19 12:00:00+00');
SELECT * FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000004','2026-10-20 12:00:00+00');
SELECT * FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000004','2026-10-21 12:00:00+00');
SELECT * FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000004','2026-10-22 12:00:00+00');