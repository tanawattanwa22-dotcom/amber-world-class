-- AMBERLINGS, isolated from 55 AMBERLANDS and the previous AMBER WORLD CLASS tables.
-- Server-only economy. Browser roles cannot insert/update/delete any player state.
BEGIN;
CREATE TABLE IF NOT EXISTS public.amberlings_species(
 id text PRIMARY KEY,name_th text NOT NULL,element text NOT NULL,
 base_hp int NOT NULL,base_atk int NOT NULL,base_def int NOT NULL,base_speed int NOT NULL,
 evolve_to text,evolve_level int NOT NULL DEFAULT 0,catch_rate int NOT NULL,exp_yield int NOT NULL
);
INSERT INTO public.amberlings_species VALUES
('embit','เอมบิท','fire',42,52,40,62,'flarix',16,45,64),
('flarix','ฟลาริกซ์','fire',60,68,56,78,'infernox',36,45,142),
('infernox','อินเฟอร์น็อกซ์','fire',80,92,76,98,NULL,0,45,240),
('aquip','อควิป','water',48,46,48,50,'tidalon',16,45,64),
('tidalon','ไทดาลอน','water',66,62,64,60,'leviathor',36,45,142),
('leviathor','เลวีอาธอร์','water',88,84,90,74,NULL,0,45,240),
('sproutle','สเปราต์เทิล','leaf',50,48,50,46,'thornyx',16,45,64),
('thornyx','ธอร์นนิกซ์','leaf',68,64,66,58,'florabeast',36,45,142),
('florabeast','ฟลอราบีสต์','leaf',92,82,88,68,NULL,0,45,240),
('zipbat','ซิปแบต','bolt',36,42,36,70,'voltbat',15,190,58),
('voltbat','โวลต์แบต','bolt',54,60,52,92,'stormbat',34,120,140),
('stormbat','สตอร์มแบต','bolt',74,82,70,118,NULL,0,45,230),
('pebblo','เพบโบล','earth',46,54,64,24,'boulderon',20,190,60),
('boulderon','บอลเดอรอน','earth',64,76,86,34,'golemaw',38,120,140),
('golemaw','โกเลมอว์','earth',90,100,112,40,NULL,0,45,235),
('wispy','วิสปี','spirit',38,40,40,56,'phantora',18,190,60),
('phantora','แฟนทอร่า','spirit',56,60,56,74,'nightveil',36,120,140),
('nightveil','ไนท์เวล','spirit',72,86,70,102,NULL,0,45,235),
('fluffo','ฟลัฟโฟ','normal',48,44,40,56,'lunabun',18,255,56),
('lunabun','ลูนาบัน','normal',72,66,62,84,NULL,0,120,138),
('fluttr','ฟลัตเตอร์','leaf',40,36,40,60,'mothara',14,255,52),
('mothara','โมทาร่า','leaf',62,64,60,86,NULL,0,120,136),
('shelkrab','เชลคราบ','water',44,56,68,30,'clawdor',22,190,62),
('clawdor','คลอว์ดอร์','water',70,86,100,44,NULL,0,120,142),
('amberon','แอมเบอรอน','fire',100,110,90,100,NULL,0,3,300)
ON CONFLICT(id) DO NOTHING;
CREATE TABLE IF NOT EXISTS public.amberlings_item_catalog(
 id text PRIMARY KEY,name_th text NOT NULL,price_coins int NOT NULL CHECK(price_coins>=0),
 kind text NOT NULL CHECK(kind IN ('orb','medicine','special')), catch_mul numeric(6,3), heal int
);
INSERT INTO public.amberlings_item_catalog(id,name_th,price_coins,kind,catch_mul,heal) VALUES
('orb','ออร์บอำพัน',100,'orb',1,NULL),('silver','ออร์บเงิน',250,'orb',1.5,NULL),
('gold','ออร์บทอง',600,'orb',2.4,NULL),('potion','ยาฟื้นฟู',80,'medicine',NULL,25),
('super','ยาฟื้นฟูพิเศษ',200,'medicine',NULL,70),('hyper','ยาฟื้นฟูสูงสุด',500,'medicine',NULL,160),
('revive','ผลึกชุบชีวิต',800,'medicine',NULL,NULL),('cure','ยาแก้สถานะ',150,'medicine',NULL,NULL),
('candy','ลูกกวาดอำพัน',0,'special',NULL,NULL)
ON CONFLICT(id) DO NOTHING;
CREATE TABLE IF NOT EXISTS public.amberlings_players(
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 name text NOT NULL CHECK(char_length(name) BETWEEN 2 AND 24),
 gender text NOT NULL DEFAULT 'm' CHECK(gender IN ('m','f')),
 uniform_index smallint NOT NULL DEFAULT 0 CHECK(uniform_index BETWEEN 0 AND 3),
 hair_index smallint NOT NULL DEFAULT 0 CHECK(hair_index BETWEEN 0 AND 4),
 skin_index smallint NOT NULL DEFAULT 0 CHECK(skin_index BETWEEN 0 AND 2),
 map_id text NOT NULL DEFAULT 'amberton', x smallint NOT NULL DEFAULT 11,y smallint NOT NULL DEFAULT 9,
 coins int NOT NULL DEFAULT 500 CHECK(coins BETWEEN 0 AND 2000000000),
 gems int NOT NULL DEFAULT 60 CHECK(gems BETWEEN 0 AND 2000000000),
 starter_species text REFERENCES public.amberlings_species(id),
 flags jsonb NOT NULL DEFAULT '{}'::jsonb,
 wins int NOT NULL DEFAULT 0 CHECK(wins>=0),
 captures int NOT NULL DEFAULT 0 CHECK(captures>=0),
 rating int NOT NULL DEFAULT 1000,
 last_explore timestamptz NOT NULL DEFAULT 'epoch',
 last_action timestamptz NOT NULL DEFAULT 'epoch',
 daily_claim date,
 created_at timestamptz NOT NULL DEFAULT now(),
 last_seen timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.amberlings_monsters(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 escrow_listing_id uuid,
 species_id text NOT NULL REFERENCES public.amberlings_species(id),
 level smallint NOT NULL DEFAULT 1 CHECK(level BETWEEN 1 AND 100),
 xp int NOT NULL DEFAULT 1 CHECK(xp>=0),
 hp int NOT NULL DEFAULT 1 CHECK(hp>=0),
 max_hp int NOT NULL DEFAULT 1 CHECK(max_hp>0),
 shiny bool NOT NULL DEFAULT false,
 slot smallint CHECK(slot BETWEEN 1 AND 6),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((owner_id IS NOT NULL AND escrow_listing_id IS NULL) OR (owner_id IS NULL AND escrow_listing_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS amberlings_monsters_owner ON public.amberlings_monsters(owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS amberlings_unique_party_slot ON public.amberlings_monsters(owner_id,slot) WHERE owner_id IS NOT NULL AND slot IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.amberlings_inventory(
 owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 item_id text NOT NULL REFERENCES public.amberlings_item_catalog(id),
 quantity int NOT NULL CHECK(quantity BETWEEN 0 AND 1000000),
 PRIMARY KEY(owner_id,item_id)
);
CREATE TABLE IF NOT EXISTS public.amberlings_encounters(
 owner_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 species_id text NOT NULL REFERENCES public.amberlings_species(id),
 level smallint NOT NULL CHECK(level BETWEEN 1 AND 100),
 hp int NOT NULL CHECK(hp>=0),max_hp int NOT NULL CHECK(max_hp>0),
 turns smallint NOT NULL DEFAULT 0,
 started_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.amberlings_listings(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 buyer_id uuid REFERENCES auth.users(id),
 kind text NOT NULL CHECK(kind IN ('item','monster')),
 item_id text REFERENCES public.amberlings_item_catalog(id),
 monster_id uuid REFERENCES public.amberlings_monsters(id),
 quantity int NOT NULL CHECK(quantity BETWEEN 1 AND 99),
 price_each int NOT NULL CHECK(price_each BETWEEN 1 AND 100000000),
 currency text NOT NULL DEFAULT 'coins' CHECK(currency IN ('coins','gems')),
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','sold','cancelled')),
 created_at timestamptz NOT NULL DEFAULT now(),
 closed_at timestamptz,
 CHECK ((kind='monster' AND monster_id IS NOT NULL AND item_id IS NULL AND quantity=1)
    OR (kind='item' AND item_id IS NOT NULL AND monster_id IS NULL))
);
CREATE INDEX IF NOT EXISTS amberlings_market_status ON public.amberlings_listings(status,created_at DESC);
CREATE INDEX IF NOT EXISTS amberlings_market_seller ON public.amberlings_listings(seller_id,status);
CREATE TABLE IF NOT EXISTS public.amberlings_events(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 type text NOT NULL,details jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS amberlings_events_user_at ON public.amberlings_events(actor_id,created_at DESC);
-- RLS defense-in-depth; no browser writes. Access to account state ONLY via private server action.
ALTER TABLE public.amberlings_species ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amberlings_item_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amberlings_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amberlings_monsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amberlings_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amberlings_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amberlings_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amberlings_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.amberlings_species,public.amberlings_item_catalog,public.amberlings_players,
 public.amberlings_monsters,public.amberlings_inventory,public.amberlings_encounters,
 public.amberlings_listings,public.amberlings_events FROM PUBLIC,anon,authenticated;
-- No direct browser SELECT either, except through the authenticated server endpoint's filtered response.
COMMIT;