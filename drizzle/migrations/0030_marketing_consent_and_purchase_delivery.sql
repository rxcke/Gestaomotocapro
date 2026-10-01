CREATE TABLE public.marketing_consent_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  visitor_id uuid NOT NULL,
  accepted boolean NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now(),
  notice_version text NOT NULL,
  region text NOT NULL,
  purposes text NOT NULL DEFAULT 'Meta advertising measurement and optimization; Google Analytics measurement',
  recipients text NOT NULL DEFAULT 'Meta Platforms; Google',
  data_categories text NOT NULL DEFAULT 'Page paths, campaign parameters and checkout/purchase events; no contact identifiers',
  previous_choice_id uuid REFERENCES public.marketing_consent_choices(id)
);
GRANT SELECT, INSERT ON public.marketing_consent_choices TO authenticated;
GRANT ALL ON public.marketing_consent_choices TO service_role;
ALTER TABLE public.marketing_consent_choices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own marketing consent" ON public.marketing_consent_choices FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "record own marketing consent" ON public.marketing_consent_choices FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE INDEX marketing_consent_user_date ON public.marketing_consent_choices(user_id, decided_at DESC);

CREATE TABLE public.meta_purchase_deliveries (
  transaction_id text PRIMARY KEY,
  event_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  plan text NOT NULL,
  value numeric(12,2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'blocked')),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.meta_purchase_deliveries TO service_role;
ALTER TABLE public.meta_purchase_deliveries ENABLE ROW LEVEL SECURITY;
CREATE INDEX meta_purchase_pending ON public.meta_purchase_deliveries(status, created_at);
