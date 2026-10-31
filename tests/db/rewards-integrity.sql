CREATE TYPE public.app_role AS ENUM('admin','user','ambassador');
CREATE FUNCTION public.has_role(_user_id uuid,_role public.app_role) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT _role='admin' AND _user_id='00000000-0000-0000-0000-000000000003'::uuid $$;
CREATE FUNCTION public.has_app_access(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT _user_id IN ('00000000-0000-0000-0000-000000000001'::uuid,'00000000-0000-0000-0000-000000000002'::uuid) $$;
