CREATE TABLE public.reward_delivery_operations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), redemption_id uuid NOT NULL REFERENCES public.reward_redemptions(id), user_id uuid NOT NULL, status text NOT NULL CHECK(status IN ('shipped','delivered')), tracking_input text, instructions_input text, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), UNIQUE(redemption_id,status));
GRANT SELECT ON public.reward_delivery_operations TO authenticated; GRANT ALL ON public.reward_delivery_operations TO service_role;
ALTER TABLE public.reward_delivery_operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY reward_delivery_operations_read ON public.reward_delivery_operations FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER reward_delivery_operations_immutable BEFORE UPDATE OR DELETE ON public.reward_delivery_operations FOR EACH ROW EXECUTE FUNCTION public.reward_immutable_history();
CREATE OR REPLACE FUNCTION public.process_reward(_id uuid,_status text,_note text DEFAULT '',_tracking text DEFAULT '',_instructions text DEFAULT '') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
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
IF _status IN ('shipped','delivered') AND NOT EXISTS(SELECT 1 FROM public.reward_delivery_operations WHERE redemption_id=_id AND status=_status AND tracking_input IS NOT DISTINCT FROM nullif(_tracking,'') AND instructions_input IS NOT DISTINCT FROM nullif(_instructions,'')) THEN RAISE EXCEPTION 'idempotency_conflict'; END IF;
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
IF _status IN ('shipped','delivered') THEN
INSERT INTO public.reward_delivery_operations(redemption_id,user_id,status,tracking_input,instructions_input) VALUES(_id,own,_status,nullif(_tracking,''),nullif(_instructions,''));
UPDATE public.reward_delivery SET tracking=coalesce(nullif(_tracking,''),tracking),instructions=coalesce(nullif(_instructions,''),instructions),updated_at=clock_timestamp() WHERE redemption_id=_id;
END IF;
INSERT INTO public.reward_status_history(redemption_id,user_id,actor_id,status,note) VALUES(_id,own,u,_status,coalesce(_note,''));
INSERT INTO public.reward_audit(actor_id,entity_id,action,changes) VALUES(u,_id,'status',jsonb_build_object('from',q.status,'to',_status));
RETURN _id;
END $$;
REVOKE ALL ON FUNCTION public.process_reward(uuid,text,text,text,text) FROM PUBLIC,anon,service_role; GRANT EXECUTE ON FUNCTION public.process_reward(uuid,text,text,text,text) TO authenticated;
COMMENT ON TABLE public.reward_delivery_operations IS 'Private immutable transition inputs support replay after later delivery updates. Empty input preserves existing delivery values; never copies into administrative audit.';