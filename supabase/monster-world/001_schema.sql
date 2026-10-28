-- Monster World Online - fresh isolated schema in Supabase amber-world-class.
-- NEVER run on Supabase 55-amberlands. Older awc_characters etc remain intact.
BEGIN;
CREATE TABLE IF NOT EXISTS public.awc_pet_species(
 id integer PRIMARY KEY CHECK(id BETWEEN 1 AND 100),
 family smallint NOT NULL CHECK(family BETWEEN 0 AND 24),
 stage smallint NOT NULL CHECK(stage BETWEEN 0 AND 3),
 name_th text NOT NULL,element text NOT NULL,rarity smallint NOT NULL CHECK(rarity BETWEEN 1 AND 4),
 base_hp integer NOT NULL,base_atk integer NOT NULL,base_def integer NOT NULL,
 base_speed integer NOT NULL,catch_base numeric(5,3) NOT NULL,evo_level smallint NOT NULL,
 UNIQUE(family,stage)
);
CREATE TABLE IF NOT EXISTS public.awc_pet_players(
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 name text NOT NULL DEFAULT 'นักสำรวจ' CHECK(char_length(name) BETWEEN 2 AND 22),
 coins integer NOT NULL DEFAULT 1600 CHECK(coins>=0),
 gems integer NOT NULL DEFAULT 50 CHECK(gems>=0),
 balls integer NOT NULL DEFAULT 15 CHECK(balls BETWEEN 0 AND 999999),
 potions integer NOT NULL DEFAULT 5 CHECK(potions BETWEEN 0 AND 999999),
 area smallint NOT NULL DEFAULT 0 CHECK(area BETWEEN 0 AND 9),
 captures integer NOT NULL DEFAULT 0,
 wins integer NOT NULL DEFAULT 0,
 xp integer NOT NULL DEFAULT 0,
 last_explore timestamptz NOT NULL DEFAULT 'epoch',
 last_action timestamptz NOT NULL DEFAULT 'epoch',
 last_seen timestamptz NOT NULL DEFAULT now(),
 daily_claim date,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.awc_pet_owned(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 species_id integer NOT NULL REFERENCES public.awc_pet_species(id),
 level smallint NOT NULL DEFAULT 1 CHECK(level BETWEEN 1 AND 80),
 exp integer NOT NULL DEFAULT 0 CHECK(exp>=0),
 hp integer NOT NULL,max_hp integer NOT NULL,
 slot smallint CHECK(slot BETWEEN 1 AND 6),
 caught_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS awc_pet_owned_owner ON public.awc_pet_owned(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS awc_pet_unique_team_slot ON public.awc_pet_owned(user_id,slot) WHERE slot IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.awc_pet_encounters(
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 species_id integer NOT NULL REFERENCES public.awc_pet_species(id),
 level smallint NOT NULL,hp integer NOT NULL,max_hp integer NOT NULL,
 turns smallint NOT NULL DEFAULT 0,started_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.awc_pet_activity(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 event text NOT NULL,species_id integer,at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS awc_pet_activity_user_at ON public.awc_pet_activity(user_id,at DESC);
WITH families AS (
 SELECT ARRAY['เพลิงจิ้ง','หยดน้ำ','ใบเมียว','สายฟ้าจิ๋ว','หิมะปุย','เงาเหมียว','แสงกวาง','หินป้อม','วายุปีก','คริสตัล','ลาวาเต่า','บัวธาร','หนามกระรอก','เมฆสายฟ้า','น้ำแข็งโบ','จันทร์หมาป่า','สุริยานก','ภูผากบ','พายุปลา','แก้วมังกร','ไฟสิงโต','ทะเลวาฬ','พฤกษากวาง','เวทดารา','ราชันแสง']::text[] AS names,
 ARRAY['fire','water','grass','electric','ice','dark','light','earth','wind','crystal','fire','water','grass','electric','ice','dark','light','earth','wind','crystal','fire','water','grass','arcane','light']::text[] AS elements
)
INSERT INTO public.awc_pet_species(id,family,stage,name_th,element,rarity,base_hp,base_atk,base_def,base_speed,catch_base,evo_level)
SELECT family*4+stage+1,family,stage,(SELECT names[family+1] FROM families)||(ARRAY['น้อย','ว่องไว','จ้าว','ตำนาน'])[stage+1],
 (SELECT elements[family+1] FROM families),
 CASE WHEN family>=23 THEN 4 WHEN family>=18 THEN 3 WHEN family>=10 THEN 2 ELSE 1 END,
 45+stage*26+(family%5)*6,
 10+stage*9+(family%7)*2,
 8+stage*7+(family%6)*2,
 12+stage*7+(family%4)*3,
 CASE WHEN family>=23 THEN .09 WHEN family>=18 THEN .19 WHEN family>=10 THEN .32 ELSE .58 END/(1+stage*.52),
 (ARRAY[0,12,28,48])[stage+1]
FROM generate_series(0,24) family CROSS JOIN generate_series(0,3) stage
ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.awc_pet_species ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awc_pet_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awc_pet_owned ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awc_pet_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awc_pet_activity ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.awc_pet_species,public.awc_pet_players,public.awc_pet_owned,public.awc_pet_encounters,public.awc_pet_activity FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.awc_pet_species,public.awc_pet_players,public.awc_pet_owned,public.awc_pet_encounters,public.awc_pet_activity TO authenticated;
DROP POLICY IF EXISTS awc_pet_species_read ON public.awc_pet_species;
CREATE POLICY awc_pet_species_read ON public.awc_pet_species FOR SELECT TO authenticated USING(true);
DROP POLICY IF EXISTS awc_pet_own_player ON public.awc_pet_players;
CREATE POLICY awc_pet_own_player ON public.awc_pet_players FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS awc_pet_own_creatures ON public.awc_pet_owned;
CREATE POLICY awc_pet_own_creatures ON public.awc_pet_owned FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS awc_pet_own_wild ON public.awc_pet_encounters;
CREATE POLICY awc_pet_own_wild ON public.awc_pet_encounters FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS awc_pet_own_activity ON public.awc_pet_activity;
CREATE POLICY awc_pet_own_activity ON public.awc_pet_activity FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
COMMIT;
