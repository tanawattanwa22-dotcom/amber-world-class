-- AMBER WORLD CLASS V0.3 world tables (new project only).
BEGIN;
CREATE TABLE IF NOT EXISTS public.awc_world_mobs(
 map_id smallint NOT NULL CHECK(map_id BETWEEN 0 AND 9),
 mob_code text NOT NULL,
 mob_type smallint NOT NULL CHECK(mob_type BETWEEN 0 AND 9),
 level smallint NOT NULL CHECK(level BETWEEN 1 AND 100),
 x double precision NOT NULL,y double precision NOT NULL,
 hp integer NOT NULL CHECK(hp BETWEEN 0 AND 10000000),
 max_hp integer NOT NULL CHECK(max_hp BETWEEN 1 AND 10000000),
 boss boolean NOT NULL DEFAULT false,respawn_at timestamptz,
 PRIMARY KEY(map_id,mob_code)
);
CREATE TABLE IF NOT EXISTS public.awc_action_timing (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 last_move timestamptz NOT NULL DEFAULT now(),
 last_attack timestamptz NOT NULL DEFAULT 'epoch'::timestamptz,
 last_skill timestamptz NOT NULL DEFAULT 'epoch'::timestamptz,
 last_potion timestamptz NOT NULL DEFAULT 'epoch'::timestamptz,
 last_travel timestamptz NOT NULL DEFAULT 'epoch'::timestamptz
);
INSERT INTO public.awc_world_mobs(map_id,mob_code,mob_type,level,x,y,hp,max_hp,boss)
SELECT z.map_id,CASE WHEN s.i=8 THEN 'boss'||z.map_id ELSE 'm'||z.map_id||'-'||s.i END,
 CASE WHEN s.i=8 THEN (z.map_id+7)%10 ELSE (z.map_id+s.i%3)%10 END,
 CASE WHEN s.i=8 THEN z.max_level ELSE least(100,z.min_level+s.i%3) END,
 CASE s.i WHEN 0 THEN 336 WHEN 1 THEN 760 WHEN 2 THEN 300 WHEN 3 THEN 842 WHEN 4 THEN 540 WHEN 5 THEN 936 WHEN 6 THEN 250 WHEN 7 THEN 800 ELSE 945 END,
 CASE s.i WHEN 0 THEN 610 WHEN 1 THEN 490 WHEN 2 THEN 830 WHEN 3 THEN 760 WHEN 4 THEN 330 WHEN 5 THEN 400 WHEN 6 THEN 390 WHEN 7 THEN 900 ELSE 855 END,
 CASE WHEN s.i=8 THEN 850+z.map_id*400 ELSE 90+z.map_id*62+s.i*13 END,
 CASE WHEN s.i=8 THEN 850+z.map_id*400 ELSE 90+z.map_id*62+s.i*13 END,
 s.i=8 FROM (VALUES(0,1,10),(1,5,15),(2,10,25),(3,20,35),(4,30,45),
 (5,40,60),(6,55,80),(7,70,100),(8,80,100),(9,100,100)) AS z(map_id,min_level,max_level)
 CROSS JOIN generate_series(0,8) AS s(i)
 ON CONFLICT DO NOTHING;
ALTER TABLE public.awc_world_mobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awc_action_timing ENABLE ROW LEVEL SECURITY;
-- Intentional: no browser policies for private server-maintained tables.
REVOKE ALL ON public.awc_world_mobs,public.awc_action_timing FROM PUBLIC,anon,authenticated;
COMMIT;