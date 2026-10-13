DO $$
DECLARE _n int;
BEGIN
  -- Etapa 2: cada par precisa bater em usuário, moto, data, valor, categoria/descrição, sem vínculo prévio.
  SELECT count(*) INTO _n FROM public.expenses e JOIN public.fuel_records f ON f.id = '86508130-0cc2-4eea-8ae8-c320ce02bba5'
   WHERE e.id = 'bc23de91-f5d7-4df1-a3af-da9400ea8fab' AND e.user_id = f.user_id AND e.motorcycle_id IS NOT DISTINCT FROM f.motorcycle_id
     AND e.date = f.date AND e.amount = f.total AND e.work_session_id IS NOT DISTINCT FROM f.work_session_id
     AND e.group_name = 'Moto' AND e.category = 'Combustível'
     AND e.description = 'Abastecimento' || CASE WHEN f.station IS NOT NULL AND btrim(f.station) <> '' THEN ' · ' || f.station ELSE '' END
     AND e.fuel_record_id IS NULL AND e.maintenance_record_id IS NULL
     AND NOT EXISTS (SELECT 1 FROM public.expenses x WHERE x.fuel_record_id = f.id);
  IF _n <> 1 THEN RAISE EXCEPTION 'F05 abort: par de abastecimento não confere'; END IF;

  SELECT count(*) INTO _n FROM public.expenses e JOIN public.maintenance_records m ON (e.id, m.id) IN (
      ('d8a6a191-108d-42d1-853e-61efb023fa44'::uuid, 'd259c172-2c9e-4fd7-92f6-fd2c731e3e31'::uuid),
      ('757779ed-2c3f-4354-adbd-95cdf67e5309'::uuid, '3dea2c45-4caf-48bf-bc4e-4d94d9f9ca6a'::uuid),
      ('527e0391-7435-4ede-94d8-6475a06ecec8'::uuid, '577cdd81-c42d-4cbf-8de2-603d1ab952c5'::uuid))
   WHERE e.user_id = m.user_id AND e.motorcycle_id IS NOT DISTINCT FROM m.motorcycle_id
     AND e.date = m.date AND e.amount = m.cost AND e.work_session_id IS NOT DISTINCT FROM m.work_session_id
     AND e.group_name = 'Moto' AND e.category = 'Manutenção' AND e.description = m.category
     AND e.fuel_record_id IS NULL AND e.maintenance_record_id IS NULL
     AND NOT EXISTS (SELECT 1 FROM public.expenses x WHERE x.maintenance_record_id = m.id);
  IF _n <> 3 THEN RAISE EXCEPTION 'F05 abort: pares de manutenção não conferem (%)', _n; END IF;


  UPDATE public.expenses SET fuel_record_id = '86508130-0cc2-4eea-8ae8-c320ce02bba5'
   WHERE id = 'bc23de91-f5d7-4df1-a3af-da9400ea8fab' AND fuel_record_id IS NULL;
  GET DIAGNOSTICS _n = ROW_COUNT; IF _n <> 1 THEN RAISE EXCEPTION 'F05 abort: fuel update %', _n; END IF;

  UPDATE public.expenses e SET maintenance_record_id = v.m
    FROM (VALUES ('d8a6a191-108d-42d1-853e-61efb023fa44'::uuid, 'd259c172-2c9e-4fd7-92f6-fd2c731e3e31'::uuid),
                 ('757779ed-2c3f-4354-adbd-95cdf67e5309'::uuid, '3dea2c45-4caf-48bf-bc4e-4d94d9f9ca6a'::uuid),
                 ('527e0391-7435-4ede-94d8-6475a06ecec8'::uuid, '577cdd81-c42d-4cbf-8de2-603d1ab952c5'::uuid)) v(e, m)
   WHERE e.id = v.e AND e.maintenance_record_id IS NULL;
  GET DIAGNOSTICS _n = ROW_COUNT; IF _n <> 3 THEN RAISE EXCEPTION 'F05 abort: maintenance update %', _n; END IF;

END $$;
