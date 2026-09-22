CREATE OR REPLACE FUNCTION public.process_cakto_subscription_event(
  _event_id text,
  _event_type text,
  _transaction_id text,
  _buyer_email text,
  _plan public.subscription_plan,
  _product_id text,
  _offer_id text,
  _subscription_id text,
  _started_at timestamptz,
  _expires_at timestamptz,
  _canceled_at timestamptz,
  _payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _new_status public.subscription_status;
  _provider_status text;
  _claimed_event uuid;
  _effective_started_at timestamptz;
  _effective_expires_at timestamptz;
BEGIN
  INSERT INTO public.webhook_events (event_id, event_type, transaction_id, payload)
  VALUES (_event_id, _event_type, _transaction_id, _payload)
  ON CONFLICT (event_id) DO UPDATE SET
    event_type = EXCLUDED.event_type,
    transaction_id = EXCLUDED.transaction_id,
    payload = EXCLUDED.payload,
    error_message = NULL
  WHERE webhook_events.processed = false
    AND webhook_events.error_message IN ('unknown_offer', 'unknown_product', 'buyer_not_found')
  RETURNING id INTO _claimed_event;

  IF _claimed_event IS NULL THEN
    RETURN jsonb_build_object('result', 'duplicate');
  END IF;

  SELECT id INTO _user_id
  FROM public.profiles
  WHERE lower(trim(email)) = lower(trim(_buyer_email));

  IF _user_id IS NULL THEN
    UPDATE public.webhook_events
    SET error_message = 'buyer_not_found'
    WHERE id = _claimed_event;
    RETURN jsonb_build_object('result', 'buyer_not_found');
  END IF;

  _new_status := CASE _event_type
    WHEN 'purchase_approved' THEN 'active'::public.subscription_status
    WHEN 'subscription_created' THEN 'active'::public.subscription_status
    WHEN 'subscription_renewed' THEN 'active'::public.subscription_status
    WHEN 'subscription_resumed' THEN 'active'::public.subscription_status
    WHEN 'subscription_late_recovered' THEN 'active'::public.subscription_status
    WHEN 'subscription_canceled' THEN 'canceled'::public.subscription_status
    WHEN 'refund' THEN 'refunded'::public.subscription_status
    WHEN 'chargeback' THEN 'chargeback'::public.subscription_status
    WHEN 'subscription_late' THEN 'pending'::public.subscription_status
    WHEN 'subscription_renewal_refused' THEN 'pending'::public.subscription_status
    WHEN 'subscription_paused' THEN 'pending'::public.subscription_status
    ELSE NULL
  END;

  _provider_status := CASE _event_type
    WHEN 'subscription_late' THEN 'late'
    WHEN 'subscription_renewal_refused' THEN 'late'
    WHEN 'subscription_paused' THEN 'paused'
    WHEN 'subscription_canceled' THEN 'canceled'
    WHEN 'refund' THEN 'refunded'
    WHEN 'chargeback' THEN 'chargeback'
    WHEN 'purchase_approved' THEN 'active'
    WHEN 'subscription_created' THEN 'active'
    WHEN 'subscription_renewed' THEN 'active'
    WHEN 'subscription_resumed' THEN 'active'
    WHEN 'subscription_late_recovered' THEN 'active'
    ELSE NULL
  END;

  IF _new_status IS NULL THEN
    UPDATE public.webhook_events
    SET error_message = 'unsupported_event'
    WHERE id = _claimed_event;
    RETURN jsonb_build_object('result', 'unsupported_event');
  END IF;

  _effective_started_at := COALESCE(_started_at, now());
  _effective_expires_at := _expires_at;

  IF _new_status = 'active' AND _effective_expires_at IS NULL THEN
    _effective_expires_at := CASE _plan
      WHEN 'monthly'::public.subscription_plan THEN _effective_started_at + interval '1 month'
      WHEN 'quarterly'::public.subscription_plan THEN _effective_started_at + interval '3 months'
      WHEN 'annual'::public.subscription_plan THEN _effective_started_at + interval '1 year'
    END;
  END IF;

  INSERT INTO public.subscriptions (
    user_id, email, plan, status, provider_status, provider, cakto_product_id,
    cakto_offer_id, cakto_subscription_id, cakto_transaction_id,
    started_at, expires_at, canceled_at, updated_at
  ) VALUES (
    _user_id, lower(trim(_buyer_email)), _plan, _new_status, _provider_status, 'cakto', _product_id,
    _offer_id, _subscription_id, _transaction_id, _effective_started_at, _effective_expires_at,
    CASE WHEN _event_type = 'subscription_canceled' THEN COALESCE(_canceled_at, now()) ELSE NULL END,
    now()
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
    started_at = CASE
      WHEN _new_status = 'active' THEN EXCLUDED.started_at
      ELSE COALESCE(subscriptions.started_at, EXCLUDED.started_at)
    END,
    expires_at = CASE
      WHEN _new_status = 'active' THEN EXCLUDED.expires_at
      ELSE COALESCE(EXCLUDED.expires_at, subscriptions.expires_at)
    END,
    canceled_at = CASE
      WHEN _event_type = 'subscription_canceled' THEN COALESCE(_canceled_at, now())
      WHEN _new_status = 'active' THEN NULL
      ELSE subscriptions.canceled_at
    END,
    updated_at = now();

  UPDATE public.webhook_events
  SET processed = true, processed_at = now(), error_message = NULL
  WHERE id = _claimed_event;

  RETURN jsonb_build_object('result', 'processed', 'user_id', _user_id);
EXCEPTION WHEN OTHERS THEN
  UPDATE public.webhook_events
  SET error_message = left(SQLERRM, 500)
  WHERE id = _claimed_event;
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.process_cakto_subscription_event(text, text, text, text, public.subscription_plan, text, text, text, timestamptz, timestamptz, timestamptz, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_cakto_subscription_event(text, text, text, text, public.subscription_plan, text, text, text, timestamptz, timestamptz, timestamptz, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.process_cakto_subscription_event(text, text, text, text, public.subscription_plan, text, text, text, timestamptz, timestamptz, timestamptz, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_cakto_subscription_event(text, text, text, text, public.subscription_plan, text, text, text, timestamptz, timestamptz, timestamptz, jsonb) TO service_role;