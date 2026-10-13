\set ON_ERROR_STOP 1
CREATE TABLE public.work_sessions(id uuid primary key, user_id uuid not null, end_time timestamptz, total_income numeric not null default 0, total_expense numeric not null default 0, net_profit numeric not null default 0, unique(id,user_id));
CREATE TABLE public.incomes(id uuid primary key default gen_random_uuid(), user_id uuid not null, motorcycle_id uuid, work_session_id uuid references work_sessions(id) on delete set null, amount numeric not null);
CREATE TABLE public.fuel_records(id uuid primary key default gen_random_uuid(), user_id uuid not null, work_session_id uuid, total numeric not null, unique(id,user_id));
CREATE TABLE public.expenses(id uuid primary key default gen_random_uuid(), user_id uuid not null, motorcycle_id uuid, work_session_id uuid references work_sessions(id) on delete set null, fuel_record_id uuid unique, amount numeric not null, foreign key (fuel_record_id,user_id) references fuel_records(id,user_id) on delete cascade);
-- simplified fuel->expense sync, same shape as production
CREATE FUNCTION sync_fuel() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='INSERT' THEN INSERT INTO expenses(user_id,fuel_record_id,work_session_id,amount) VALUES (NEW.user_id,NEW.id,NEW.work_session_id,NEW.total);
 ELSE UPDATE expenses SET amount=NEW.total WHERE fuel_record_id=NEW.id; END IF; RETURN NEW; END $$;
CREATE TRIGGER sync_fuel AFTER INSERT OR UPDATE ON fuel_records FOR EACH ROW EXECUTE FUNCTION sync_fuel();
-- existing data before migration (preserved)
INSERT INTO work_sessions VALUES ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000000a',now(),100,20,80);
INSERT INTO incomes(user_id,work_session_id,amount) VALUES ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000a1',100);
INSERT INTO incomes(user_id,work_session_id,amount) VALUES ('00000000-0000-0000-0000-00000000000a',null,55);
INSERT INTO expenses(user_id,work_session_id,amount) VALUES ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000a1',20);
\i drizzle/migrations/0038_financial_integrity_phase2.sql -- (rodar a partir da raiz)
CREATE FUNCTION chk(_c boolean,_m text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF NOT COALESCE(_c,false) THEN RAISE EXCEPTION 'FAIL: %',_m; END IF; RAISE NOTICE 'PASS: %',_m; END $$;
CREATE FUNCTION fails(_sql text,_needle text) RETURNS boolean LANGUAGE plpgsql AS $$ BEGIN EXECUTE _sql; RETURN false; EXCEPTION WHEN others THEN RETURN position(_needle in SQLERRM)>0; END $$;
CREATE FUNCTION tot() RETURNS numeric[] LANGUAGE sql AS $$ SELECT ARRAY[total_income,total_expense,net_profit] FROM work_sessions WHERE id='00000000-0000-0000-0000-0000000000a1' $$;
SELECT chk((SELECT count(*) FROM incomes)=2 AND (SELECT count(*) FROM expenses)=1,'dados existentes preservados');
SELECT chk(tot()=ARRAY[100,20,80]::numeric[],'totais existentes intactos após migração');
-- F-01
SELECT chk(fails($$INSERT INTO incomes(user_id,amount) VALUES ('00000000-0000-0000-0000-00000000000a',0)$$,'incomes_amount_positive'),'F-01 ganho zero recusado');
SELECT chk(fails($$INSERT INTO incomes(user_id,amount) VALUES ('00000000-0000-0000-0000-00000000000a',-5)$$,'incomes_amount_positive'),'F-01 ganho negativo recusado');
SELECT chk(fails($$INSERT INTO expenses(user_id,amount) VALUES ('00000000-0000-0000-0000-00000000000a',0)$$,'expenses_amount_positive'),'F-01 gasto zero recusado');
SELECT chk(fails($$UPDATE expenses SET amount=-1$$,'expenses_amount_positive'),'F-01 editar gasto para negativo recusado');
SELECT chk(fails($$INSERT INTO fuel_records(user_id,total) VALUES ('00000000-0000-0000-0000-00000000000a',0)$$,'expenses_amount_positive'),'F-01 abastecimento zero não cria despesa');
INSERT INTO incomes(user_id,amount) VALUES ('00000000-0000-0000-0000-00000000000a',0.01);
SELECT chk(true,'F-01 centavo aceito; lançamento sem jornada/moto aceito');
-- F-04
INSERT INTO work_sessions(id,user_id) VALUES ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-00000000000b');
SELECT chk(fails($$INSERT INTO incomes(user_id,work_session_id,amount) VALUES ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000b1',10)$$,'work_session_owner_mismatch'),'F-04 ganho em jornada alheia recusado');
SELECT chk(fails($$INSERT INTO expenses(user_id,work_session_id,amount) VALUES ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000b1',10)$$,'work_session_owner_mismatch'),'F-04 gasto em jornada alheia recusado');
SELECT chk(fails($$UPDATE incomes SET work_session_id='00000000-0000-0000-0000-0000000000b1' WHERE amount=55$$,'work_session_owner_mismatch'),'F-04 mover ganho para jornada alheia recusado');
SELECT chk(fails($$UPDATE work_sessions SET user_id=user_id WHERE false; UPDATE expenses SET user_id='00000000-0000-0000-0000-00000000000b' WHERE amount=20$$,'work_session_owner_mismatch'),'F-04 trocar dono do gasto vinculado recusado');
INSERT INTO incomes(user_id,work_session_id,amount) VALUES ('00000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-0000000000b1',40);
SELECT chk(true,'F-04 lançamento na própria jornada aceito');
-- F-02
UPDATE incomes SET amount=150 WHERE amount=100;
SELECT chk(tot()=ARRAY[150,20,130]::numeric[],'F-02 editar ganho recalcula jornada encerrada');
UPDATE expenses SET amount=35 WHERE amount=20;
SELECT chk(tot()=ARRAY[150,35,115]::numeric[],'F-02 editar gasto recalcula');
DELETE FROM expenses WHERE amount=35;
SELECT chk(tot()=ARRAY[150,0,150]::numeric[],'F-02 excluir gasto recalcula');
INSERT INTO fuel_records(user_id,work_session_id,total) VALUES ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000a1',30);
SELECT chk(tot()=ARRAY[150,30,120]::numeric[],'F-02 abastecimento conta uma única vez');
SELECT chk((SELECT count(*) FROM expenses WHERE fuel_record_id IS NOT NULL)=1,'sem despesa de combustível duplicada');
UPDATE fuel_records SET total=45;
SELECT chk(tot()=ARRAY[150,45,105]::numeric[],'F-02 editar abastecimento recalcula sem duplicar');
DELETE FROM fuel_records;
SELECT chk(tot()=ARRAY[150,0,150]::numeric[],'F-02 excluir abastecimento remove o custo uma vez');
UPDATE incomes SET work_session_id=NULL WHERE amount=150;
SELECT chk(tot()=ARRAY[0,0,0]::numeric[],'F-02 desvincular ganho recalcula');
UPDATE work_sessions SET total_income=9999 WHERE id='00000000-0000-0000-0000-0000000000a1';
SELECT chk(tot()=ARRAY[0,0,0]::numeric[],'F-02 total adulterado é corrigido');
-- active session untouched until closed, then server sum wins
INSERT INTO work_sessions(id,user_id) VALUES ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-00000000000a');
INSERT INTO incomes(user_id,work_session_id,amount) VALUES ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000a2',70);
SELECT chk((SELECT total_income FROM work_sessions WHERE id='00000000-0000-0000-0000-0000000000a2')=0,'jornada ativa não é alterada');
UPDATE work_sessions SET end_time=now(), total_income=1, total_expense=0, net_profit=1 WHERE id='00000000-0000-0000-0000-0000000000a2';
SELECT chk((SELECT ARRAY[total_income,net_profit] FROM work_sessions WHERE id='00000000-0000-0000-0000-0000000000a2')=ARRAY[70,70]::numeric[],'encerrar grava a soma real');
SELECT chk(NOT has_function_privilege('authenticated','public.work_session_entry_totals(uuid,uuid)','EXECUTE'),'funções internas não executáveis por usuários');
