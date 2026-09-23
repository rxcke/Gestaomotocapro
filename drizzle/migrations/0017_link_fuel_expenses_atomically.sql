ALTER TABLE public.expenses
  ADD COLUMN fuel_record_id uuid;

ALTER TABLE public.fuel_records
  ADD CONSTRAINT fuel_records_id_user_unique UNIQUE (id, user_id);

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_fuel_record_owner_fkey
  FOREIGN KEY (fuel_record_id, user_id)
  REFERENCES public.fuel_records (id, user_id)
  ON DELETE CASCADE;

CREATE UNIQUE INDEX expenses_fuel_record_unique
  ON public.expenses (fuel_record_id)
  WHERE fuel_record_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.save_fuel_record_with_expense(
  _fuel_record_id uuid,
  _motorcycle_id uuid,
  _date date,
  _km numeric,
  _liters numeric,
  _price_per_liter numeric,
  _total numeric,
  _station text,
  _description text
)
RETURNS public.fuel_records
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _saved public.fuel_records;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF _motorcycle_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.motorcycles
    WHERE id = _motorcycle_id
      AND user_id = _user_id
  ) THEN
    RAISE EXCEPTION 'motorcycle_not_owned';
  END IF;

  IF _fuel_record_id IS NULL THEN
    INSERT INTO public.fuel_records (
      user_id, motorcycle_id, date, km, liters, price_per_liter,
      total, station, description
    ) VALUES (
      _user_id, _motorcycle_id, _date, _km, _liters, _price_per_liter,
      _total, _station, _description
    )
    RETURNING * INTO _saved;

    INSERT INTO public.expenses (
      user_id, fuel_record_id, motorcycle_id, group_name, category,
      amount, date, description
    ) VALUES (
      _user_id, _saved.id, _saved.motorcycle_id, 'Moto', 'Combustível',
      _saved.total, _saved.date,
      'Abastecimento' || CASE
        WHEN _saved.station IS NOT NULL AND btrim(_saved.station) <> ''
          THEN ' · ' || _saved.station
        ELSE ''
      END
    )
    ON CONFLICT (fuel_record_id) WHERE fuel_record_id IS NOT NULL
    DO UPDATE SET
      motorcycle_id = EXCLUDED.motorcycle_id,
      group_name = EXCLUDED.group_name,
      category = EXCLUDED.category,
      amount = EXCLUDED.amount,
      date = EXCLUDED.date,
      description = EXCLUDED.description;
  ELSE
    UPDATE public.fuel_records
    SET motorcycle_id = _motorcycle_id,
        date = _date,
        km = _km,
        liters = _liters,
        price_per_liter = _price_per_liter,
        total = _total,
        station = _station,
        description = _description
    WHERE id = _fuel_record_id
      AND user_id = _user_id
    RETURNING * INTO _saved;

    IF _saved.id IS NULL THEN
      RAISE EXCEPTION 'fuel_record_not_found';
    END IF;

    UPDATE public.expenses
    SET motorcycle_id = _saved.motorcycle_id,
        group_name = 'Moto',
        category = 'Combustível',
        amount = _saved.total,
        date = _saved.date,
        description = 'Abastecimento' || CASE
          WHEN _saved.station IS NOT NULL AND btrim(_saved.station) <> ''
            THEN ' · ' || _saved.station
          ELSE ''
        END
    WHERE fuel_record_id = _saved.id
      AND user_id = _user_id;
  END IF;

  RETURN _saved;
END;
$$;

REVOKE ALL ON FUNCTION public.save_fuel_record_with_expense(uuid, uuid, date, numeric, numeric, numeric, numeric, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_fuel_record_with_expense(uuid, uuid, date, numeric, numeric, numeric, numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_fuel_record_with_expense(uuid, uuid, date, numeric, numeric, numeric, numeric, text, text) TO service_role;