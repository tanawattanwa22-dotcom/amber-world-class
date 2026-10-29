-- Amberlings Online v4 schema: only target Supabase project amber-world-class.
CREATE TABLE IF NOT EXISTS public.amberlings_guilds(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK(char_length(name) BETWEEN 3 AND 24 AND name ~ '^[[:alnum:]ก-๙ _-]+$'),
 leader_id uuid NOT NULL REFERENCES public.amberlings_players(user_id),created_at timestamptz DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS amberlings_guilds_lower_name ON public.amberlings_guilds(lower(name));
CREATE TABLE IF NOT EXISTS public.amberlings_guild_members(user_id uuid PRIMARY KEY REFERENCES public.amberlings_players(user_id) ON DELETE CASCADE,
 guild_id uuid NOT NULL REFERENCES public.amberlings_guilds(id) ON DELETE CASCADE,
 role text NOT NULL DEFAULT 'member' CHECK(role IN ('leader','member')),joined_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS amberlings_guild_members_gid ON public.amberlings_guild_members(guild_id);
CREATE TABLE IF NOT EXISTS public.amberlings_friends(requester uuid REFERENCES public.amberlings_players(user_id) ON DELETE CASCADE,
 recipient uuid REFERENCES public.amberlings_players(user_id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted')),
 created_at timestamptz DEFAULT now(),PRIMARY KEY(requester,recipient),CHECK(requester<>recipient));
CREATE INDEX IF NOT EXISTS amberlings_friends_recipient ON public.amberlings_friends(recipient,status);
CREATE TABLE IF NOT EXISTS public.amberlings_chat(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 sender uuid NOT NULL REFERENCES public.amberlings_players(user_id) ON DELETE CASCADE,
 channel text NOT NULL CHECK(channel IN ('world','guild')),guild_id uuid REFERENCES public.amberlings_guilds(id) ON DELETE CASCADE,
 body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 240),created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((channel='world' AND guild_id IS NULL) OR(channel='guild' AND guild_id IS NOT NULL)));
CREATE INDEX IF NOT EXISTS amberlings_chat_recent ON public.amberlings_chat(channel,created_at DESC);
CREATE INDEX IF NOT EXISTS amberlings_chat_guild ON public.amberlings_chat(guild_id,created_at DESC);
CREATE TABLE IF NOT EXISTS public.amberlings_chat_reports(reporter uuid REFERENCES public.amberlings_players(user_id) ON DELETE CASCADE,
 message_id bigint REFERENCES public.amberlings_chat(id) ON DELETE CASCADE,created_at timestamptz DEFAULT now(),
 PRIMARY KEY(reporter,message_id));
CREATE TABLE IF NOT EXISTS public.amberlings_pvp_duels(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 challenger uuid NOT NULL REFERENCES public.amberlings_players(user_id) ON DELETE CASCADE,
 opponent uuid NOT NULL REFERENCES public.amberlings_players(user_id) ON DELETE CASCADE,
 challenger_mon uuid NOT NULL REFERENCES public.amberlings_monsters(id),
 opponent_mon uuid REFERENCES public.amberlings_monsters(id),ch_hp int NOT NULL DEFAULT 0 CHECK(ch_hp>=0),
 op_hp int NOT NULL DEFAULT 0 CHECK(op_hp>=0),turn_user uuid REFERENCES public.amberlings_players(user_id),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','done','cancelled')),
 winner uuid REFERENCES public.amberlings_players(user_id),rounds int NOT NULL DEFAULT 0 CHECK(rounds>=0),
 last_move_at timestamptz NOT NULL DEFAULT now(),created_at timestamptz NOT NULL DEFAULT now(),CHECK(challenger<>opponent));
CREATE INDEX IF NOT EXISTS amberlings_pvp_recent ON public.amberlings_pvp_duels(created_at DESC);
CREATE INDEX IF NOT EXISTS amberlings_pvp_ch ON public.amberlings_pvp_duels(challenger,status);
CREATE INDEX IF NOT EXISTS amberlings_pvp_op ON public.amberlings_pvp_duels(opponent,status);
CREATE TABLE IF NOT EXISTS public.amberlings_gym_runs(owner_id uuid PRIMARY KEY REFERENCES public.amberlings_players(user_id) ON DELETE CASCADE,
 stage int NOT NULL CHECK(stage BETWEEN 1 AND 3),boss_hp int NOT NULL CHECK(boss_hp>=0),
 mon_hp int NOT NULL CHECK(mon_hp>=0),rounds int NOT NULL DEFAULT 0,last_attack timestamptz NOT NULL DEFAULT '1970-01-01',
 created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.amberlings_gym_claims(owner_id uuid REFERENCES public.amberlings_players(user_id) ON DELETE CASCADE,
 stage int NOT NULL CHECK(stage BETWEEN 1 AND 3),claimed_at timestamptz DEFAULT now(),PRIMARY KEY(owner_id,stage));
CREATE TABLE IF NOT EXISTS public.amberlings_quest_claims(owner_id uuid REFERENCES public.amberlings_players(user_id) ON DELETE CASCADE,
 quest text NOT NULL CHECK(quest IN('capture1','wins5','gym1','guild1','pvp1')),claimed_at timestamptz DEFAULT now(),PRIMARY KEY(owner_id,quest));
DO $d$ DECLARE tbl text; BEGIN
 FOREACH tbl IN ARRAY ARRAY['amberlings_guilds','amberlings_guild_members','amberlings_friends','amberlings_chat',
 'amberlings_chat_reports','amberlings_pvp_duels','amberlings_gym_runs','amberlings_gym_claims','amberlings_quest_claims'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',tbl);
 EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',tbl);
 EXECUTE format('GRANT ALL ON public.%I TO service_role',tbl);
 END LOOP; END $d$;
REVOKE ALL ON SEQUENCE public.amberlings_chat_id_seq FROM PUBLIC,anon,authenticated;
GRANT USAGE,SELECT ON SEQUENCE public.amberlings_chat_id_seq TO service_role;
