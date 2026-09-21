ALTER TABLE public.subscriptions
  ADD COLUMN provider text NOT NULL DEFAULT 'cakto',
  ADD COLUMN cakto_product_id text,
  ADD COLUMN cakto_offer_id text,
  ADD COLUMN cakto_subscription_id text,
  ADD COLUMN cakto_transaction_id text;

COMMENT ON COLUMN public.subscriptions.kiwify_product_id IS 'DEPRECATED: replaced by cakto_product_id';
COMMENT ON COLUMN public.subscriptions.kiwify_subscription_id IS 'DEPRECATED: replaced by cakto_subscription_id';
COMMENT ON COLUMN public.subscriptions.kiwify_transaction_id IS 'DEPRECATED: replaced by cakto_transaction_id';

CREATE UNIQUE INDEX subscriptions_cakto_subscription_id_unique
ON public.subscriptions (cakto_subscription_id)
WHERE cakto_subscription_id IS NOT NULL;

CREATE INDEX subscriptions_cakto_product_idx ON public.subscriptions (cakto_product_id);
CREATE INDEX subscriptions_cakto_offer_idx ON public.subscriptions (cakto_offer_id);
CREATE INDEX subscriptions_cakto_transaction_idx ON public.subscriptions (cakto_transaction_id);

CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

REVOKE ALL ON FUNCTION public.has_active_subscription(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO service_role;

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
  _inserted_event uuid;
BEGIN
  INSERT INTO public.webhook_events (event_id, event_type, transaction_id, payload)
  VALUES (_event_id, _event_type, _transaction_id, _payload)
  ON CONFLICT (event_id) DO NOTHING
  RETURNING id INTO _inserted_event;

  IF _inserted_event IS NULL THEN
    RETURN jsonb_build_object('result', 'duplicate');
  END IF;

  SELECT id INTO _user_id
  FROM public.profiles
  WHERE lower(trim(email)) = lower(trim(_buyer_email))
  ORDER BY created_at ASC
  LIMIT 1;

  IF _user_id IS NULL THEN
    UPDATE public.webhook_events
    SET error_message = 'buyer_not_found'
    WHERE id = _inserted_event;
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

  IF _new_status IS NULL THEN
    UPDATE public.webhook_events
    SET error_message = 'unsupported_event'
    WHERE id = _inserted_event;
    RETURN jsonb_build_object('result', 'unsupported_event');
  END IF;

  INSERT INTO public.subscriptions (
    user_id, email, plan, status, provider, cakto_product_id,
    cakto_offer_id, cakto_subscription_id, cakto_transaction_id,
    started_at, expires_at, canceled_at, updated_at
  ) VALUES (
    _user_id, lower(trim(_buyer_email)), _plan, _new_status, 'cakto', _product_id,
    _offer_id, _subscription_id, _transaction_id, _started_at, _expires_at,
    CASE WHEN _event_type = 'subscription_canceled' THEN COALESCE(_canceled_at, now()) ELSE NULL END,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    plan = EXCLUDED.plan,
    status = EXCLUDED.status,
    provider = 'cakto',
    cakto_product_id = COALESCE(EXCLUDED.cakto_product_id, subscriptions.cakto_product_id),
    cakto_offer_id = COALESCE(EXCLUDED.cakto_offer_id, subscriptions.cakto_offer_id),
    cakto_subscription_id = COALESCE(EXCLUDED.cakto_subscription_id, subscriptions.cakto_subscription_id),
    cakto_transaction_id = COALESCE(EXCLUDED.cakto_transaction_id, subscriptions.cakto_transaction_id),
    started_at = COALESCE(EXCLUDED.started_at, subscriptions.started_at),
    expires_at = COALESCE(EXCLUDED.expires_at, subscriptions.expires_at),
    canceled_at = CASE
      WHEN _event_type = 'subscription_canceled' THEN COALESCE(_canceled_at, now())
      WHEN _new_status = 'active' THEN NULL
      ELSE subscriptions.canceled_at
    END,
    updated_at = now();

  UPDATE public.webhook_events
  SET processed = true, processed_at = now(), error_message = NULL
  WHERE id = _inserted_event;

  RETURN jsonb_build_object('result', 'processed', 'user_id', _user_id);
EXCEPTION WHEN OTHERS THEN
  UPDATE public.webhook_events
  SET error_message = left(SQLERRM, 500)
  WHERE id = _inserted_event;
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.process_cakto_subscription_event(text, text, text, text, public.subscription_plan, text, text, text, timestamptz, timestamptz, timestamptz, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_cakto_subscription_event(text, text, text, text, public.subscription_plan, text, text, text, timestamptz, timestamptz, timestamptz, jsonb) TO service_role;

COMMENT ON FUNCTION public.process_kiwify_subscription_event(text, text, text, text, public.subscription_plan, text, text, timestamptz, timestamptz, jsonb) IS 'DEPRECATED: Kiwify integration replaced by process_cakto_subscription_event';