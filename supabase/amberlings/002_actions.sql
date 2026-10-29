-- Synced from active Supabase project amber-world-class. Apply only to this project.
CREATE OR REPLACE FUNCTION public.amberlings_action(p_uid uuid, p_action text, p_args jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
 me public.amberlings_players%ROWTYPE; seller public.amberlings_players%ROWTYPE;
 wild public.amberlings_encounters%ROWTYPE; mine public.amberlings_monsters%ROWTYPE;
 specie public.amberlings_species%ROWTYPE; other_sp public.amberlings_species%ROWTYPE;
 listing public.amberlings_listings%ROWTYPE; cat public.amberlings_item_catalog%ROWTYPE;
 chosen text; item text; action_message text:=''; new_player uuid; m_id uuid; listing_id uuid;
 amount int; price int; amount_due bigint; reward int; dmg int; retaliate int; limit_count int;
 slot_no int; lvl int; mx int; mov int; current_items int; current_money int; target int;
 chance numeric; success boolean:=false; rarity_roll numeric; day_now date;
 monsters jsonb;inventory jsonb; encounter_json jsonb; listings jsonb; ranking jsonb;
BEGIN
 IF p_uid IS NULL OR jsonb_typeof(p_args) IS DISTINCT FROM 'object'
   OR p_action NOT IN ('bootstrap','state','profile','starter','explore','attack','capture','flee',
                       'use_item','shop_buy','party','evolve','daily','travel','market_list',
                       'market_buy','market_cancel')
 THEN RETURN jsonb_build_object('ok',false,'error','Invalid action');END IF;

 IF p_action='bootstrap' THEN
  INSERT INTO public.amberlings_players(user_id,name) VALUES(p_uid,'เทรนเนอร์-'||left(p_uid::text,6))
  ON CONFLICT(user_id) DO NOTHING RETURNING user_id INTO new_player;
  IF new_player IS NOT NULL THEN
   INSERT INTO public.amberlings_inventory(owner_id,item_id,quantity)
   VALUES(p_uid,'orb',5),(p_uid,'potion',3);
   INSERT INTO public.amberlings_events(actor_id,type) VALUES(p_uid,'account_created');
  END IF;
 END IF;
 IF p_action = 'market_buy' THEN
      SELECT * INTO me FROM public.amberlings_players WHERE user_id=p_uid;
    ELSE
      SELECT * INTO me FROM public.amberlings_players WHERE user_id=p_uid FOR UPDATE;
    END IF;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Sign in first');END IF;

 IF p_action='profile' THEN
  chosen:=trim(coalesce(p_args->>'name',''));
  IF char_length(chosen)<2 OR char_length(chosen)>20 OR chosen !~ '^[[:alnum:]ก-๙ _-]+$'
  THEN RETURN jsonb_build_object('ok',false,'error','Invalid character name');END IF;
  BEGIN
   amount=(p_args->>'uniform')::int;target=(p_args->>'hair')::int;slot_no=(p_args->>'skin')::int;
  EXCEPTION WHEN others THEN RETURN jsonb_build_object('ok',false,'error','Invalid avatar'); END;
  IF amount NOT BETWEEN 0 AND 3 OR target NOT BETWEEN 0 AND 4 OR slot_no NOT BETWEEN 0 AND 2
    OR p_args->>'gender' NOT IN ('m','f')
  THEN RETURN jsonb_build_object('ok',false,'error','Invalid avatar');END IF;
  UPDATE public.amberlings_players SET name=chosen,gender=p_args->>'gender',
    uniform_index=amount,hair_index=target,skin_index=slot_no WHERE user_id=p_uid;
  action_message:='บันทึกข้อมูลตัวละครแล้ว';

 ELSIF p_action='starter' THEN
  chosen:=p_args->>'speciesId';
  IF chosen NOT IN ('embit','aquip','sproutle') OR me.starter_species IS NOT NULL
  THEN RETURN jsonb_build_object('ok',false,'error','Starter already selected or invalid');END IF;
  SELECT * INTO specie FROM public.amberlings_species WHERE id=chosen;
  lvl:=5;mx:=floor(specie.base_hp*2*lvl/100)+lvl+10;
  UPDATE public.amberlings_players SET starter_species=chosen WHERE user_id=p_uid;
  INSERT INTO public.amberlings_monsters(owner_id,species_id,level,xp,hp,max_hp,slot)
    VALUES(p_uid,chosen,lvl,lvl*lvl*lvl,mx,mx,1);
  INSERT INTO public.amberlings_events(actor_id,type,details)
    VALUES(p_uid,'starter',jsonb_build_object('speciesId',chosen));
  action_message:='ได้รับคู่หูตัวแรก '||specie.name_th;

 ELSIF p_action='explore' THEN
  IF me.starter_species IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Choose starter first');END IF;
  IF now()-me.last_explore<interval '1.5 seconds' THEN
    RETURN jsonb_build_object('ok',false,'error','Exploration cooldown');END IF;
  IF EXISTS(SELECT 1 FROM public.amberlings_encounters WHERE owner_id=p_uid) THEN
    RETURN jsonb_build_object('ok',false,'error','Finish the current encounter');END IF;
  -- Species and levels are server-selected. Client cannot nominate a rare monster.
  SELECT id INTO chosen FROM public.amberlings_species
  WHERE id<>'amberon' AND (me.map_id NOT IN ('amberton','route1') OR id NOT IN ('infernox','leviathor','florabeast'))
  ORDER BY random() LIMIT 1;
  IF chosen IS NULL THEN RETURN jsonb_build_object('ok',false,'error','No wild species');END IF;
  SELECT * INTO specie FROM public.amberlings_species WHERE id=chosen;
  lvl:=greatest(2,least(70,(CASE WHEN me.map_id='amberton' THEN 0 WHEN me.map_id='route1' THEN 1
         WHEN me.map_id='mossgate' THEN 2 WHEN me.map_id='route2' THEN 3 ELSE 4 END)*6
         + floor(random()*6)::int +2));
  mx:=floor(specie.base_hp*2*lvl/100)+lvl+10;
  INSERT INTO public.amberlings_encounters(owner_id,species_id,level,hp,max_hp)
    VALUES(p_uid,chosen,lvl,mx,mx);
  UPDATE public.amberlings_players SET last_explore=now() WHERE user_id=p_uid;
  action_message:='พบสัตว์ป่า '||specie.name_th||' Lv.'||lvl;

 ELSIF p_action='flee' THEN
  DELETE FROM public.amberlings_encounters WHERE owner_id=p_uid;
  action_message:='หนีออกจากการต่อสู้แล้ว';

 ELSIF p_action IN ('attack','capture') THEN
  SELECT * INTO wild FROM public.amberlings_encounters WHERE owner_id=p_uid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','No wild encounter');END IF;
  SELECT * INTO mine FROM public.amberlings_monsters
   WHERE owner_id=p_uid AND slot IS NOT NULL AND hp>0 ORDER BY slot LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Your team has fainted');END IF;
  SELECT * INTO specie FROM public.amberlings_species WHERE id=wild.species_id;
  SELECT * INTO other_sp FROM public.amberlings_species WHERE id=mine.species_id;
  IF p_action='attack' THEN
   BEGIN mov=(p_args->>'move')::int;EXCEPTION WHEN others THEN mov:=-1;END;
   IF mov NOT BETWEEN 0 AND 3 THEN RETURN jsonb_build_object('ok',false,'error','Invalid move');END IF;
   IF now()-me.last_action<interval '.35 seconds' THEN RETURN jsonb_build_object('ok',false,'error','Attack cooldown');END IF;
   dmg:=greatest(1,floor((other_sp.base_atk*2*mine.level/100+5)*(0.72+mov*.19)*(0.9+random()*.2)
     -(specie.base_def*2*wild.level/100+5)*.18)::int);
   UPDATE public.amberlings_players SET last_action=now() WHERE user_id=p_uid;
   IF dmg>=wild.hp THEN
    reward:=wild.level*12+25;lvl:=mine.level;
    IF lvl<100 AND mine.xp+reward>=(lvl+1)*(lvl+1)*(lvl+1) THEN lvl:=lvl+1;END IF;
    mx:=floor(other_sp.base_hp*2*lvl/100)+lvl+10;
    UPDATE public.amberlings_monsters SET level=lvl,
       xp=mine.xp+reward,hp=least(mx,mine.hp+(mx-mine.max_hp)+4),max_hp=mx WHERE id=mine.id;
    UPDATE public.amberlings_players SET coins=coins+wild.level*12+30,wins=wins+1 WHERE user_id=p_uid;
    DELETE FROM public.amberlings_encounters WHERE owner_id=p_uid;
    INSERT INTO public.amberlings_events(actor_id,type,details)
    VALUES(p_uid,'battle_win',jsonb_build_object('speciesId',specie.id,'coins',wild.level*12+30));
    action_message:='ชนะ! ทำดาเมจ '||dmg||' ได้ EXP +'||reward;
   ELSE
    UPDATE public.amberlings_encounters SET hp=hp-dmg,turns=turns+1 WHERE owner_id=p_uid;
    retaliate:=greatest(1,floor((specie.base_atk*2*wild.level/100+5)*(.22+random()*.2))::int);
    UPDATE public.amberlings_monsters SET hp=greatest(0,hp-retaliate) WHERE id=mine.id;
    action_message:='โจมตี '||dmg||' ดาเมจ · ถูกสวนกลับ -'||retaliate||' HP';
   END IF;
  ELSE
   item:=coalesce(p_args->>'orb','orb');
   SELECT * INTO cat FROM public.amberlings_item_catalog WHERE id=item AND kind='orb';
   IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Invalid capture orb');END IF;
   UPDATE public.amberlings_inventory SET quantity=quantity-1
    WHERE owner_id=p_uid AND item_id=item AND quantity>0 RETURNING quantity INTO current_items;
   IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','No orbs');END IF;
   SELECT count(*) INTO limit_count FROM public.amberlings_monsters WHERE owner_id=p_uid;
   IF limit_count>=250 THEN RETURN jsonb_build_object('ok',false,'error','Creature storage is full');END IF;
   chance:=least(.92,greatest(.01,((3*wild.max_hp-2*wild.hp)::numeric*specie.catch_rate
               *cat.catch_mul)/(3*wild.max_hp*255)));
   success:=random()<chance;
   IF success THEN
    SELECT i INTO slot_no FROM generate_series(1,6) i WHERE NOT EXISTS(
      SELECT 1 FROM public.amberlings_monsters WHERE owner_id=p_uid AND slot=i) ORDER BY i LIMIT 1;
    INSERT INTO public.amberlings_monsters(owner_id,species_id,level,xp,hp,max_hp,shiny,slot)
      VALUES(p_uid,specie.id,wild.level,wild.level*wild.level*wild.level,wild.hp,wild.max_hp,
             (random()<.015625),slot_no);
    DELETE FROM public.amberlings_encounters WHERE owner_id=p_uid;
    UPDATE public.amberlings_players SET captures=captures+1 WHERE user_id=p_uid;
    INSERT INTO public.amberlings_events(actor_id,type,details)
      VALUES(p_uid,'capture',jsonb_build_object('speciesId',specie.id,'level',wild.level));
    action_message:='จับ '||specie.name_th||' สำเร็จ!';
   ELSE
    retaliate:=greatest(1,floor((specie.base_atk*2*wild.level/100+5)*(.17+random()*.2))::int);
    UPDATE public.amberlings_monsters SET hp=greatest(0,hp-retaliate) WHERE id=mine.id;
    UPDATE public.amberlings_encounters SET turns=turns+1 WHERE owner_id=p_uid;
    action_message:='จับไม่สำเร็จ · ถูกสวนกลับ -'||retaliate||' HP';
   END IF;
  END IF;

 ELSIF p_action='shop_buy' THEN
  item:=p_args->>'item';BEGIN amount=(p_args->>'qty')::int;EXCEPTION WHEN others THEN amount:=NULL;END;
  SELECT * INTO cat FROM public.amberlings_item_catalog WHERE id=item AND price_coins>0;
  IF NOT FOUND OR amount IS NULL OR amount NOT BETWEEN 1 AND 25
  THEN RETURN jsonb_build_object('ok',false,'error','Invalid shop order');END IF;
  amount_due:=amount::bigint*cat.price_coins;
  IF me.coins<amount_due THEN RETURN jsonb_build_object('ok',false,'error','Not enough coins');END IF;
  UPDATE public.amberlings_players SET coins=coins-amount_due WHERE user_id=p_uid;
  INSERT INTO public.amberlings_inventory(owner_id,item_id,quantity) VALUES(p_uid,item,amount)
     ON CONFLICT(owner_id,item_id) DO UPDATE SET quantity=amberlings_inventory.quantity+excluded.quantity;
  INSERT INTO public.amberlings_events(actor_id,type,details)
    VALUES(p_uid,'shop_buy',jsonb_build_object('item',item,'qty',amount,'coins',amount_due));
  action_message:='ซื้อไอเทมสำเร็จ';

 ELSIF p_action='use_item' THEN
  item:=p_args->>'item';
  SELECT * INTO cat FROM public.amberlings_item_catalog WHERE id=item AND kind='medicine';
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Invalid item');END IF;
  BEGIN m_id=(p_args->>'monsterId')::uuid;EXCEPTION WHEN others THEN m_id:=NULL;END;
  SELECT * INTO mine FROM public.amberlings_monsters WHERE id=m_id AND owner_id=p_uid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Not your monster');END IF;
  IF item IN ('potion','super','hyper') AND (mine.hp<=0 OR mine.hp>=mine.max_hp)
   THEN RETURN jsonb_build_object('ok',false,'error','Cannot heal this creature');END IF;
  IF item='revive' AND mine.hp>0 THEN RETURN jsonb_build_object('ok',false,'error','Not fainted');END IF;
  IF item='cure' THEN RETURN jsonb_build_object('ok',false,'error','No status effect to cure');END IF;
  UPDATE public.amberlings_inventory SET quantity=quantity-1
    WHERE owner_id=p_uid AND item_id=item AND quantity>0 RETURNING quantity INTO current_items;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Item unavailable');END IF;
  IF item='revive' THEN UPDATE public.amberlings_monsters SET hp=ceil(max_hp/2.0) WHERE id=m_id;
  ELSE UPDATE public.amberlings_monsters SET hp=least(max_hp,hp+cat.heal) WHERE id=m_id;END IF;
  action_message:='ใช้ไอเทมสำเร็จ';

 ELSIF p_action='party' THEN
  BEGIN m_id=(p_args->>'monsterId')::uuid;slot_no=(p_args->>'slot')::int;
  EXCEPTION WHEN others THEN RETURN jsonb_build_object('ok',false,'error','Invalid party request');END;
  IF slot_no NOT BETWEEN 0 AND 6 THEN RETURN jsonb_build_object('ok',false,'error','Invalid party slot');END IF;
  SELECT * INTO mine FROM public.amberlings_monsters WHERE id=m_id AND owner_id=p_uid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Not your monster');END IF;
  IF slot_no>0 THEN UPDATE public.amberlings_monsters SET slot=NULL WHERE owner_id=p_uid AND slot=slot_no AND id<>m_id;END IF;
  UPDATE public.amberlings_monsters SET slot=CASE WHEN slot_no=0 THEN NULL ELSE slot_no END WHERE id=m_id;
  action_message:='จัดทีมเรียบร้อย';

 ELSIF p_action='evolve' THEN
  BEGIN m_id=(p_args->>'monsterId')::uuid;EXCEPTION WHEN others THEN m_id:=NULL;END;
  SELECT * INTO mine FROM public.amberlings_monsters WHERE id=m_id AND owner_id=p_uid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Not your monster');END IF;
  SELECT * INTO specie FROM public.amberlings_species WHERE id=mine.species_id;
  IF specie.evolve_to IS NULL OR mine.level<specie.evolve_level
  THEN RETURN jsonb_build_object('ok',false,'error','Evolution level not reached');END IF;
  SELECT * INTO other_sp FROM public.amberlings_species WHERE id=specie.evolve_to;
  mx:=floor(other_sp.base_hp*2*mine.level/100)+mine.level+10;
  UPDATE public.amberlings_monsters SET species_id=other_sp.id,
    max_hp=mx,hp=mx WHERE id=m_id;
  INSERT INTO public.amberlings_events(actor_id,type,details)
   VALUES(p_uid,'evolve',jsonb_build_object('from',specie.id,'to',other_sp.id));
  action_message:='วิวัฒนาการเป็น '||other_sp.name_th||' แล้ว';

 ELSIF p_action='daily' THEN
  day_now:=(now() AT TIME ZONE 'Asia/Bangkok')::date;
  IF me.daily_claim=day_now THEN RETURN jsonb_build_object('ok',false,'error','Daily gift already claimed');END IF;
  UPDATE public.amberlings_players SET daily_claim=day_now,coins=coins+250,gems=gems+5 WHERE user_id=p_uid;
  INSERT INTO public.amberlings_inventory(owner_id,item_id,quantity) VALUES(p_uid,'orb',5)
    ON CONFLICT(owner_id,item_id) DO UPDATE SET quantity=amberlings_inventory.quantity+excluded.quantity;
  action_message:='รางวัลรายวัน +250 เหรียญ +5 เจม +5 ออร์บ';

 ELSIF p_action='travel' THEN
  chosen:=p_args->>'mapId';
  IF chosen NOT IN ('amberton','lab','mart','center','route1','mossgate','route2','tidehaven',
                    'route3','gym1','gym2','gym3','cave','mountain')
  THEN RETURN jsonb_build_object('ok',false,'error','Unknown destination');END IF;
  IF chosen NOT IN ('amberton','lab','mart','center','route1') AND
    (SELECT coalesce(max(level),0) FROM public.amberlings_monsters WHERE owner_id=p_uid)<12
  THEN RETURN jsonb_build_object('ok',false,'error','Train a level 12 creature first');END IF;
  UPDATE public.amberlings_players SET map_id=chosen,x=11,y=9 WHERE user_id=p_uid;
  DELETE FROM public.amberlings_encounters WHERE owner_id=p_uid;
  action_message:='เดินทางสำเร็จ';

 ELSIF p_action='market_list' THEN
  IF me.starter_species IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Select starter');END IF;
  BEGIN amount=(p_args->>'qty')::int;price=(p_args->>'price')::int;
  EXCEPTION WHEN others THEN RETURN jsonb_build_object('ok',false,'error','Invalid listing');END;
  IF amount NOT BETWEEN 1 AND 99 OR price NOT BETWEEN 1 AND 100000000
     OR p_args->>'currency' NOT IN ('coins','gems')
  THEN RETURN jsonb_build_object('ok',false,'error','Invalid listing terms');END IF;
  IF (SELECT count(*) FROM public.amberlings_listings WHERE seller_id=p_uid AND status='open')>=20
  THEN RETURN jsonb_build_object('ok',false,'error','Max 20 active listings');END IF;
  IF p_args->>'kind'='item' THEN
   item:=p_args->>'item';
   IF NOT EXISTS(SELECT 1 FROM public.amberlings_item_catalog WHERE id=item)
   THEN RETURN jsonb_build_object('ok',false,'error','Invalid item');END IF;
   UPDATE public.amberlings_inventory SET quantity=quantity-amount
     WHERE owner_id=p_uid AND item_id=item AND quantity>=amount RETURNING quantity INTO current_items;
   IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Insufficient items');END IF;
   INSERT INTO public.amberlings_listings(seller_id,kind,item_id,quantity,price_each,currency)
     VALUES(p_uid,'item',item,amount,price,p_args->>'currency');
  ELSIF p_args->>'kind'='monster' THEN
   BEGIN m_id=(p_args->>'monsterId')::uuid;EXCEPTION WHEN others THEN m_id:=NULL;END;
   IF amount<>1 THEN RETURN jsonb_build_object('ok',false,'error','Monster quantity must be one');END IF;
   SELECT * INTO mine FROM public.amberlings_monsters WHERE id=m_id AND owner_id=p_uid FOR UPDATE;
   IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Not your monster');END IF;
   IF (SELECT count(*) FROM public.amberlings_monsters WHERE owner_id=p_uid)<=1
   THEN RETURN jsonb_build_object('ok',false,'error','Keep at least one monster');END IF;
   INSERT INTO public.amberlings_listings(seller_id,kind,monster_id,quantity,price_each,currency)
     VALUES(p_uid,'monster',m_id,1,price,p_args->>'currency') RETURNING id INTO listing_id;
   UPDATE public.amberlings_monsters SET owner_id=NULL,slot=NULL,escrow_listing_id=listing_id WHERE id=m_id;
  ELSE RETURN jsonb_build_object('ok',false,'error','Invalid listing type');END IF;
  INSERT INTO public.amberlings_events(actor_id,type) VALUES(p_uid,'market_list');
  action_message:='ฝากขายเข้าตลาดแล้ว';

 ELSIF p_action IN ('market_buy','market_cancel') THEN
  BEGIN listing_id=(p_args->>'listingId')::uuid;EXCEPTION WHEN others THEN listing_id:=NULL;END;
  -- Read seller id before accounts lock, then lock accounts in ID order to avoid deadlock.
  SELECT seller_id INTO new_player FROM public.amberlings_listings WHERE id=listing_id;
  IF new_player IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Listing not found');END IF;
  PERFORM 1 FROM public.amberlings_players WHERE user_id IN (p_uid,new_player) ORDER BY user_id FOR UPDATE;
  SELECT * INTO listing FROM public.amberlings_listings WHERE id=listing_id FOR UPDATE;
  IF NOT FOUND OR listing.status<>'open' THEN RETURN jsonb_build_object('ok',false,'error','Listing unavailable');END IF;
  IF p_action='market_cancel' THEN
   IF listing.seller_id<>p_uid THEN RETURN jsonb_build_object('ok',false,'error','Only seller may cancel');END IF;
   IF listing.kind='item' THEN
    INSERT INTO public.amberlings_inventory(owner_id,item_id,quantity)
     VALUES(p_uid,listing.item_id,listing.quantity)
     ON CONFLICT(owner_id,item_id) DO UPDATE SET quantity=amberlings_inventory.quantity+excluded.quantity;
   ELSE
    UPDATE public.amberlings_monsters SET owner_id=p_uid,escrow_listing_id=NULL WHERE id=listing.monster_id AND escrow_listing_id=listing.id;
   END IF;
   UPDATE public.amberlings_listings SET status='cancelled',closed_at=now() WHERE id=listing.id;
   action_message:='ยกเลิกและรับของคืนแล้ว';
  ELSE
   IF listing.seller_id=p_uid THEN RETURN jsonb_build_object('ok',false,'error','Cannot buy own listing');END IF;
   SELECT * INTO me FROM public.amberlings_players WHERE user_id=p_uid;
   amount_due:=listing.quantity::bigint*listing.price_each;
   IF amount_due>2000000000 THEN RETURN jsonb_build_object('ok',false,'error','Listing too expensive');END IF;
   IF listing.currency='coins' AND me.coins<amount_due OR
      listing.currency='gems' AND me.gems<amount_due
   THEN RETURN jsonb_build_object('ok',false,'error','Insufficient funds');END IF;
   SELECT * INTO seller FROM public.amberlings_players WHERE user_id=listing.seller_id;
   IF listing.kind='monster' THEN
    IF (SELECT count(*) FROM public.amberlings_monsters WHERE owner_id=p_uid)>=250
    THEN RETURN jsonb_build_object('ok',false,'error','Monster storage full');END IF;
   END IF;
   IF listing.currency='coins' THEN
    UPDATE public.amberlings_players SET coins=coins-amount_due WHERE user_id=p_uid;
    UPDATE public.amberlings_players SET coins=coins+floor(amount_due*.95)::int WHERE user_id=listing.seller_id;
   ELSE
    UPDATE public.amberlings_players SET gems=gems-amount_due WHERE user_id=p_uid;
    UPDATE public.amberlings_players SET gems=gems+floor(amount_due*.95)::int WHERE user_id=listing.seller_id;
   END IF;
   IF listing.kind='item' THEN
    INSERT INTO public.amberlings_inventory(owner_id,item_id,quantity)
     VALUES(p_uid,listing.item_id,listing.quantity)
     ON CONFLICT(owner_id,item_id) DO UPDATE SET quantity=amberlings_inventory.quantity+excluded.quantity;
   ELSE
    SELECT i INTO slot_no FROM generate_series(1,6) i WHERE NOT EXISTS(
     SELECT 1 FROM public.amberlings_monsters WHERE owner_id=p_uid AND slot=i) ORDER BY i LIMIT 1;
    UPDATE public.amberlings_monsters SET owner_id=p_uid,escrow_listing_id=NULL,slot=slot_no
     WHERE id=listing.monster_id AND escrow_listing_id=listing.id;
   END IF;
   UPDATE public.amberlings_listings SET status='sold',buyer_id=p_uid,closed_at=now() WHERE id=listing.id;
   INSERT INTO public.amberlings_events(actor_id,type,details) VALUES
    (p_uid,'market_buy',jsonb_build_object('listingId',listing.id,'price',amount_due)),
    (listing.seller_id,'market_sold',jsonb_build_object('listingId',listing.id,'received',floor(amount_due*.95)::int));
   action_message:='ซื้อขายสำเร็จ · ระบบหักค่าตลาด 5%';
  END IF;
 END IF;

 IF p_action='state' THEN
  UPDATE public.amberlings_players SET last_seen=now()
   WHERE user_id=p_uid AND last_seen<now()-interval '25 seconds';
 END IF;
 SELECT * INTO me FROM public.amberlings_players WHERE user_id=p_uid;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',m.id,'speciesId',m.species_id,'name',s.name_th,
    'level',m.level,'xp',m.xp,'hp',m.hp,'maxHp',m.max_hp,'shiny',m.shiny,'slot',m.slot,'skinIndex',m.skin_index,
    'element',s.element,'evolveTo',s.evolve_to,'evolveLevel',s.evolve_level)
    ORDER BY m.slot NULLS LAST,m.created_at),'[]'::jsonb)
 INTO monsters FROM public.amberlings_monsters m JOIN public.amberlings_species s ON s.id=m.species_id
 WHERE m.owner_id=p_uid;
 SELECT coalesce(jsonb_agg(jsonb_build_object('item',i.item_id,'name',c.name_th,'qty',i.quantity)
      ORDER BY i.item_id),'[]'::jsonb)
 INTO inventory FROM public.amberlings_inventory i JOIN public.amberlings_item_catalog c ON c.id=i.item_id
 WHERE i.owner_id=p_uid AND i.quantity>0;
 SELECT jsonb_build_object('speciesId',w.species_id,'name',s.name_th,'level',w.level,
      'hp',w.hp,'maxHp',w.max_hp,'turns',w.turns)
 INTO encounter_json FROM public.amberlings_encounters w JOIN public.amberlings_species s ON s.id=w.species_id
 WHERE w.owner_id=p_uid;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',l.id,'who',p.name,'mine',l.seller_id=p_uid,
      'kind',l.kind,'item',l.item_id,'monster',CASE WHEN l.kind='monster' THEN
         jsonb_build_object('speciesId',m.species_id,'level',m.level,'shiny',m.shiny) ELSE NULL END,
      'qty',l.quantity,'price',l.price_each,'currency',l.currency)
      ORDER BY l.created_at DESC),'[]'::jsonb)
 INTO listings FROM (SELECT * FROM public.amberlings_listings WHERE status='open' ORDER BY created_at DESC LIMIT 60) l
 JOIN public.amberlings_players p ON p.user_id=l.seller_id
 LEFT JOIN public.amberlings_monsters m ON m.id=l.monster_id;
 SELECT coalesce(jsonb_agg(jsonb_build_object('name',name,'wins',wins,
      'captures',captures,'rating',rating,'online',last_seen>now()-interval '100 seconds')
       ORDER BY rating DESC,wins DESC),'[]'::jsonb)
 INTO ranking FROM (SELECT name,wins,captures,rating,last_seen FROM public.amberlings_players
        ORDER BY rating DESC,wins DESC LIMIT 15) r;
 RETURN jsonb_build_object('ok',true,'message',action_message,
   'player',jsonb_build_object('name',me.name,'gender',me.gender,'uniform',me.uniform_index,
      'hair',me.hair_index,'skin',me.skin_index,'equipped',me.equipped,'mapId',me.map_id,
      'coins',me.coins,'gems',me.gems,'starter',me.starter_species,'captures',me.captures,
      'wins',me.wins,'rating',me.rating,'dailyClaim',me.daily_claim),
   'shop',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',it.id,'name',it.name_th,'price',it.price_coins,'kind',it.kind) ORDER BY it.price_coins,it.id),'[]'::jsonb) FROM public.amberlings_item_catalog it WHERE it.price_coins>0),'species',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',sp.id,'name',sp.name_th,'element',sp.element,'evolveTo',sp.evolve_to,'evolveLevel',sp.evolve_level) ORDER BY sp.id),'[]'::jsonb) FROM public.amberlings_species sp),'monsters',monsters,'inventory',inventory,'encounter',encounter_json,
   'listings',listings,'leaderboard',ranking,'cosmetics',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',ci.id,'name',ci.name_th,'kind',ci.kind,'price',ci.price_gems,'slot',ci.slot) ORDER BY ci.kind,ci.id),'[]'::jsonb) FROM public.amberlings_item_catalog ci WHERE ci.kind IN ('cosmetic','skin') AND ci.price_gems>0),'captureSuccess',success);
END;
$function$
REVOKE ALL ON FUNCTION public.amberlings_action(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.amberlings_action(uuid,text,jsonb) TO service_role;
