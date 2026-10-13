ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS buyer_email_hash text,
  ADD COLUMN IF NOT EXISTS plan public.subscription_plan,
  ADD COLUMN IF NOT EXISTS event_at timestamptz,
  ADD COLUMN IF NOT EXISTS apply_args jsonb;

COMMENT ON COLUMN public.webhook_events.buyer_email_hash IS 'SHA-256 of the normalized buyer e-mail; lets a later confirmed account claim a pending purchase without storing the e-mail.';
COMMENT ON COLUMN public.webhook_events.event_at IS 'Business time of the Cakto event used to reject stale events.';

CREATE INDEX IF NOT EXISTS webhook_events_pending_buyer_idx
  ON public.webhook_events (buyer_email_hash)
  WHERE processed = false AND error_message = 'buyer_not_found';

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS last_event_at timestamptz;
COMMENT ON COLUMN public.subscriptions.last_event_at IS 'Newest applied Cakto event time; older events are ignored.';

CREATE OR REPLACE FUNCTION public.cakto_email_hash(_email text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $$ SELECT encode(sha256(convert_to(lower(trim(_email)), 'UTF8')), 'hex') $$;

CREATE OR REPLACE FUNCTION public.apply_cakto_event(_claimed_event uuid, _user_id uuid, _email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _w public.webhook_events%ROWTYPE;
  _a jsonb;
  _existing public.subscriptions%ROWTYPE;
  _new_status public.subscription_status;
  _provider_status text;
  _is_trial boolean;
  _started timestamptz;
  _expires timestamptz;
  _trial_ends timestamptz;
  _canceled timestamptz;
BEGIN
  SELECT * INTO _w FROM public.webhook_events WHERE id = _claimed_event FOR UPDATE;
  IF _w.id IS NULL OR _w.processed OR _w.apply_args IS NULL OR _w.plan IS NULL THEN
    RETURN jsonb_build_object('result', 'not_applicable');
  END IF;
  _a := _w.apply_args;
  _started := COALESCE((_a->>'started_at')::timestamptz, now());
  _expires := (_a->>'expires_at')::timestamptz;
  _trial_ends := (_a->>'trial_ends_at')::timestamptz;
  _canceled := (_a->>'canceled_at')::timestamptz;

  SELECT * INTO _existing FROM public.subscriptions WHERE user_id = _user_id FOR UPDATE;

  _is_trial := _w.event_type IN ('purchase_approved', 'subscription_created')
    AND _a->>'subscription_status' = 'trial';

  IF _is_trial THEN
    _new_status := 'trial'; _provider_status := 'trial';
  ELSE
    _new_status := CASE _w.event_type
      WHEN 'purchase_approved' THEN 'active' WHEN 'subscription_created' THEN 'active'
      WHEN 'subscription_renewed' THEN 'active' WHEN 'subscription_resumed' THEN 'active'
      WHEN 'subscription_late_recovered' THEN 'active'
      WHEN 'subscription_canceled' THEN 'canceled' WHEN 'refund' THEN 'refunded'
      WHEN 'chargeback' THEN 'chargeback'
      WHEN 'subscription_late' THEN 'pending' WHEN 'subscription_renewal_refused' THEN 'pending'
      WHEN 'subscription_paused' THEN 'pending'
      ELSE NULL END::public.subscription_status;
    _provider_status := CASE _w.event_type
      WHEN 'subscription_late' THEN 'late' WHEN 'subscription_renewal_refused' THEN 'late'
      WHEN 'subscription_paused' THEN 'paused' WHEN 'subscription_canceled' THEN 'canceled'
      WHEN 'refund' THEN 'refunded' WHEN 'chargeback' THEN 'chargeback'
      WHEN 'purchase_approved' THEN 'active' WHEN 'subscription_created' THEN 'active'
      WHEN 'subscription_renewed' THEN 'active' WHEN 'subscription_resumed' THEN 'active'
      WHEN 'subscription_late_recovered' THEN 'active' ELSE NULL END;
  END IF;

  IF _new_status IS NULL THEN
    UPDATE public.webhook_events SET error_message = 'unsupported_event' WHERE id = _w.id;
    RETURN jsonb_build_object('result', 'unsupported_event');
  END IF;

  IF _existing.id IS NOT NULL AND _existing.last_event_at IS NOT NULL
     AND _w.event_at IS NOT NULL AND _w.event_at < _existing.last_event_at THEN
    UPDATE public.webhook_events SET processed = true, processed_at = now(), error_message = 'stale_event_ignored' WHERE id = _w.id;
    RETURN jsonb_build_object('result', 'stale_event_ignored', 'user_id', _user_id);
  END IF;

  IF _existing.id IS NOT NULL AND _existing.status IN ('refunded', 'chargeback')
     AND _new_status IN ('active', 'trial', 'pending')
     AND _w.transaction_id IS NOT DISTINCT FROM _existing.cakto_transaction_id THEN
    UPDATE public.webhook_events SET processed = true, processed_at = now(), error_message = 'reversed_transaction_ignored' WHERE id = _w.id;
    RETURN jsonb_build_object('result', 'reversed_transaction_ignored', 'user_id', _user_id);
  END IF;

  IF _is_trial AND _existing.id IS NOT NULL AND _existing.status = 'active' AND _existing.expires_at > now() THEN
    UPDATE public.webhook_events SET processed = true, processed_at = now(), error_message = 'trial_ignored_active_subscription' WHERE id = _w.id;
    RETURN jsonb_build_object('result', 'trial_ignored_active_subscription', 'user_id', _user_id);
  END IF;

  IF _is_trial THEN _expires := _trial_ends; END IF;
  IF _new_status = 'active' AND _expires IS NULL THEN
    _expires := CASE _w.plan
      WHEN 'monthly' THEN _started + interval '1 month'
      WHEN 'quarterly' THEN _started + interval '3 months'
      WHEN 'annual' THEN _started + interval '1 year' END;
  END IF;

  INSERT INTO public.subscriptions (
    user_id, email, plan, status, provider_status, provider, cakto_product_id,
    cakto_offer_id, cakto_subscription_id, cakto_transaction_id,
    started_at, expires_at, canceled_at, trial_started_at, trial_ends_at, recurring_amount,
    last_event_at, updated_at
  ) VALUES (
    _user_id, lower(trim(_email)), _w.plan, _new_status, _provider_status, 'cakto', _a->>'product_id',
    _a->>'offer_id', _a->>'subscription_id', _w.transaction_id, _started, _expires,
    CASE WHEN _w.event_type = 'subscription_canceled' THEN COALESCE(_canceled, now()) END,
    CASE WHEN _is_trial THEN _started END,
    CASE WHEN _is_trial THEN _trial_ends END,
    (_a->>'amount')::numeric,
    _w.event_at, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    plan = EXCLUDED.plan,
    status = EXCLUDED.status,
    provider_status = EXCLUDED.provider_status,
    provider = 'cakto',
    cakto_product_id = COALESCE(EXCLUDED.cakto_product_id, subscriptions.cakto_product_id),
    cakto_offer_id = COALESCE(EXCLUDED.cakto_offer_id, subscriptions.cakto_offer_id),
    cakto_subscription_id = COALESCE(EXCLUDED.cakto_subscription_id, subscriptions.cakto_subscription_id),
    cakto_transaction_id = COALESCE(EXCLUDED.cakto_transaction_id, subscriptions.cakto_transaction_id),
    started_at = CASE WHEN _new_status IN ('active', 'trial') THEN EXCLUDED.started_at
      ELSE COALESCE(subscriptions.started_at, EXCLUDED.started_at) END,
    expires_at = CASE WHEN _new_status IN ('active', 'trial') THEN EXCLUDED.expires_at
      ELSE COALESCE(EXCLUDED.expires_at, subscriptions.expires_at) END,
    canceled_at = CASE
      WHEN _w.event_type = 'subscription_canceled' THEN COALESCE(_canceled, now())
      WHEN _new_status IN ('active', 'trial') THEN NULL
      ELSE subscriptions.canceled_at END,
    trial_started_at = CASE WHEN _is_trial THEN EXCLUDED.trial_started_at ELSE subscriptions.trial_started_at END,
    trial_ends_at = CASE WHEN _is_trial THEN EXCLUDED.trial_ends_at ELSE subscriptions.trial_ends_at END,
    recurring_amount = COALESCE(EXCLUDED.recurring_amount, subscriptions.recurring_amount),
    last_event_at = GREATEST(subscriptions.last_event_at, EXCLUDED.last_event_at),
    updated_at = now();

  UPDATE public.webhook_events SET processed = true, processed_at = now(), error_message = NULL WHERE id = _w.id;
  RETURN jsonb_build_object('result', 'processed', 'user_id', _user_id, 'trial', _is_trial);
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_cakto_subscription_event_v3(
  _event_id text, _event_type text, _transaction_id text, _buyer_email text,
  _plan public.subscription_plan, _product_id text, _offer_id text, _subscription_id text,
  _started_at timestamptz, _expires_at timestamptz, _canceled_at timestamptz, _payload jsonb,
  _subscription_status text, _trial_ends_at timestamptz, _amount numeric, _event_at timestamptz
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _claimed uuid;
  _user_id uuid;
  _args jsonb;
BEGIN
  _args := jsonb_build_object(
    'product_id', _product_id, 'offer_id', _offer_id, 'subscription_id', _subscription_id,
    'started_at', _started_at, 'expires_at', _expires_at, 'canceled_at', _canceled_at,
    'subscription_status', _subscription_status, 'trial_ends_at', _trial_ends_at, 'amount', _amount);

  INSERT INTO public.webhook_events (event_id, event_type, transaction_id, payload, buyer_email_hash, plan, event_at, apply_args)
  VALUES (_event_id, _event_type, _transaction_id, _payload, public.cakto_email_hash(_buyer_email), _plan, _event_at, _args)
  ON CONFLICT (event_id) DO UPDATE SET
    event_type = EXCLUDED.event_type, transaction_id = EXCLUDED.transaction_id,
    payload = EXCLUDED.payload, buyer_email_hash = EXCLUDED.buyer_email_hash,
    plan = EXCLUDED.plan, event_at = EXCLUDED.event_at, apply_args = EXCLUDED.apply_args,
    error_message = NULL
  WHERE webhook_events.processed = false
    AND webhook_events.error_message IN ('unknown_offer', 'unknown_product', 'buyer_not_found')
  RETURNING id INTO _claimed;

  IF _claimed IS NULL THEN
    RETURN jsonb_build_object('result', 'duplicate');
  END IF;

  SELECT id INTO _user_id FROM public.profiles
  WHERE lower(trim(email)) = lower(trim(_buyer_email));

  IF _user_id IS NULL THEN
    UPDATE public.webhook_events SET error_message = 'buyer_not_found' WHERE id = _claimed;
    RETURN jsonb_build_object('result', 'buyer_not_found');
  END IF;

  RETURN public.apply_cakto_event(_claimed, _user_id, _buyer_email);
END;
$function$;

CREATE OR REPLACE FUNCTION public.link_pending_cakto_purchases(_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _email text;
  _confirmed timestamptz;
  _row record;
  _linked int := 0;
BEGIN
  SELECT u.email, u.email_confirmed_at INTO _email, _confirmed FROM auth.users u WHERE u.id = _user_id;
  IF _email IS NULL OR _confirmed IS NULL THEN
    RETURN jsonb_build_object('result', 'email_not_confirmed', 'linked', 0);
  END IF;
  FOR _row IN
    SELECT id FROM public.webhook_events
    WHERE processed = false AND error_message = 'buyer_not_found'
      AND buyer_email_hash = public.cakto_email_hash(_email)
      AND apply_args IS NOT NULL
    ORDER BY event_at NULLS FIRST, created_at
    FOR UPDATE SKIP LOCKED
  LOOP
    PERFORM public.apply_cakto_event(_row.id, _user_id, _email);
    _linked := _linked + 1;
  END LOOP;
  RETURN jsonb_build_object('result', 'ok', 'linked', _linked);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_reprocess_cakto_event(_event_row_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _w public.webhook_events%ROWTYPE;
  _user_id uuid;
  _email text;
  _matches int;
BEGIN
  SELECT * INTO _w FROM public.webhook_events WHERE id = _event_row_id FOR UPDATE;
  IF _w.id IS NULL THEN RETURN jsonb_build_object('result', 'not_found'); END IF;
  IF _w.processed THEN RETURN jsonb_build_object('result', 'already_processed'); END IF;
  IF _w.error_message IS DISTINCT FROM 'buyer_not_found' THEN
    RETURN jsonb_build_object('result', 'not_reprocessable');
  END IF;
  IF _w.buyer_email_hash IS NULL OR _w.apply_args IS NULL THEN
    RETURN jsonb_build_object('result', 'missing_link_data');
  END IF;
  SELECT count(*) INTO _matches FROM public.profiles p JOIN auth.users u ON u.id = p.id
  WHERE public.cakto_email_hash(p.email) = _w.buyer_email_hash AND u.email_confirmed_at IS NOT NULL;
  IF _matches = 0 THEN RETURN jsonb_build_object('result', 'buyer_not_found'); END IF;
  IF _matches > 1 THEN RETURN jsonb_build_object('result', 'ambiguous_buyer'); END IF;
  SELECT p.id, p.email INTO _user_id, _email FROM public.profiles p JOIN auth.users u ON u.id = p.id
  WHERE public.cakto_email_hash(p.email) = _w.buyer_email_hash AND u.email_confirmed_at IS NOT NULL;
  RETURN public.apply_cakto_event(_w.id, _user_id, _email);
END;
$function$;

CREATE OR REPLACE FUNCTION public.link_pending_cakto_on_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    PERFORM public.link_pending_cakto_purchases(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'link_pending_cakto_failed';
  END;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS link_pending_cakto_on_profile ON public.profiles;
CREATE TRIGGER link_pending_cakto_on_profile AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.link_pending_cakto_on_profile();

DROP TRIGGER IF EXISTS link_pending_cakto_on_email_confirmed ON auth.users;
CREATE TRIGGER link_pending_cakto_on_email_confirmed AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.link_pending_cakto_on_profile();

REVOKE ALL ON FUNCTION public.apply_cakto_event(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_cakto_subscription_event_v3(text, text, text, text, public.subscription_plan, text, text, text, timestamptz, timestamptz, timestamptz, jsonb, text, timestamptz, numeric, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.link_pending_cakto_purchases(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_reprocess_cakto_event(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.link_pending_cakto_on_profile() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_cakto_event(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_cakto_subscription_event_v3(text, text, text, text, public.subscription_plan, text, text, text, timestamptz, timestamptz, timestamptz, jsonb, text, timestamptz, numeric, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.link_pending_cakto_purchases(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_reprocess_cakto_event(uuid) TO service_role;