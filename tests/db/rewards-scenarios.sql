CREATE FUNCTION public.reward_assert(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %',label; END IF; RAISE NOTICE 'PASS: %',label; END $$;
CREATE FUNCTION public.reward_fails(statement text,expected text) RETURNS boolean LANGUAGE plpgsql AS $$ BEGIN EXECUTE statement; RETURN false; EXCEPTION WHEN OTHERS THEN IF position(expected IN SQLERRM)>0 THEN RETURN true; END IF; RAISE; END $$;
-- Isolated fixture credits only. No connected database writes.
SELECT * FROM public.credit_app_access_points_internal('00000000-0000-0000-0000-000000000001','2026-10-19 12:00Z');
SELECT * FROM public.credit_app_access_points_internal('00000000-0000-0000-0000-000000000001','2026-10-20 12:00Z');
SELECT * FROM public.credit_app_access_points_internal('00000000-0000-0000-0000-000000000001','2026-10-21 12:00Z');
SELECT * FROM public.credit_app_access_points_internal('00000000-0000-0000-0000-000000000001','2026-10-22 12:00Z');
SELECT * FROM public.credit_app_access_points_internal('00000000-0000-0000-0000-000000000001','2026-10-23 12:00Z');
SELECT * FROM public.credit_app_access_points_internal('00000000-0000-0000-0000-000000000002','2026-10-19 12:00Z');
INSERT INTO public.rewards(id,name,category,points_cost,stock,conditions,delivery_method,delivery_days,active) VALUES
('10000000-0000-0000-0000-000000000001','Isolated digital','digital',4,10,'Test conditions','Manual',0,true),
('10000000-0000-0000-0000-000000000002','Overspend fixture','digital',7,10,'Test conditions','Manual',0,true),
('10000000-0000-0000-0000-000000000003','Last unit fixture','digital',1,1,'Test conditions','Manual',0,true),
('10000000-0000-0000-0000-000000000004','Unavailable fixture','digital',1,0,'Test conditions','Manual',0,true),
('10000000-0000-0000-0000-000000000005','Physical fixture','physical',1,2,'Test conditions','Manual',0,true),
('10000000-0000-0000-0000-000000000006','Inactive fixture','digital',1,2,'Test conditions','Manual',0,false),
('10000000-0000-0000-0000-000000000007','Expired fixture','digital',1,2,'Test conditions','Manual',0,true),
('10000000-0000-0000-0000-000000000008','Codes fixture','digital',1,2,'Test conditions','Manual',0,true);
UPDATE public.rewards SET expires_at=now()-interval '1 day' WHERE id='10000000-0000-0000-0000-000000000007';
UPDATE public.rewards SET uses_codes=true WHERE id='10000000-0000-0000-0000-000000000008';
INSERT INTO public.reward_codes(reward_id,code) VALUES('10000000-0000-0000-0000-000000000008','PRIVATE-ISOLATED');
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
SELECT reward_assert((SELECT earned=10 AND available=10 AND reserved=0 AND spent=0 AND NOT enabled FROM get_reward_wallet()),'existing earnings available; absent setting closed');
SELECT reward_assert(reward_fails($q$SELECT request_reward('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',4)$q$,'club_closed'),'closed at database boundary');
RESET ROLE;
INSERT INTO public.rewards_settings(id,redemptions_enabled) VALUES(true,true);
SET ROLE authenticated;
SELECT reward_assert(reward_fails($q$SELECT request_reward('10000000-0000-0000-0000-000000000004',gen_random_uuid(),1)$q$,'stock_insufficient'),'zero stock refused');
SELECT reward_assert(reward_fails($q$SELECT request_reward('10000000-0000-0000-0000-000000000001',gen_random_uuid(),3)$q$,'price_changed'),'changed price refused');
SELECT reward_assert(reward_fails($q$SELECT request_reward('10000000-0000-0000-0000-000000000006',gen_random_uuid(),1)$q$,'reward_unavailable'),'inactive refused');
SELECT reward_assert(reward_fails($q$SELECT request_reward('10000000-0000-0000-0000-000000000007',gen_random_uuid(),1)$q$,'reward_unavailable'),'expired refused');
SELECT reward_assert(reward_fails($q$SELECT request_reward('10000000-0000-0000-0000-000000000005',gen_random_uuid(),1)$q$,'address_required'),'physical needs minimum address');
SELECT reward_assert(reward_fails($q$SELECT request_reward('10000000-0000-0000-0000-000000000001',gen_random_uuid(),4,'{}')$q$,'address_not_required'),'digital rejects extra address');
SELECT request_reward('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',4) AS request_id \gset
SELECT reward_assert((SELECT available=6 AND reserved=4 AND spent=0 AND earned=10 FROM get_reward_wallet()),'10 earned reserve 4 yields available 6');
SELECT reward_assert(request_reward('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',4)=:'request_id'::uuid,'identical replay returns original');
SELECT reward_assert(reward_fails($q$SELECT request_reward('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001',7)$q$,'idempotency_conflict'),'key payload conflict refused');
SELECT reward_assert(reward_fails($q$SELECT request_reward('10000000-0000-0000-0000-000000000002',gen_random_uuid(),7)$q$,'points_insufficient'),'insufficient points refused');
SELECT reward_assert(reward_fails($q$UPDATE public.reward_wallet_entries SET points=999$q$,'permission denied'),'direct wallet writes denied');
SELECT reward_assert(reward_fails($q$UPDATE public.reward_redemptions SET status='approved'$q$,'permission denied'),'direct status writes denied');
SELECT reward_assert(reward_fails($q$SELECT save_reward_partner('{"name":"Forged"}')$q$,'reward_forbidden'),'non-admin partner change denied');
SELECT reward_assert(reward_fails(format('SELECT process_reward(%L,''approved'')',:'request_id')),'reward_forbidden'),'non-admin approval denied');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
SELECT reward_assert((SELECT count(*) FROM reward_redemptions)=0,'other owner cannot read request');
SELECT reward_assert((SELECT count(*) FROM reward_wallet_entries)=0,'other owner cannot read wallet');
SELECT reward_assert((SELECT count(*) FROM reward_delivery)=0,'other owner cannot read delivery');
SELECT reward_assert(reward_fails(format('SELECT process_reward(%L,''canceled'')',:'request_id')),'reward_forbidden'),'other owner cannot cancel');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
SELECT process_reward(:'request_id','approved');
SELECT process_reward(:'request_id','approved');
SELECT reward_assert(reward_fails(format('SELECT process_reward(%L,''canceled'')',:'request_id')),'invalid_transition'),'approved cancellation denied');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
SELECT reward_assert((SELECT spent=4 AND reserved=0 AND available=6 AND earned=10 FROM get_reward_wallet()),'approval spends once without second deduction');
SELECT reward_assert((SELECT total_points=10 FROM get_my_points_summary()),'earned ranking unchanged after spend');
SELECT request_reward('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002',4) AS cancel_id \gset
SELECT process_reward(:'cancel_id','canceled'); SELECT process_reward(:'cancel_id','canceled');
SELECT reward_assert((SELECT available=6 AND reserved=0 AND spent=4 FROM get_reward_wallet()),'cancel releases once');
SELECT request_reward('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003',4) AS reject_id \gset
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
SELECT reward_assert(reward_fails(format('SELECT process_reward(%L,''rejected'')',:'reject_id')),'reason_required'),'rejection needs reason');
SELECT process_reward(:'reject_id','rejected','Unavailable'); SELECT process_reward(:'reject_id','rejected','Unavailable');
SELECT reward_assert(reward_fails(format('SELECT process_reward(%L,''approved'')',:'reject_id')),'invalid_transition'),'terminal request cannot reopen');
SELECT reward_assert(reward_fails(format('SELECT process_reward(%L,''delivered'')',:'request_id')),'delivery_required'),'delivery requires evidence');
SELECT process_reward(:'request_id','delivered','','','Delivered manually'); SELECT process_reward(:'request_id','delivered','','','Delivered manually');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
SELECT reward_assert((SELECT earned=10 AND available=6 AND reserved=0 AND spent=4 FROM get_reward_wallet()),'rejection restores reserve, earned unchanged');
SELECT request_reward('10000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000004',1) AS code_id \gset
SELECT reward_assert((SELECT count(*) FROM reward_codes)=0,'pending code hidden even from owner');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
SELECT reward_assert((SELECT count(*) FROM reward_codes WHERE redemption_id=:'code_id')=1,'code uniquely assigned to request');
SELECT process_reward(:'code_id','approved');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
SELECT reward_assert((SELECT count(*) FROM reward_codes)=1,'approved code readable by owner');
SELECT reward_assert(reward_fails($q$SELECT request_reward('10000000-0000-0000-0000-000000000008',gen_random_uuid(),1)$q$,'stock_insufficient'),'assigned code cannot be reused');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
SELECT reward_assert((SELECT count(*) FROM reward_codes)=0,'other owner cannot read code');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
SELECT reward_assert(reward_fails($q$SELECT request_reward('10000000-0000-0000-0000-000000000001',gen_random_uuid(),4)$q$,'not_eligible'),'ineligible owner refused');
RESET ROLE;
SELECT reward_assert(reward_fails($q$UPDATE reward_wallet_entries SET points=999$q$,'reward_history_immutable'),'history immutable even privileged');
SELECT reward_assert((SELECT committed=1 FROM rewards WHERE id='10000000-0000-0000-0000-000000000001'),'stock restored once on cancel/reject');
SELECT reward_assert((SELECT count(*) FROM reward_redemptions)=4,'failed requests leave no rows');
SELECT reward_assert((SELECT count(*) FROM reward_audit WHERE action='status')=6,'status audit not duplicated');
SET ROLE anon;
SELECT reward_assert(reward_fails($q$SELECT get_reward_wallet()$q$,'permission denied'),'anonymous wallet denied');
RESET ROLE;
-- Dedicated concurrent fixtures: remaining available 5, parallel cost 4.
