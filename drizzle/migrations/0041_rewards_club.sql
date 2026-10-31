CREATE TABLE public.rewards_settings (id boolean PRIMARY KEY DEFAULT true CHECK(id), redemptions_enabled boolean NOT NULL DEFAULT false);
GRANT SELECT ON public.rewards_settings TO authenticated; GRANT ALL ON public.rewards_settings TO service_role;
ALTER TABLE public.rewards_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY rewards_settings_read ON public.rewards_settings FOR SELECT TO authenticated USING (true);
CREATE TABLE public.reward_partners (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 150), instructions text NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT clock_timestamp());
GRANT SELECT ON public.reward_partners TO authenticated; GRANT ALL ON public.reward_partners TO service_role;
ALTER TABLE public.reward_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY reward_partners_read ON public.reward_partners FOR SELECT TO authenticated USING(active OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.rewards (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), partner_id uuid REFERENCES public.reward_partners(id), name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 150), description text NOT NULL DEFAULT '', image_url text, category text NOT NULL CHECK(category IN ('partner','physical','digital')), points_cost integer NOT NULL CHECK(points_cost>0), stock integer CHECK(stock>=0), committed integer NOT NULL DEFAULT 0 CHECK(committed>=0), conditions text NOT NULL, delivery_method text NOT NULL, delivery_days integer NOT NULL CHECK(delivery_days>=0), active boolean NOT NULL DEFAULT false, expires_at timestamptz, uses_codes boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), CHECK(stock IS NULL OR stock>=committed), CHECK(image_url IS NULL OR image_url LIKE 'https://%'), CHECK(category<>'physical' OR stock IS NOT NULL), CHECK(category<>'partner' OR partner_id IS NOT NULL));
GRANT SELECT ON public.rewards TO authenticated; GRANT ALL ON public.rewards TO service_role;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY rewards_read ON public.rewards FOR SELECT TO authenticated USING(active OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.reward_redemptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, reward_id uuid NOT NULL REFERENCES public.rewards(id), idempotency_key uuid NOT NULL, snapshot jsonb NOT NULL, points_cost integer NOT NULL CHECK(points_cost>0), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','canceled','shipped','delivered')), created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), UNIQUE(user_id,idempotency_key));
GRANT SELECT ON public.reward_redemptions TO authenticated; GRANT ALL ON public.reward_redemptions TO service_role;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY reward_redemptions_read ON public.reward_redemptions FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX reward_redemptions_owner ON public.reward_redemptions(user_id,created_at DESC);
CREATE TABLE public.reward_wallet_entries (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, redemption_id uuid NOT NULL REFERENCES public.reward_redemptions(id), kind text NOT NULL CHECK(kind IN ('reserve','spend','release')), points integer NOT NULL CHECK(points>0), created_at timestamptz NOT NULL DEFAULT clock_timestamp(), UNIQUE(redemption_id,kind));
CREATE UNIQUE INDEX reward_wallet_one_resolution ON public.reward_wallet_entries(redemption_id) WHERE kind IN ('spend','release');
GRANT SELECT ON public.reward_wallet_entries TO authenticated; GRANT ALL ON public.reward_wallet_entries TO service_role;
ALTER TABLE public.reward_wallet_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY reward_wallet_read ON public.reward_wallet_entries FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX reward_wallet_owner ON public.reward_wallet_entries(user_id);
CREATE TABLE public.reward_delivery (redemption_id uuid PRIMARY KEY REFERENCES public.reward_redemptions(id), user_id uuid NOT NULL, address jsonb, instructions text, tracking text, updated_at timestamptz NOT NULL DEFAULT clock_timestamp());
GRANT SELECT ON public.reward_delivery TO authenticated; GRANT ALL ON public.reward_delivery TO service_role;
ALTER TABLE public.reward_delivery ENABLE ROW LEVEL SECURITY;
CREATE POLICY reward_delivery_read ON public.reward_delivery FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.reward_codes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reward_id uuid NOT NULL REFERENCES public.rewards(id), code text NOT NULL CHECK(length(btrim(code)) BETWEEN 1 AND 500), expires_at timestamptz, redemption_id uuid UNIQUE REFERENCES public.reward_redemptions(id), UNIQUE(reward_id,code));
GRANT SELECT ON public.reward_codes TO authenticated; GRANT ALL ON public.reward_codes TO service_role;
ALTER TABLE public.reward_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY reward_codes_read ON public.reward_codes FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM public.reward_redemptions r WHERE r.id=redemption_id AND r.user_id=auth.uid() AND r.status IN ('approved','shipped','delivered')));
CREATE TABLE public.reward_audit (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid NOT NULL, entity_id uuid NOT NULL, action text NOT NULL, changes jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT clock_timestamp());
GRANT SELECT ON public.reward_audit TO authenticated; GRANT ALL ON public.reward_audit TO service_role;
ALTER TABLE public.reward_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY reward_audit_read ON public.reward_audit FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE TABLE public.reward_status_history (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), redemption_id uuid NOT NULL REFERENCES public.reward_redemptions(id), user_id uuid NOT NULL, actor_id uuid NOT NULL, status text NOT NULL, note text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT clock_timestamp(), UNIQUE(redemption_id,status));
GRANT SELECT ON public.reward_status_history TO authenticated; GRANT ALL ON public.reward_status_history TO service_role;
ALTER TABLE public.reward_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY reward_status_read ON public.reward_status_history FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.reward_immutable_history() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$ BEGIN RAISE EXCEPTION 'reward_history_immutable'; END $$;
CREATE TRIGGER reward_wallet_immutable BEFORE UPDATE OR DELETE ON public.reward_wallet_entries FOR EACH ROW EXECUTE FUNCTION public.reward_immutable_history();
CREATE TRIGGER reward_audit_immutable BEFORE UPDATE OR DELETE ON public.reward_audit FOR EACH ROW EXECUTE FUNCTION public.reward_immutable_history();
CREATE TRIGGER reward_status_immutable BEFORE UPDATE OR DELETE ON public.reward_status_history FOR EACH ROW EXECUTE FUNCTION public.reward_immutable_history();
REVOKE ALL ON FUNCTION public.reward_immutable_history() FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.get_reward_wallet() RETURNS TABLE(earned bigint,spent bigint,reserved bigint,available bigint,enabled boolean) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE='42501'; END IF;
RETURN QUERY WITH e AS(SELECT coalesce(sum(points),0)::bigint n FROM public.points_events WHERE user_id=auth.uid()), m AS(SELECT coalesce(sum(points) FILTER(WHERE kind='spend'),0)::bigint s,coalesce(sum(CASE WHEN kind='reserve' THEN points ELSE -points END),0)::bigint r FROM public.reward_wallet_entries WHERE user_id=auth.uid()) SELECT e.n,m.s,m.r,e.n-m.s-m.r,coalesce((SELECT redemptions_enabled FROM public.rewards_settings WHERE id),false) FROM e CROSS JOIN m;
END $$;
REVOKE ALL ON FUNCTION public.get_reward_wallet() FROM PUBLIC,anon,service_role; GRANT EXECUTE ON FUNCTION public.get_reward_wallet() TO authenticated;
CREATE FUNCTION public.request_reward(_reward_id uuid,_key uuid,_expected_cost integer,_address jsonb DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid(); r public.rewards%ROWTYPE; old public.reward_redemptions%ROWTYPE; rid uuid; cid uuid; balance bigint;
BEGIN
IF u IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE='42501'; END IF;
IF _key IS NULL THEN RAISE EXCEPTION 'invalid_request'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(u::text,619));
SELECT * INTO old FROM public.reward_redemptions WHERE user_id=u AND idempotency_key=_key;
IF old.id IS NOT NULL THEN
IF old.reward_id<>_reward_id OR old.points_cost IS DISTINCT FROM _expected_cost OR (SELECT address FROM public.reward_delivery WHERE redemption_id=old.id) IS DISTINCT FROM _address THEN RAISE EXCEPTION 'idempotency_conflict'; END IF;
RETURN old.id; END IF;
IF NOT coalesce((SELECT redemptions_enabled FROM public.rewards_settings WHERE id),false) THEN RAISE EXCEPTION 'club_closed'; END IF;
IF NOT public.has_app_access(u) THEN RAISE EXCEPTION 'not_eligible' USING ERRCODE='42501'; END IF;
SELECT * INTO r FROM public.rewards WHERE id=_reward_id FOR UPDATE;
IF r.id IS NULL OR NOT r.active OR (r.expires_at IS NOT NULL AND r.expires_at<=clock_timestamp()) THEN RAISE EXCEPTION 'reward_unavailable'; END IF;
IF r.category='partner' AND NOT EXISTS(SELECT 1 FROM public.reward_partners WHERE id=r.partner_id AND active) THEN RAISE EXCEPTION 'reward_unavailable'; END IF;
IF r.points_cost IS DISTINCT FROM _expected_cost THEN RAISE EXCEPTION 'price_changed'; END IF;
IF r.stock IS NOT NULL AND r.committed>=r.stock THEN RAISE EXCEPTION 'stock_insufficient'; END IF;
SELECT available INTO balance FROM public.get_reward_wallet();
IF balance<r.points_cost THEN RAISE EXCEPTION 'points_insufficient'; END IF;
IF r.category='physical' THEN
IF _address IS NULL OR jsonb_typeof(_address)<>'object' OR length(_address::text)>2000 OR coalesce(length(btrim(_address->>'recipient')),0)<2 OR coalesce(_address->>'postal_code','') !~ '^[0-9]{8}$' OR coalesce(length(btrim(_address->>'street')),0)<2 OR coalesce(length(btrim(_address->>'number')),0)<1 OR coalesce(length(btrim(_address->>'district')),0)<2 OR coalesce(length(btrim(_address->>'city')),0)<2 OR coalesce(_address->>'state','') !~ '^[A-Z]{2}$' OR (_address - ARRAY['recipient','postal_code','street','number','district','city','state','complement'])<>'{}'::jsonb THEN RAISE EXCEPTION 'address_required'; END IF;
ELSIF _address IS NOT NULL THEN RAISE EXCEPTION 'address_not_required'; END IF;
IF r.uses_codes THEN SELECT id INTO cid FROM public.reward_codes WHERE reward_id=r.id AND redemption_id IS NULL AND (expires_at IS NULL OR expires_at>clock_timestamp()+make_interval(days=>r.delivery_days)) ORDER BY id LIMIT 1 FOR UPDATE; IF cid IS NULL THEN RAISE EXCEPTION 'stock_insufficient'; END IF; END IF;
INSERT INTO public.reward_redemptions(user_id,reward_id,idempotency_key,snapshot,points_cost) VALUES(u,r.id,_key,jsonb_build_object('name',r.name,'category',r.category,'conditions',r.conditions,'delivery_method',r.delivery_method,'delivery_days',r.delivery_days,'uses_codes',r.uses_codes),r.points_cost) RETURNING id INTO rid;
INSERT INTO public.reward_wallet_entries(user_id,redemption_id,kind,points) VALUES(u,rid,'reserve',r.points_cost);
INSERT INTO public.reward_delivery(redemption_id,user_id,address) VALUES(rid,u,_address);
IF cid IS NOT NULL THEN UPDATE public.reward_codes SET redemption_id=rid WHERE id=cid; END IF;
UPDATE public.rewards SET committed=committed+1 WHERE id=r.id;
INSERT INTO public.reward_status_history(redemption_id,user_id,actor_id,status) VALUES(rid,u,u,'pending');
RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.request_reward(uuid,uuid,integer,jsonb) FROM PUBLIC,anon,service_role; GRANT EXECUTE ON FUNCTION public.request_reward(uuid,uuid,integer,jsonb) TO authenticated;
CREATE FUNCTION public.process_reward(_id uuid,_status text,_note text DEFAULT '',_tracking text DEFAULT '',_instructions text DEFAULT '') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid(); own uuid; rw uuid; q public.reward_redemptions%ROWTYPE; admin boolean;
BEGIN
IF u IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE='42501'; END IF;
admin:=public.has_role(u,'admin');
SELECT user_id,reward_id INTO own,rw FROM public.reward_redemptions WHERE id=_id;
IF own IS NULL OR (own<>u AND NOT admin) OR (_status<>'canceled' AND NOT admin) THEN RAISE EXCEPTION 'reward_forbidden' USING ERRCODE='42501'; END IF;
IF _status NOT IN ('approved','rejected','canceled','shipped','delivered') OR _status IS NULL OR length(coalesce(_note,''))>1000 OR length(coalesce(_instructions,''))>2000 OR length(coalesce(_tracking,''))>200 THEN RAISE EXCEPTION 'invalid_transition'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(own::text,619));
PERFORM 1 FROM public.rewards WHERE id=rw FOR UPDATE;
SELECT * INTO q FROM public.reward_redemptions WHERE id=_id FOR UPDATE;
IF EXISTS(SELECT 1 FROM public.reward_status_history WHERE redemption_id=_id AND status=_status) THEN
IF (SELECT note FROM public.reward_status_history WHERE redemption_id=_id AND status=_status) IS DISTINCT FROM coalesce(_note,'') THEN RAISE EXCEPTION 'idempotency_conflict'; END IF;
IF _status IN ('shipped','delivered') AND ((SELECT tracking FROM public.reward_delivery WHERE redemption_id=_id) IS DISTINCT FROM nullif(_tracking,'') OR (SELECT instructions FROM public.reward_delivery WHERE redemption_id=_id) IS DISTINCT FROM nullif(_instructions,'')) THEN RAISE EXCEPTION 'idempotency_conflict'; END IF;
RETURN q.id; END IF;
IF NOT ((q.status='pending' AND _status IN ('approved','rejected','canceled')) OR (q.status='approved' AND (_status='delivered' OR (_status='shipped' AND q.snapshot->>'category'='physical'))) OR (q.status='shipped' AND _status='delivered')) THEN RAISE EXCEPTION 'invalid_transition'; END IF;
IF _status='rejected' AND length(btrim(coalesce(_note,'')))<3 THEN RAISE EXCEPTION 'reason_required'; END IF;
IF _status='approved' AND (q.snapshot->>'uses_codes')::boolean AND NOT EXISTS(SELECT 1 FROM public.reward_codes WHERE redemption_id=_id AND (expires_at IS NULL OR expires_at>clock_timestamp())) THEN RAISE EXCEPTION 'code_expired'; END IF;
IF _status='delivered' AND length(btrim(coalesce(_instructions,'')))<3 THEN RAISE EXCEPTION 'delivery_required'; END IF;
IF _status='approved' THEN INSERT INTO public.reward_wallet_entries(user_id,redemption_id,kind,points) VALUES(own,_id,'spend',q.points_cost);
ELSIF _status IN ('rejected','canceled') THEN
INSERT INTO public.reward_wallet_entries(user_id,redemption_id,kind,points) VALUES(own,_id,'release',q.points_cost);
UPDATE public.rewards SET committed=committed-1 WHERE id=rw;
UPDATE public.reward_codes SET redemption_id=NULL WHERE redemption_id=_id;
END IF;
UPDATE public.reward_redemptions SET status=_status,updated_at=clock_timestamp() WHERE id=_id;
IF _status IN ('shipped','delivered') THEN UPDATE public.reward_delivery SET tracking=nullif(_tracking,''),instructions=nullif(_instructions,''),updated_at=clock_timestamp() WHERE redemption_id=_id; END IF;
INSERT INTO public.reward_status_history(redemption_id,user_id,actor_id,status,note) VALUES(_id,own,u,_status,coalesce(_note,''));
INSERT INTO public.reward_audit(actor_id,entity_id,action,changes) VALUES(u,_id,'status',jsonb_build_object('from',q.status,'to',_status));
RETURN _id;
END $$;
REVOKE ALL ON FUNCTION public.process_reward(uuid,text,text,text,text) FROM PUBLIC,anon,service_role; GRANT EXECUTE ON FUNCTION public.process_reward(uuid,text,text,text,text) TO authenticated;
CREATE FUNCTION public.save_reward_partner(_data jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE rid uuid; before_row jsonb;
BEGIN
IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'reward_forbidden' USING ERRCODE='42501'; END IF;
rid:=coalesce((_data->>'id')::uuid,gen_random_uuid());
SELECT to_jsonb(p) INTO before_row FROM public.reward_partners p WHERE id=rid FOR UPDATE;
INSERT INTO public.reward_partners(id,name,instructions,active) VALUES(rid,_data->>'name',coalesce(_data->>'instructions',''),coalesce((_data->>'active')::boolean,false)) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,instructions=EXCLUDED.instructions,active=EXCLUDED.active;
INSERT INTO public.reward_audit(actor_id,entity_id,action,changes) SELECT auth.uid(),rid,'partner_saved',jsonb_build_object('before',before_row,'after',to_jsonb(p)) FROM public.reward_partners p WHERE id=rid;
RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.save_reward_partner(jsonb) FROM PUBLIC,anon,service_role; GRANT EXECUTE ON FUNCTION public.save_reward_partner(jsonb) TO authenticated;
CREATE FUNCTION public.save_reward(_data jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE rid uuid; before_row jsonb; old public.rewards%ROWTYPE;
BEGIN
IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'reward_forbidden' USING ERRCODE='42501'; END IF;
rid:=coalesce((_data->>'id')::uuid,gen_random_uuid());
SELECT * INTO old FROM public.rewards WHERE id=rid FOR UPDATE;
before_row:=CASE WHEN old.id IS NULL THEN NULL ELSE to_jsonb(old) END;
IF old.id IS NOT NULL AND old.committed>0 AND (old.category IS DISTINCT FROM _data->>'category' OR old.uses_codes IS DISTINCT FROM coalesce((_data->>'uses_codes')::boolean,false) OR old.partner_id IS DISTINCT FROM (_data->>'partner_id')::uuid) THEN RAISE EXCEPTION 'reward_structure_locked'; END IF;
IF length(btrim(coalesce(_data->>'conditions','')))<3 OR length(btrim(coalesce(_data->>'delivery_method','')))<3 THEN RAISE EXCEPTION 'reward_details_required'; END IF;
INSERT INTO public.rewards(id,partner_id,name,description,image_url,category,points_cost,stock,conditions,delivery_method,delivery_days,active,expires_at,uses_codes) VALUES(rid,(_data->>'partner_id')::uuid,_data->>'name',coalesce(_data->>'description',''),nullif(_data->>'image_url',''),_data->>'category',(_data->>'points_cost')::integer,(_data->>'stock')::integer,_data->>'conditions',_data->>'delivery_method',(_data->>'delivery_days')::integer,coalesce((_data->>'active')::boolean,false),(_data->>'expires_at')::timestamptz,coalesce((_data->>'uses_codes')::boolean,false)) ON CONFLICT(id) DO UPDATE SET partner_id=EXCLUDED.partner_id,name=EXCLUDED.name,description=EXCLUDED.description,image_url=EXCLUDED.image_url,category=EXCLUDED.category,points_cost=EXCLUDED.points_cost,stock=EXCLUDED.stock,conditions=EXCLUDED.conditions,delivery_method=EXCLUDED.delivery_method,delivery_days=EXCLUDED.delivery_days,active=EXCLUDED.active,expires_at=EXCLUDED.expires_at,uses_codes=EXCLUDED.uses_codes;
INSERT INTO public.reward_audit(actor_id,entity_id,action,changes) SELECT auth.uid(),rid,'reward_saved',jsonb_build_object('before',before_row,'after',to_jsonb(r)) FROM public.rewards r WHERE id=rid;
RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.save_reward(jsonb) FROM PUBLIC,anon,service_role; GRANT EXECUTE ON FUNCTION public.save_reward(jsonb) TO authenticated;
CREATE FUNCTION public.add_reward_codes(_reward_id uuid,_codes text[],_expires_at timestamptz DEFAULT NULL) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE n integer;
BEGIN
IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'reward_forbidden' USING ERRCODE='42501'; END IF;
PERFORM 1 FROM public.rewards WHERE id=_reward_id AND uses_codes FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'reward_unavailable'; END IF;
IF cardinality(_codes) IS NULL OR cardinality(_codes) NOT BETWEEN 1 AND 100 OR (_expires_at IS NOT NULL AND _expires_at<=clock_timestamp()) THEN RAISE EXCEPTION 'invalid_codes'; END IF;
INSERT INTO public.reward_codes(reward_id,code,expires_at) SELECT _reward_id,btrim(c),_expires_at FROM unnest(_codes) c ON CONFLICT(reward_id,code) DO NOTHING; GET DIAGNOSTICS n=ROW_COUNT;
INSERT INTO public.reward_audit(actor_id,entity_id,action,changes) VALUES(auth.uid(),_reward_id,'codes_added',jsonb_build_object('count',n)); RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.add_reward_codes(uuid,text[],timestamptz) FROM PUBLIC,anon,service_role; GRANT EXECUTE ON FUNCTION public.add_reward_codes(uuid,text[],timestamptz) TO authenticated;
COMMENT ON TABLE public.rewards_settings IS 'Absent row means closed. Real redemptions require separately authorized release; no user/admin browser write path.';
COMMENT ON TABLE public.reward_wallet_entries IS 'Append-only reservation/spend/release movements; earned points remain exclusively in points_events; never cascade on profile deletion.';