-- Monthly bonus scenarios, run after points-integrity.sql in the disposable database.
INSERT INTO public.profiles VALUES
('00000000-0000-0000-0000-000000000010'),
('00000000-0000-0000-0000-000000000011'),
('00000000-0000-0000-0000-000000000012'),
('00000000-0000-0000-0000-000000000013'),
('00000000-0000-0000-0000-000000000014'),
('00000000-0000-0000-0000-000000000015'),
('00000000-0000-0000-0000-000000000016');

CREATE FUNCTION public.points_raises(_sql text) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN EXECUTE _sql; RETURN false; EXCEPTION WHEN OTHERS THEN RETURN true; END;
$$;

-- User 10: nineteen distinct November days must not grant the monthly bonus.
SELECT * FROM generate_series(1, 19) AS d, LATERAL credit_app_access_points_internal('00000000-0000-0000-0000-000000000010', ('2026-11-' || lpad(d::text, 2, '0') || ' 12:00:00+00')::timestamptz);
SELECT points_assert((SELECT count(*) FROM points_events WHERE user_id='00000000-0000-0000-0000-000000000010' AND event_type='monthly_bonus')=0, 'M1 dezenove dias sem bônus mensal');
SELECT points_assert((SELECT sum(points) FROM points_events WHERE user_id='00000000-0000-0000-0000-000000000010')=29, 'M1 dezenove dias totalizam 29 com bônus semanais');

-- Twentieth distinct day grants daily + weekly (fifth day of that week) + monthly, exactly once.
SELECT points_assert(daily_awarded AND bonus_awarded AND monthly_bonus_awarded, 'M2 vigésimo dia concede +1, +5 semanal e +10 mensal')
FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000010', '2026-11-20 12:00:00+00');
SELECT points_assert((SELECT sum(points) FROM points_events WHERE user_id='00000000-0000-0000-0000-000000000010')=45, 'M2 vigésimo dia totaliza 45 pontos');
SELECT points_assert((SELECT count(*) FROM points_events WHERE user_id='00000000-0000-0000-0000-000000000010' AND event_type='monthly_bonus')=1, 'M2 bônus mensal único');
SELECT points_assert((SELECT reference_date FROM points_events WHERE user_id='00000000-0000-0000-0000-000000000010' AND event_type='monthly_bonus')='2026-11-01', 'M2 bônus mensal referencia o início do mês');

-- Twenty-first day and reprocessing never repeat the monthly bonus.
SELECT points_assert(daily_awarded AND NOT monthly_bonus_awarded, 'M3 vigésimo primeiro dia somente +1')
FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000010', '2026-11-21 12:00:00+00');
SELECT points_assert(NOT daily_awarded AND NOT bonus_awarded AND NOT monthly_bonus_awarded, 'M3 reprocessar o vigésimo dia não duplica nada')
FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000010', '2026-11-20 12:00:00+00');
SELECT points_assert((SELECT count(*) FROM points_events WHERE user_id='00000000-0000-0000-0000-000000000010' AND event_type='monthly_bonus')=1, 'M3 bônus mensal continua único');

-- Month rollover: December starts a new day count and preserves every earned point.
SELECT points_assert(daily_awarded AND NOT monthly_bonus_awarded, 'M4 virada do mês reinicia a contagem sem bônus')
FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000010', '2026-12-01 12:00:00+00');
SELECT points_assert((SELECT sum(points) FROM points_events WHERE user_id='00000000-0000-0000-0000-000000000010')=47, 'M4 saldo histórico preservado na virada do mês');

-- User 11: year rollover follows the Brasilia calendar.
SELECT points_assert(reference_date='2026-12-31', 'M5 véspera de ano novo ainda é dezembro em Brasília')
FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000011', '2027-01-01 02:59:59+00');
SELECT points_assert(reference_date='2027-01-01', 'M5 virada de ano após meia-noite em Brasília')
FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000011', '2027-01-01 03:00:00+00');

-- User 12: a week crossing two months keeps each daily day in its own month;
-- the weekly bonus references the week start, so it counts in the earlier month.
SELECT * FROM generate_series(1, 6) AS d, LATERAL credit_app_access_points_internal('00000000-0000-0000-0000-000000000012', ('2026-10-' || (25 + d)::text || ' 12:00:00+00')::timestamptz);
SELECT * FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000012', '2026-11-01 12:00:00+00');
SELECT points_assert((SELECT coalesce(sum(points),0) FROM points_events WHERE user_id='00000000-0000-0000-0000-000000000012' AND date_trunc('month', reference_date)::date='2026-10-01')=11, 'M6 semana entre meses: outubro soma seis dias e o bônus semanal');
SELECT points_assert((SELECT coalesce(sum(points),0) FROM points_events WHERE user_id='00000000-0000-0000-0000-000000000012' AND date_trunc('month', reference_date)::date='2026-11-01')=1, 'M6 semana entre meses: novembro soma apenas o dia primeiro');
SELECT points_assert((SELECT count(*) FROM points_events WHERE user_id='00000000-0000-0000-0000-000000000012' AND event_type='monthly_bonus')=0, 'M6 bônus semanal não dispara bônus mensal');

-- Ranking periods: user 13 accesses today; user 14 only has August 2026 days.
SELECT * FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000013', clock_timestamp());
SELECT * FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000014', '2026-08-03 12:00:00+00');
SELECT * FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000014', '2026-08-04 12:00:00+00');
SELECT * FROM credit_app_access_points_internal('00000000-0000-0000-0000-000000000014', '2026-08-05 12:00:00+00');
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000013', false);
SELECT points_assert((SELECT period_points FROM get_points_ranking(100, 0, 'all') r JOIN points_participants p ON p.public_name = r.public_name WHERE p.user_id='00000000-0000-0000-0000-000000000014')=3, 'M7 ranking geral usa o total histórico');
SELECT points_assert((SELECT period_points FROM get_points_ranking(100, 0, 'month') r JOIN points_participants p ON p.public_name = r.public_name WHERE p.user_id='00000000-0000-0000-0000-000000000014')=0, 'M7 ranking mensal ignora meses anteriores');
SELECT points_assert((SELECT period_points FROM get_points_ranking(100, 0, 'month') r JOIN points_participants p ON p.public_name = r.public_name WHERE p.user_id='00000000-0000-0000-0000-000000000013')=1, 'M7 ranking mensal conta o acesso de hoje');
SELECT points_assert((SELECT period_points FROM get_points_ranking(100, 0, 'week') r JOIN points_participants p ON p.public_name = r.public_name WHERE p.user_id='00000000-0000-0000-0000-000000000013')=1, 'M7 ranking semanal conta o acesso de hoje');
SELECT points_assert((SELECT r13."position" < r14."position" FROM get_points_ranking(100, 0, 'month') r13 JOIN points_participants p13 ON p13.public_name = r13.public_name, get_points_ranking(100, 0, 'month') r14 JOIN points_participants p14 ON p14.public_name = r14.public_name WHERE p13.user_id='00000000-0000-0000-0000-000000000013' AND p14.user_id='00000000-0000-0000-0000-000000000014'), 'M7 classificação mensal ordena por pontos do mês');
SELECT points_assert(points_raises($$SELECT * FROM get_points_ranking(100, 0, 'yearly')$$), 'M7 período inválido recusado');
SELECT points_assert((SELECT monthly_days FROM get_my_points_summary())=1, 'M8 resumo conta o dia de hoje no mês');
SELECT points_assert((SELECT monthly_points FROM get_my_points_summary())>=1, 'M8 resumo soma pontos do mês');
SELECT points_assert((SELECT monthly_progress FROM get_my_points_summary())=1, 'M8 progresso mensal limitado a vinte dias');
SELECT points_assert(points_denied($q$INSERT INTO points_events(user_id,event_type,points,reference_date,week_start) VALUES ('00000000-0000-0000-0000-000000000013','monthly_bonus',10,'2026-10-01','2026-09-28')$q$), 'M9 inserção direta de bônus mensal recusada');
SELECT set_config('request.jwt.claim.sub', '', false);
RESET ROLE;

-- Monthly bonus CHECK: reference_date must be the month start.
SELECT points_assert(points_raises($q$INSERT INTO points_events(user_id,event_type,points,reference_date,week_start) VALUES ('00000000-0000-0000-0000-000000000016','monthly_bonus',10,'2026-11-20','2026-11-16')$q$), 'M9 bônus mensal fora do início do mês recusado');

-- User 15: nineteen November days prepared for the simultaneous twentieth-day test in the shell script.
SELECT * FROM generate_series(1, 19) AS d, LATERAL credit_app_access_points_internal('00000000-0000-0000-0000-000000000015', ('2026-11-' || lpad(d::text, 2, '0') || ' 12:00:00+00')::timestamptz);
SELECT points_assert((SELECT count(*) FROM points_events WHERE user_id='00000000-0000-0000-0000-000000000015' AND event_type='monthly_bonus')=0, 'M10 usuário preparado com dezenove dias sem bônus mensal');
