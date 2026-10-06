ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'trial';
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS recurring_amount numeric;
COMMENT ON COLUMN public.subscriptions.trial_started_at IS 'Start of a Cakto-confirmed free trial (subscription.status = trial). Never inferred from signup date.';
COMMENT ON COLUMN public.subscriptions.trial_ends_at IS 'First charge date reported by Cakto for the trial (subscription.next_payment_date).';
COMMENT ON COLUMN public.subscriptions.recurring_amount IS 'Recurring charge amount reported by Cakto (subscription.amount).';