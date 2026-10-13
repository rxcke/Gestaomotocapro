\set ON_ERROR_STOP 1
CREATE TABLE work_sessions(id uuid primary key);
CREATE TABLE fuel_records(id uuid primary key, user_id uuid, motorcycle_id uuid, work_session_id uuid, date date, total numeric, station text, unique(id,user_id));
CREATE TABLE maintenance_records(id uuid primary key, user_id uuid, motorcycle_id uuid, work_session_id uuid, date date, cost numeric, category text, unique(id,user_id));
CREATE TABLE expenses(id uuid primary key default gen_random_uuid(), user_id uuid, motorcycle_id uuid, work_session_id uuid, group_name text, category text, amount numeric check (amount>0), date date, description text, fuel_record_id uuid, maintenance_record_id uuid,
 foreign key (fuel_record_id,user_id) references fuel_records(id,user_id) on delete cascade, foreign key (maintenance_record_id,user_id) references maintenance_records(id,user_id) on delete cascade);
CREATE UNIQUE INDEX ON expenses(fuel_record_id) WHERE fuel_record_id IS NOT NULL;
CREATE UNIQUE INDEX ON expenses(maintenance_record_id) WHERE maintenance_record_id IS NOT NULL;

CREATE TABLE incomes(id uuid primary key default gen_random_uuid(), amount numeric);
\i drizzle/migrations/0039_allow_exact_legacy_expense_link.sql
CREATE TRIGGER protect_linked_fuel_expense_trigger BEFORE DELETE OR UPDATE ON expenses FOR EACH ROW WHEN (old.fuel_record_id IS NOT NULL) EXECUTE FUNCTION protect_linked_fuel_expense();
CREATE TRIGGER protect_linked_maintenance_expense_trigger BEFORE INSERT OR DELETE OR UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION protect_linked_maintenance_expense();
CREATE FUNCTION chk(_c boolean,_m text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF NOT COALESCE(_c,false) THEN RAISE EXCEPTION 'FAIL: %',_m; END IF; RAISE NOTICE 'PASS: %',_m; END $$;
CREATE FUNCTION fails(_sql text,_n text) RETURNS boolean LANGUAGE plpgsql AS $$ BEGIN EXECUTE _sql; RETURN false; EXCEPTION WHEN others THEN RETURN position(_n in SQLERRM)>0; END $$;
-- reproduce the 4 real cases (ids/values copied, users anonymised irrelevant)
INSERT INTO fuel_records VALUES ('86508130-0cc2-4eea-8ae8-c320ce02bba5','f6775481-1c33-4c73-95f0-7740e4823033','0ea29502-425a-41f0-90e1-d49157ef5744',null,'2026-09-14',61.900000000000006,'Posto Teste');
INSERT INTO maintenance_records VALUES ('d259c172-2c9e-4fd7-92f6-fd2c731e3e31','f6775481-1c33-4c73-95f0-7740e4823033','0ea29502-425a-41f0-90e1-d49157ef5744',null,'2026-09-14',90,'Óleo'),
 ('3dea2c45-4caf-48bf-bc4e-4d94d9f9ca6a','5f4e6e80-542b-40fc-887c-df9503fbd35a','87ea5cdf-477f-4a38-8796-6120724b40f5',null,'2026-09-22',50,'Pneus'),
 ('577cdd81-c42d-4cbf-8de2-603d1ab952c5','5f4e6e80-542b-40fc-887c-df9503fbd35a','87ea5cdf-477f-4a38-8796-6120724b40f5',null,'2026-09-22',25,'Relação');
INSERT INTO expenses(id,user_id,motorcycle_id,group_name,category,amount,date,description) VALUES
 ('bc23de91-f5d7-4df1-a3af-da9400ea8fab','f6775481-1c33-4c73-95f0-7740e4823033','0ea29502-425a-41f0-90e1-d49157ef5744','Moto','Combustível',61.900000000000006,'2026-09-14','Abastecimento · Posto Teste'),
 ('d8a6a191-108d-42d1-853e-61efb023fa44','f6775481-1c33-4c73-95f0-7740e4823033','0ea29502-425a-41f0-90e1-d49157ef5744','Moto','Manutenção',90,'2026-09-14','Óleo'),
 ('757779ed-2c3f-4354-adbd-95cdf67e5309','5f4e6e80-542b-40fc-887c-df9503fbd35a','87ea5cdf-477f-4a38-8796-6120724b40f5','Moto','Manutenção',50,'2026-09-22','Pneus'),
 ('527e0391-7435-4ede-94d8-6475a06ecec8','5f4e6e80-542b-40fc-887c-df9503fbd35a','87ea5cdf-477f-4a38-8796-6120724b40f5','Moto','Manutenção',25,'2026-09-22','Relação'),
 (gen_random_uuid(),'5f4e6e80-542b-40fc-887c-df9503fbd35a','87ea5cdf-477f-4a38-8796-6120724b40f5','Moto','Combustível',50,'2026-09-22',null);

-- extra source records for negative tests
INSERT INTO fuel_records VALUES ('00000000-0000-0000-0000-0000000000f2','5f4e6e80-542b-40fc-887c-df9503fbd35a','87ea5cdf-477f-4a38-8796-6120724b40f5',null,'2026-09-22',40,null);
INSERT INTO maintenance_records VALUES ('00000000-0000-0000-0000-0000000000a9','5f4e6e80-542b-40fc-887c-df9503fbd35a','87ea5cdf-477f-4a38-8796-6120724b40f5',null,'2026-09-22',30,'Freio');
INSERT INTO expenses(id,user_id,motorcycle_id,group_name,category,amount,date,description) VALUES
 ('00000000-0000-0000-0000-0000000000e1','5f4e6e80-542b-40fc-887c-df9503fbd35a','87ea5cdf-477f-4a38-8796-6120724b40f5','Moto','Combustível',41,'2026-09-22','Abastecimento'),
 ('00000000-0000-0000-0000-0000000000e2','5f4e6e80-542b-40fc-887c-df9503fbd35a','0ea29502-425a-41f0-90e1-d49157ef5744','Moto','Combustível',40,'2026-09-22','Abastecimento'),
 ('00000000-0000-0000-0000-0000000000e3','5f4e6e80-542b-40fc-887c-df9503fbd35a','87ea5cdf-477f-4a38-8796-6120724b40f5','Moto','Combustível',40,'2026-09-21','Abastecimento'),
 ('00000000-0000-0000-0000-0000000000e4','5f4e6e80-542b-40fc-887c-df9503fbd35a','87ea5cdf-477f-4a38-8796-6120724b40f5','Moto','Alimentação',40,'2026-09-22','Abastecimento'),
 ('00000000-0000-0000-0000-0000000000e5','f6775481-1c33-4c73-95f0-7740e4823033','87ea5cdf-477f-4a38-8796-6120724b40f5','Moto','Combustível',40,'2026-09-22','Abastecimento'),
 ('00000000-0000-0000-0000-0000000000e6','5f4e6e80-542b-40fc-887c-df9503fbd35a','87ea5cdf-477f-4a38-8796-6120724b40f5','Moto','Manutenção',31,'2026-09-22','Freio'),
 ('00000000-0000-0000-0000-0000000000e7','5f4e6e80-542b-40fc-887c-df9503fbd35a','87ea5cdf-477f-4a38-8796-6120724b40f5','Moto','Combustível',40,'2026-09-22','Abastecimento'),
 ('00000000-0000-0000-0000-0000000000e8','5f4e6e80-542b-40fc-887c-df9503fbd35a','87ea5cdf-477f-4a38-8796-6120724b40f5','Moto','Combustível',40,'2026-09-22','Abastecimento');
CREATE TEMP TABLE before AS SELECT count(*) n, sum(amount) s FROM expenses;
SELECT chk(fails($q$UPDATE expenses SET fuel_record_id='00000000-0000-0000-0000-0000000000f2' WHERE id='00000000-0000-0000-0000-0000000000e1'$q$,'fields_forbidden'),'recusa valor incompatível');
SELECT chk(fails($q$UPDATE expenses SET fuel_record_id='00000000-0000-0000-0000-0000000000f2' WHERE id='00000000-0000-0000-0000-0000000000e2'$q$,'fields_forbidden'),'recusa moto incompatível');
SELECT chk(fails($q$UPDATE expenses SET fuel_record_id='00000000-0000-0000-0000-0000000000f2' WHERE id='00000000-0000-0000-0000-0000000000e3'$q$,'fields_forbidden'),'recusa data incompatível');
SELECT chk(fails($q$UPDATE expenses SET fuel_record_id='00000000-0000-0000-0000-0000000000f2' WHERE id='00000000-0000-0000-0000-0000000000e4'$q$,'fields_forbidden'),'recusa categoria incompatível');
SELECT chk(fails($q$UPDATE expenses SET fuel_record_id='00000000-0000-0000-0000-0000000000f2' WHERE id='00000000-0000-0000-0000-0000000000e5'$q$,'fuel_expense_owner_mismatch'),'recusa usuário diferente (abastecimento)');
SELECT chk(fails($q$UPDATE expenses SET maintenance_record_id='00000000-0000-0000-0000-0000000000a9' WHERE id='00000000-0000-0000-0000-0000000000e6'$q$,'fields_forbidden'),'recusa manutenção com valor incompatível');
SELECT chk(fails($q$UPDATE expenses SET maintenance_record_id='3dea2c45-4caf-48bf-bc4e-4d94d9f9ca6a' WHERE id='d8a6a191-108d-42d1-853e-61efb023fa44'$q$,'owner_mismatch'),'recusa manutenção de outro usuário');
SELECT chk(fails($q$UPDATE expenses SET fuel_record_id='00000000-0000-0000-0000-0000000000f2', amount=40 WHERE id='00000000-0000-0000-0000-0000000000e1'$q$,'link_change_forbidden'),'recusa vincular e alterar campos ao mesmo tempo');
UPDATE expenses SET fuel_record_id='00000000-0000-0000-0000-0000000000f2' WHERE id='00000000-0000-0000-0000-0000000000e7';
SELECT chk(true,'vínculo válido de abastecimento aceito');
SELECT chk(fails($q$UPDATE expenses SET fuel_record_id='00000000-0000-0000-0000-0000000000f2' WHERE id='00000000-0000-0000-0000-0000000000e8'$q$,'unique'),'recusa origem que já tem despesa');
SELECT chk(fails($q$UPDATE expenses SET fuel_record_id=NULL WHERE id='00000000-0000-0000-0000-0000000000e7'$q$,'link_change_forbidden'),'desvincular continua proibido');
SELECT chk(fails($q$UPDATE expenses SET maintenance_record_id='00000000-0000-0000-0000-0000000000a9' WHERE id='00000000-0000-0000-0000-0000000000e7'$q$,'link_change_forbidden'),'despesa de abastecimento não vira manutenção');
\i tests/db/f05-link-script.sql
SELECT chk((SELECT n FROM before)=(SELECT count(*) FROM expenses) AND (SELECT s FROM before)=(SELECT sum(amount) FROM expenses),'nenhuma despesa criada/excluída e total igual');
SELECT chk((SELECT count(*) FROM expenses WHERE id IN ('bc23de91-f5d7-4df1-a3af-da9400ea8fab','d8a6a191-108d-42d1-853e-61efb023fa44','757779ed-2c3f-4354-adbd-95cdf67e5309','527e0391-7435-4ede-94d8-6475a06ecec8') AND coalesce(fuel_record_id,maintenance_record_id) IS NOT NULL)=4,'4 vínculos históricos (abastecimento e manutenção) válidos');
SELECT chk(fails($q$UPDATE expenses SET amount=1 WHERE id='bc23de91-f5d7-4df1-a3af-da9400ea8fab'$q$,'fields_forbidden'),'valor bloqueado após vínculo (abastecimento)');
SELECT chk(fails($q$UPDATE expenses SET amount=1 WHERE id='757779ed-2c3f-4354-adbd-95cdf67e5309'$q$,'fields_forbidden'),'valor bloqueado após vínculo (manutenção)');
SELECT chk(fails($q$DELETE FROM expenses WHERE id='bc23de91-f5d7-4df1-a3af-da9400ea8fab'$q$,'delete_forbidden'),'exclusão isolada bloqueada (abastecimento)');
SELECT chk(fails($q$DELETE FROM expenses WHERE id='d8a6a191-108d-42d1-853e-61efb023fa44'$q$,'delete_forbidden'),'exclusão isolada bloqueada (manutenção)');
SELECT chk(fails($q$\i x$q$,'') OR true,'');
CREATE TEMP TABLE b2 AS SELECT count(*) n FROM expenses;
DELETE FROM fuel_records WHERE id='86508130-0cc2-4eea-8ae8-c320ce02bba5';
SELECT chk((SELECT n FROM b2)-1=(SELECT count(*) FROM expenses),'excluir a origem remove a despesa uma única vez');
