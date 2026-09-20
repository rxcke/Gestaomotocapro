CREATE TYPE public.subscription_plan AS ENUM ('monthly', 'annual');
CREATE TYPE public.subscription_status AS ENUM ('pending', 'active', 'canceled', 'expired', 'refunded', 'chargeback');

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  plan public.subscription_plan NOT NULL,
  status public.subscription_status NOT NULL DEFAULT 'pending',
  kiwify_product_id text,
  kiwify_subscription_id text,
  kiwify_transaction_id text,
  started_at timestamptz,
  expires_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_email_normalized CHECK (email = lower(trim(email)))
);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE UNIQUE INDEX subscriptions_kiwify_subscription_id_unique
ON public.subscriptions (kiwify_subscription_id)
WHERE kiwify_subscription_id IS NOT NULL;
CREATE INDEX subscriptions_status_expires_idx ON public.subscriptions (status, expires_at);
CREATE INDEX subscriptions_email_idx ON public.subscriptions (email);

CREATE TABLE public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  transaction_id text,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT webhook_events_event_id_not_blank CHECK (length(trim(event_id)) > 0),
  CONSTRAINT webhook_events_type_not_blank CHECK (length(trim(event_type)) > 0)
);

GRANT ALL ON public.webhook_events TO service_role;

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX webhook_events_created_idx ON public.webhook_events (created_at DESC);
CREATE INDEX webhook_events_processed_idx ON public.webhook_events (processed, created_at DESC);
CREATE INDEX webhook_events_transaction_idx ON public.webhook_events (transaction_id)
WHERE transaction_id IS NOT NULL;

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
      AND (
        (status = 'active' AND (expires_at IS NULL OR expires_at > now()))
        OR
        (status = 'canceled' AND expires_at IS NOT NULL AND expires_at > now())
      )
  )
$$;

REVOKE ALL ON FUNCTION public.has_active_subscription(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.process_kiwify_subscription_event(
  _event_id text,
  _event_type text,
  _transaction_id text,
  _buyer_email text,
  _plan public.subscription_plan,
  _product_id text,
  _subscription_id text,
  _started_at timestamptz,
  _expires_at timestamptz,
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
    WHEN 'compra_aprovada' THEN 'active'::public.subscription_status
    WHEN 'subscription_renewed' THEN 'active'::public.subscription_status
    WHEN 'subscription_canceled' THEN 'canceled'::public.subscription_status
    WHEN 'compra_reembolsada' THEN 'refunded'::public.subscription_status
    WHEN 'chargeback' THEN 'chargeback'::public.subscription_status
    WHEN 'subscription_late' THEN CASE
      WHEN _expires_at IS NOT NULL AND _expires_at <= now() THEN 'expired'::public.subscription_status
      ELSE 'pending'::public.subscription_status
    END
    ELSE NULL
  END;

  IF _new_status IS NULL THEN
    UPDATE public.webhook_events
    SET error_message = 'unsupported_event'
    WHERE id = _inserted_event;
    RETURN jsonb_build_object('result', 'unsupported_event');
  END IF;

  INSERT INTO public.subscriptions (
    user_id, email, plan, status, kiwify_product_id,
    kiwify_subscription_id, kiwify_transaction_id, started_at,
    expires_at, canceled_at, updated_at
  ) VALUES (
    _user_id, lower(trim(_buyer_email)), _plan, _new_status, _product_id,
    _subscription_id, _transaction_id, _started_at, _expires_at,
    CASE WHEN _event_type = 'subscription_canceled' THEN now() ELSE NULL END,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    plan = EXCLUDED.plan,
    status = EXCLUDED.status,
    kiwify_product_id = COALESCE(EXCLUDED.kiwify_product_id, subscriptions.kiwify_product_id),
    kiwify_subscription_id = COALESCE(EXCLUDED.kiwify_subscription_id, subscriptions.kiwify_subscription_id),
    kiwify_transaction_id = COALESCE(EXCLUDED.kiwify_transaction_id, subscriptions.kiwify_transaction_id),
    started_at = COALESCE(EXCLUDED.started_at, subscriptions.started_at),
    expires_at = COALESCE(EXCLUDED.expires_at, subscriptions.expires_at),
    canceled_at = CASE
      WHEN _event_type = 'subscription_canceled' THEN now()
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

REVOKE ALL ON FUNCTION public.process_kiwify_subscription_event(text, text, text, text, public.subscription_plan, text, text, timestamptz, timestamptz, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_kiwify_subscription_event(text, text, text, text, public.subscription_plan, text, text, timestamptz, timestamptz, jsonb) TO service_role;