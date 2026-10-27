-- AMBER WORLD CLASS: NEW Supabase project only (never old 55 AMBERLANDS).
-- Initial trusted schema. Public clients have read-own only.
BEGIN;
CREATE TABLE IF NOT EXISTS public.awc_profiles (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 nickname text NOT NULL CHECK(char_length(nickname) BETWEEN 2 AND 24),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.awc_characters (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
 name text NOT NULL CHECK(char_length(name) BETWEEN 2 AND 24),
 class_id smallint NOT NULL DEFAULT -1 CHECK(class_id BETWEEN -1 AND 3),
 level smallint NOT NULL DEFAULT 1 CHECK(level BETWEEN 1 AND 100),
 exp integer NOT NULL DEFAULT 0 CHECK(exp>=0),
 map_id smallint NOT NULL DEFAULT 0 CHECK(map_id BETWEEN 0 AND 9),
 x double precision NOT NULL DEFAULT 570 CHECK(x BETWEEN 20 AND 1132),
 y double precision NOT NULL DEFAULT 656 CHECK(y BETWEEN 20 AND 1132),
 hp integer NOT NULL DEFAULT 110 CHECK(hp BETWEEN 0 AND 10000000),
 max_hp integer NOT NULL DEFAULT 110 CHECK(max_hp BETWEEN 1 AND 10000000),
 mp integer NOT NULL DEFAULT 70 CHECK(mp BETWEEN 0 AND 10000000),
 max_mp integer NOT NULL DEFAULT 70 CHECK(max_mp BETWEEN 1 AND 10000000),
 attack integer NOT NULL DEFAULT 24 CHECK(attack BETWEEN 1 AND 10000000),
 defense integer NOT NULL DEFAULT 7 CHECK(defense BETWEEN 0 AND 10000000),
 stat_points integer NOT NULL DEFAULT 0 CHECK(stat_points BETWEEN 0 AND 9999),
 gold bigint NOT NULL DEFAULT 250 CHECK(gold>=0),
 gems bigint NOT NULL DEFAULT 10 CHECK(gems>=0),
 potions integer NOT NULL DEFAULT 10 CHECK(potions BETWEEN 0 AND 999999),
 mob_kills integer NOT NULL DEFAULT 0 CHECK(mob_kills>=0),
 quest_kills integer NOT NULL DEFAULT 0 CHECK(quest_kills>=0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.awc_inventory (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 character_id uuid NOT NULL REFERENCES public.awc_characters(id) ON DELETE CASCADE,
 item_code text NOT NULL CHECK(item_code ~ '^[a-z0-9_]{2,50}$'),
 quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 999999),
 refine smallint NOT NULL DEFAULT 0 CHECK(refine BETWEEN 0 AND 10),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS awc_inventory_character_idx ON public.awc_inventory(character_id);
CREATE TABLE IF NOT EXISTS public.awc_combat_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 character_id uuid NOT NULL REFERENCES public.awc_characters(id) ON DELETE CASCADE,
 mob_code text NOT NULL,map_id smallint NOT NULL,
 damage integer NOT NULL CHECK(damage>=0),
 exp_awarded integer NOT NULL DEFAULT 0 CHECK(exp_awarded>=0),
 gold_awarded bigint NOT NULL DEFAULT 0 CHECK(gold_awarded>=0),
 happened_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS awc_combat_audit_char_time_idx ON public.awc_combat_audit(character_id,happened_at DESC);
ALTER TABLE public.awc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awc_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awc_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awc_combat_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.awc_profiles,public.awc_characters,public.awc_inventory,public.awc_combat_audit FROM anon,authenticated;
GRANT SELECT ON public.awc_profiles,public.awc_characters,public.awc_inventory,public.awc_combat_audit TO authenticated;
CREATE POLICY "awc_profile_owner_read" ON public.awc_profiles FOR SELECT TO authenticated USING ((select auth.uid())=user_id);
CREATE POLICY "awc_character_owner_read" ON public.awc_characters FOR SELECT TO authenticated USING ((select auth.uid())=user_id);
CREATE POLICY "awc_inventory_owner_read" ON public.awc_inventory FOR SELECT TO authenticated USING (
 EXISTS(SELECT 1 FROM public.awc_characters c WHERE c.id=character_id AND c.user_id=(select auth.uid())));
CREATE POLICY "awc_combat_owner_read" ON public.awc_combat_audit FOR SELECT TO authenticated USING (
 EXISTS(SELECT 1 FROM public.awc_characters c WHERE c.id=character_id AND c.user_id=(select auth.uid())));
COMMIT;
