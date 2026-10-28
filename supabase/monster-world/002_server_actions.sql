-- AMBER PETS / MONSTER WORLD ONLINE -- independent game data from AMBER WORLD CLASS.
-- Requires the five awc_pet_* tables and 100-species seed in 001_schema.sql.
CREATE OR REPLACE FUNCTION public.awc_pet_action(p_uid uuid, p_action text, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
 p public.awc_pet_players%ROWTYPE;
 w public.awc_pet_encounters%ROWTYPE;
 own public.awc_pet_owned%ROWTYPE;
 sp public.awc_pet_species%ROWTYPE;
 lead public.awc_pet_owned%ROWTYPE;
 own_count int; team_count int; target int; amount int; chosen int; new_level int;
 x text; d int; response_text text:=''; caught boolean:=false; evolve_to int;
 xp_award int; coin_award int; chance numeric; min_level int;
 other_id bigint; now_ts timestamptz:=clock_timestamp();
 roster jsonb; active_wild jsonb; leaders jsonb; species_catalog jsonb; journal jsonb;
BEGIN
 IF p_uid IS NULL OR p_action NOT IN ('login','state','starter','explore','flee','attack','capture','evolve','team','area','shop','heal','daily','rename')
    OR p_payload IS NULL OR jsonb_typeof(p_payload)<>'object'
 THEN RETURN jsonb_build_object('ok',false,'error','Invalid action'); END IF;
 IF p_action='login' THEN
  INSERT INTO public.awc_pet_players(user_id,name) VALUES(p_uid,'Trainer-'||left(p_uid::text,5)) ON CONFLICT(user_id) DO NOTHING;
 END IF;
 SELECT * INTO p FROM public.awc_pet_players WHERE user_id=p_uid FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Please sign in first');END IF;
 SELECT count(*) INTO own_count FROM public.awc_pet_owned WHERE user_id=p_uid;
 IF own_count=0 AND p_action NOT IN ('login','state','starter') THEN
  RETURN jsonb_build_object('ok',false,'error','Choose a starter first');
 END IF;
 IF p_action='starter' THEN
  BEGIN chosen=(p_payload->>'speciesId')::int;EXCEPTION WHEN others THEN chosen:=NULL;END;
  IF chosen NOT IN (1,5,9) OR chosen IS NULL OR own_count>0 THEN
   RETURN jsonb_build_object('ok',false,'error','Starter already chosen or invalid');END IF;
  SELECT * INTO sp FROM public.awc_pet_species WHERE id=chosen;
  INSERT INTO public.awc_pet_owned(user_id,species_id,level,hp,max_hp,slot)
    VALUES(p_uid,chosen,5,sp.base_hp+5*3,sp.base_hp+5*3,1);
  response_text='ได้รับสัตว์เริ่มต้น '||sp.name_th;
 ELSIF p_action='explore' THEN
  IF extract(epoch FROM now_ts-p.last_explore)<1.4 THEN RETURN jsonb_build_object('ok',false,'error','กำลังพักจากการสำรวจ'); END IF;
  IF EXISTS(SELECT 1 FROM public.awc_pet_encounters WHERE user_id=p_uid) THEN
   RETURN jsonb_build_object('ok',false,'error','ต้องจับ ต่อสู้ หรือหนีก่อน');END IF;
  -- Map controls range; server selects species, level, HP and rarity.
  chosen:= ((p.area*3+floor(random()*5)::int)%25)*4+1;
  IF random()<0.07 THEN chosen:= (20+floor(random()*5)::int)*4+1;END IF;
  IF p.area>3 AND random()<0.30 THEN chosen:=chosen+1;END IF;
  IF p.area>6 AND random()<0.24 THEN chosen:=least(chosen+1,((chosen-1)/4)*4+4);END IF;
  SELECT * INTO sp FROM public.awc_pet_species WHERE id=chosen;
  new_level:=greatest(1,p.area*6+floor(random()*7)::int+2);
  INSERT INTO public.awc_pet_encounters(user_id,species_id,level,hp,max_hp,turns)
    VALUES(p_uid,chosen,new_level,sp.base_hp+new_level*3,sp.base_hp+new_level*3,0);
  UPDATE public.awc_pet_players SET last_explore=now_ts WHERE user_id=p_uid;
  response_text='พบสัตว์ป่า '||sp.name_th||' Lv.'||new_level;
 ELSIF p_action='flee' THEN
  DELETE FROM public.awc_pet_encounters WHERE user_id=p_uid;
  response_text='หนีจากการต่อสู้แล้ว';
 ELSIF p_action IN ('attack','capture') THEN
  SELECT * INTO w FROM public.awc_pet_encounters WHERE user_id=p_uid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','ไม่มีสัตว์ป่าให้ต่อสู้');END IF;
  SELECT * INTO lead FROM public.awc_pet_owned WHERE user_id=p_uid AND slot IS NOT NULL AND hp>0 ORDER BY slot LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','สัตว์ในทีมหมดแรง ต้องใช้ยาฟื้นฟู');END IF;
  SELECT * INTO sp FROM public.awc_pet_species WHERE id=w.species_id;
  IF p_action='attack' THEN
   IF extract(epoch FROM now_ts-p.last_action)<0.36 THEN RETURN jsonb_build_object('ok',false,'error','รอคูลดาวน์');END IF;
   BEGIN chosen=(p_payload->>'move')::int; EXCEPTION WHEN others THEN chosen:=0; END;
   IF chosen IS NULL OR chosen<0 OR chosen>3 THEN RETURN jsonb_build_object('ok',false,'error','Invalid move');END IF;
   SELECT base_atk INTO amount FROM public.awc_pet_species WHERE id=lead.species_id;
   d:=greatest(1,floor((amount+lead.level*2)*(0.7+chosen*.19)*(0.86+random()*.30)-sp.base_def*.22)::int);
   UPDATE public.awc_pet_encounters SET hp=greatest(0,hp-d),turns=turns+1 WHERE user_id=p_uid;
   UPDATE public.awc_pet_players SET last_action=now_ts WHERE user_id=p_uid;
   response_text='โจมตี '||d||' ดาเมจ';
   IF w.hp<=d THEN
     xp_award:=w.level*16+60;coin_award:=w.level*9+30;
     UPDATE public.awc_pet_owned SET exp=exp+xp_award WHERE id=lead.id;
     SELECT * INTO own FROM public.awc_pet_owned WHERE id=lead.id;
     IF own.exp>=own.level*30 AND own.level<80 THEN
      UPDATE public.awc_pet_owned SET exp=0,level=level+1,max_hp=max_hp+4,hp=least(max_hp+4,hp+4) WHERE id=lead.id;
      response_text:=response_text||' · LEVEL UP!';
     END IF;
     UPDATE public.awc_pet_players SET wins=wins+1,coins=coins+coin_award,xp=xp+xp_award WHERE user_id=p_uid;
     DELETE FROM public.awc_pet_encounters WHERE user_id=p_uid;
     response_text:=response_text||' ชนะ! +'||xp_award||' EXP +'||coin_award||' Gold';
   ELSE
     d:=greatest(1,floor((sp.base_atk+w.level*2)*(.16+random()*.2)-3)::int);
     UPDATE public.awc_pet_owned SET hp=greatest(0,hp-d) WHERE id=lead.id;
     response_text:=response_text||' · ถูกสวนกลับ -'||d||' HP';
   END IF;
  ELSE
   IF p.balls<=0 THEN RETURN jsonb_build_object('ok',false,'error','ลูกบอลจับสัตว์หมด');END IF;
   SELECT count(*) INTO amount FROM public.awc_pet_owned WHERE user_id=p_uid;
   IF amount>=300 THEN RETURN jsonb_build_object('ok',false,'error','คลังสัตว์เต็ม 300');END IF;
   chance:=least(.92,sp.catch_base*(1.6-(w.hp::numeric/greatest(1,w.max_hp)))*(.9+random()*.2));
   caught:=random()<chance;
   UPDATE public.awc_pet_players SET balls=balls-1 WHERE user_id=p_uid;
   IF caught THEN
    SELECT count(*) INTO team_count FROM public.awc_pet_owned WHERE user_id=p_uid AND slot IS NOT NULL;
    INSERT INTO public.awc_pet_owned(user_id,species_id,level,hp,max_hp,slot)
      VALUES(p_uid,sp.id,w.level,sp.base_hp+w.level*3,sp.base_hp+w.level*3,
       CASE WHEN team_count<6 THEN (SELECT g FROM generate_series(1,6) g WHERE NOT EXISTS
          (SELECT 1 FROM public.awc_pet_owned WHERE user_id=p_uid AND slot=g) ORDER BY g LIMIT 1) ELSE NULL END);
    UPDATE public.awc_pet_players SET captures=captures+1,coins=coins+20 WHERE user_id=p_uid;
    DELETE FROM public.awc_pet_encounters WHERE user_id=p_uid;
    INSERT INTO public.awc_pet_activity(user_id,event,species_id) VALUES(p_uid,'catch',sp.id);
    response_text='จับสำเร็จ! '||sp.name_th||' เข้าทีม/คลัง';
   ELSE
    d:=greatest(1,floor((sp.base_atk+w.level)*(.12+random()*.2))::int);
    UPDATE public.awc_pet_owned SET hp=greatest(0,hp-d) WHERE id=lead.id;
    UPDATE public.awc_pet_encounters SET turns=turns+1 WHERE user_id=p_uid;
    response_text='จับไม่สำเร็จ! สัตว์ป่าสวนกลับ -'||d||' HP';
   END IF;
  END IF;
 ELSIF p_action='evolve' THEN
  BEGIN other_id=(p_payload->>'petId')::bigint; EXCEPTION WHEN others THEN other_id:=NULL;END;
  SELECT * INTO own FROM public.awc_pet_owned WHERE id=other_id AND user_id=p_uid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','ไม่พบสัตว์ของคุณ');END IF;
  SELECT * INTO sp FROM public.awc_pet_species WHERE id=own.species_id;
  IF sp.stage>=3 OR own.level<(ARRAY[12,28,48])[sp.stage+1] THEN
    RETURN jsonb_build_object('ok',false,'error','เลเวลยังไม่ถึงเกณฑ์วิวัฒนาการ');END IF;
  evolve_to:=sp.id+1;
  SELECT * INTO sp FROM public.awc_pet_species WHERE id=evolve_to;
  UPDATE public.awc_pet_owned SET species_id=evolve_to,max_hp=sp.base_hp+own.level*3,hp=sp.base_hp+own.level*3 WHERE id=own.id;
  INSERT INTO public.awc_pet_activity(user_id,event,species_id) VALUES(p_uid,'evolve',sp.id);
  response_text='วิวัฒนาการเป็น '||sp.name_th||' สำเร็จ!';
 ELSIF p_action='team' THEN
  BEGIN other_id=(p_payload->>'petId')::bigint;target=(p_payload->>'slot')::int;EXCEPTION WHEN others THEN other_id:=NULL;target:=NULL;END;
  SELECT * INTO own FROM public.awc_pet_owned WHERE id=other_id AND user_id=p_uid FOR UPDATE;
  IF NOT FOUND OR target IS NULL OR target<0 OR target>6 THEN RETURN jsonb_build_object('ok',false,'error','เลือกทีมไม่ถูกต้อง');END IF;
  UPDATE public.awc_pet_owned SET slot=NULL WHERE user_id=p_uid AND slot=target AND id<>own.id;
  UPDATE public.awc_pet_owned SET slot=CASE WHEN target=0 THEN NULL ELSE target END WHERE id=own.id;
  response_text='จัดทีมสำเร็จ';
 ELSIF p_action='area' THEN
  BEGIN target=(p_payload->>'area')::int;EXCEPTION WHEN others THEN target:=NULL;END;
  IF target IS NULL OR target<0 OR target>9 THEN RETURN jsonb_build_object('ok',false,'error','พื้นที่ไม่ถูกต้อง');END IF;
  SELECT coalesce(max(level),0) INTO min_level FROM public.awc_pet_owned WHERE user_id=p_uid;
  IF min_level<target*6+1 THEN RETURN jsonb_build_object('ok',false,'error','ต้องมีสัตว์เลเวล '||(target*6+1));END IF;
  UPDATE public.awc_pet_players SET area=target WHERE user_id=p_uid;
  DELETE FROM public.awc_pet_encounters WHERE user_id=p_uid;
  response_text='เดินทางสู่พื้นที่ '||(target+1);
 ELSIF p_action='shop' THEN
  x:=p_payload->>'item';
  BEGIN amount=(p_payload->>'quantity')::int;EXCEPTION WHEN others THEN amount:=NULL;END;
  IF amount IS NULL OR amount<1 OR amount>20 OR x NOT IN ('balls','potions') THEN
    RETURN jsonb_build_object('ok',false,'error','รายการสินค้าไม่ถูกต้อง');END IF;
  target:=amount*(CASE WHEN x='balls' THEN 85 ELSE 120 END);
  IF p.coins<target THEN RETURN jsonb_build_object('ok',false,'error','เงินไม่พอ');END IF;
  UPDATE public.awc_pet_players SET coins=coins-target,
    balls=balls+(CASE WHEN x='balls' THEN amount ELSE 0 END),
    potions=potions+(CASE WHEN x='potions' THEN amount ELSE 0 END)
    WHERE user_id=p_uid;
  response_text='ซื้อไอเทมสำเร็จ x'||amount;
 ELSIF p_action='heal' THEN
  IF p.potions<=0 THEN RETURN jsonb_build_object('ok',false,'error','ยาฟื้นฟูหมด');END IF;
  UPDATE public.awc_pet_owned SET hp=max_hp WHERE user_id=p_uid AND slot IS NOT NULL;
  UPDATE public.awc_pet_players SET potions=potions-1 WHERE user_id=p_uid;
  response_text='รักษาสัตว์ทั้งทีมแล้ว';
 ELSIF p_action='daily' THEN
  IF p.daily_claim=current_date THEN RETURN jsonb_build_object('ok',false,'error','รับรางวัลวันนี้แล้ว');END IF;
  UPDATE public.awc_pet_players SET coins=coins+600,balls=balls+7,potions=potions+2,daily_claim=current_date WHERE user_id=p_uid;
  response_text='รับรางวัลรายวัน +600 เหรียญ +7 บอล +2 ยา';
 ELSIF p_action='rename' THEN
  x:=trim(coalesce(p_payload->>'name',''));
  IF char_length(x)<2 OR char_length(x)>20 OR x !~ '^[[:alnum:]ก-๙ _-]+$' THEN
   RETURN jsonb_build_object('ok',false,'error','ชื่อต้องมี 2–20 ตัวอักษร');END IF;
  UPDATE public.awc_pet_players SET name=x WHERE user_id=p_uid; response_text='เปลี่ยนชื่อแล้ว';
 END IF;
 IF p_action='state' THEN UPDATE public.awc_pet_players SET last_seen=now_ts WHERE user_id=p_uid AND last_seen<now_ts-interval '20 seconds';END IF;
 SELECT * INTO p FROM public.awc_pet_players WHERE user_id=p_uid;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',o.id,'speciesId',o.species_id,'name',s.name_th,'element',s.element,'rarity',s.rarity,'stage',s.stage,
      'level',o.level,'exp',o.exp,'hp',o.hp,'maxHp',o.max_hp,'slot',o.slot,'atk',s.base_atk+o.level*2,'def',s.base_def+o.level)
      ORDER BY o.slot NULLS LAST,o.id),'[]'::jsonb) INTO roster
 FROM public.awc_pet_owned o JOIN public.awc_pet_species s ON s.id=o.species_id WHERE o.user_id=p_uid;
 SELECT jsonb_build_object('speciesId',e.species_id,'level',e.level,'hp',e.hp,'maxHp',e.max_hp,'turns',e.turns,
    'name',s.name_th,'element',s.element,'rarity',s.rarity,'stage',s.stage)
 INTO active_wild FROM public.awc_pet_encounters e JOIN public.awc_pet_species s ON s.id=e.species_id WHERE e.user_id=p_uid;
 SELECT coalesce(jsonb_agg(jsonb_build_object('name',name,'captures',captures,'wins',wins,'online',last_seen>now_ts-interval '100 seconds')
   ORDER BY captures DESC,wins DESC),'[]'::jsonb) INTO leaders
 FROM (SELECT name,captures,wins,last_seen FROM public.awc_pet_players ORDER BY captures DESC,wins DESC,user_id LIMIT 15) leaderboard;
 SELECT coalesce(jsonb_agg(jsonb_build_object('type',event,'speciesId',species_id,'time',at) ORDER BY at DESC),'[]'::jsonb)
 INTO journal FROM (SELECT event,species_id,at FROM public.awc_pet_activity WHERE user_id=p_uid ORDER BY at DESC LIMIT 8) log;
 RETURN jsonb_build_object('ok',true,'player',jsonb_build_object(
    'name',p.name,'coins',p.coins,'gems',p.gems,'balls',p.balls,'potions',p.potions,'area',p.area,
    'captures',p.captures,'wins',p.wins,'xp',p.xp,'dailyClaim',p.daily_claim),
   'pets',roster,'wild',active_wild,'leaderboard',leaders,'journal',journal,
   'message',response_text,'caught',caught);
END
$function$;
REVOKE ALL ON FUNCTION public.awc_pet_action(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.awc_pet_action(uuid,text,jsonb) TO service_role;
