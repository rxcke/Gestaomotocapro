ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_phone_e164_br_mobile
  CHECK (phone IS NULL OR phone ~ '^\+55[1-9][0-9]9[0-9]{8}$') NOT VALID;

COMMENT ON COLUMN public.profiles.phone IS 'Brazilian mobile contact normalized to E.164 (+55DD9XXXXXXXX); nullable until onboarding is completed.';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _provider text;
  _phone text;
BEGIN
  _provider := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    NEW.raw_user_meta_data->>'provider',
    'email'
  );

  _phone := NEW.raw_user_meta_data->>'phone';
  IF _phone IS NULL OR _phone !~ '^\+55[1-9][0-9]9[0-9]{8}$' THEN
    _phone := NULL;
  END IF;

  INSERT INTO public.profiles (id, name, email, phone, avatar_url, auth_provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    lower(trim(NEW.email)),
    _phone,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    _provider
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(public.profiles.name, EXCLUDED.name),
    email = EXCLUDED.email,
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    auth_provider = EXCLUDED.auth_provider,
    updated_at = now();

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;