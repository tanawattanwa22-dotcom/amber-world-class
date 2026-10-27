-- AMBER WORLD CLASS new project, created after initial schema.
CREATE OR REPLACE FUNCTION public.awc_server_action(p_user uuid, p_action text, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
 h public.awc_characters%ROWTYPE; t public.awc_action_timing%ROWTYPE;m public.awc_world_mobs%ROWTYPE;
 now_ts timestamptz:=clock_timestamp();delay_s double precision;dx double precision;dy double precision;n double precision;
 dst int;required_level int;is_skill boolean;attack_range int;dmg int;gain_exp int;gain_gold int;
 out_mobs jsonb;out_peers jsonb;out_hero jsonb;notice_text text:='';levelled boolean:=false;
BEGIN
 IF p_user IS NULL OR p_action NOT IN ('login','state','move','attack','skill','potion','travel','chooseClass')
    OR jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN
   RETURN jsonb_build_object('ok',false,'error','Invalid request');
 END IF;
 IF p_action='login' THEN
   INSERT INTO public.awc_profiles(user_id,nickname) VALUES(p_user,'Hero'||left(p_user::text,6)) ON CONFLICT DO NOTHING;
   INSERT INTO public.awc_characters(user_id,name) VALUES(p_user,'Hero'||left(p_user::text,6)) ON CONFLICT DO NOTHING;
 END IF;
 INSERT INTO public.awc_action_timing(user_id) VALUES(p_user) ON CONFLICT DO NOTHING;
 SELECT * INTO h FROM public.awc_characters WHERE user_id=p_user FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','No character'); END IF;
 SELECT * INTO t FROM public.awc_action_timing WHERE user_id=p_user FOR UPDATE;
 IF p_action='move' THEN
   BEGIN dx=(p_payload->>'dx')::double precision;dy=(p_payload->>'dy')::double precision;
   EXCEPTION WHEN others THEN RETURN jsonb_build_object('ok',false,'error','Invalid movement'); END;
   IF dx IS NULL OR dy IS NULL OR dx='NaN'::float8 OR dy='NaN'::float8 OR abs(dx)>1 OR abs(dy)>1 THEN
     RETURN jsonb_build_object('ok',false,'error','Invalid movement');
   END IF;
   n=greatest(1,sqrt(dx*dx+dy*dy));
   delay_s=least(0.20,greatest(0,extract(epoch FROM now_ts-t.last_move)));
   UPDATE public.awc_characters SET
     x=greatest(24,least(1128,h.x+dx/n*168*delay_s)),
     y=greatest(24,least(1128,h.y+dy/n*168*delay_s)),updated_at=now_ts WHERE id=h.id;
   UPDATE public.awc_action_timing SET last_move=now_ts WHERE user_id=p_user;
 ELSIF p_action='travel' THEN
   BEGIN dst=(p_payload->>'mapId')::integer;EXCEPTION WHEN others THEN dst=-1;END;
   IF dst IS NULL OR dst<0 OR dst>9 THEN RETURN jsonb_build_object('ok',false,'error','Invalid map');END IF;
   required_level=(ARRAY[1,5,10,20,30,40,55,70,80,100])[dst+1];
   IF h.level<required_level THEN RETURN jsonb_build_object('ok',false,'error','ต้องมีเลเวล '||required_level);END IF;
   IF extract(epoch FROM now_ts-t.last_travel)<2 THEN RETURN jsonb_build_object('ok',false,'error','Travel cooldown');END IF;
   UPDATE public.awc_characters SET map_id=dst,x=570,y=656,updated_at=now_ts WHERE id=h.id;
   UPDATE public.awc_action_timing SET last_travel=now_ts,last_move=now_ts WHERE user_id=p_user;
   notice_text='เข้าสู่แผนที่ '||(dst+1);
 ELSIF p_action='chooseClass' THEN
   BEGIN dst=(p_payload->>'classId')::integer;EXCEPTION WHEN others THEN dst=-1;END;
   IF h.level<10 OR h.class_id<>-1 OR dst IS NULL OR dst<0 OR dst>3 THEN
     RETURN jsonb_build_object('ok',false,'error','Class change not allowed');END IF;
   UPDATE public.awc_characters SET class_id=dst,attack=attack+8,updated_at=now_ts WHERE id=h.id;
   notice_text='เปลี่ยนอาชีพสำเร็จ';
 ELSIF p_action='potion' THEN
   IF extract(epoch FROM now_ts-t.last_potion)<0.85 OR h.potions<=0 OR h.hp>=h.max_hp THEN
     RETURN jsonb_build_object('ok',false,'error','Potion unavailable');END IF;
   UPDATE public.awc_characters SET potions=potions-1,hp=least(max_hp,hp+80+level*6),updated_at=now_ts WHERE id=h.id;
   UPDATE public.awc_action_timing SET last_potion=now_ts WHERE user_id=p_user;notice_text='ใช้ยาฟื้นฟู HP';
 ELSIF p_action IN ('attack','skill') THEN
   is_skill=(p_action='skill');
   delay_s=extract(epoch FROM now_ts-(CASE WHEN is_skill THEN t.last_skill ELSE t.last_attack END));
   IF delay_s<(CASE WHEN is_skill THEN 3.5 ELSE 0.48 END) THEN
     RETURN jsonb_build_object('ok',false,'error','Cooldown');END IF;
   IF is_skill AND h.mp<15 THEN RETURN jsonb_build_object('ok',false,'error','MP ไม่พอ');END IF;
   IF length(coalesce(p_payload->>'targetId',''))>30 THEN RETURN jsonb_build_object('ok',false,'error','Invalid target');END IF;
   SELECT * INTO m FROM public.awc_world_mobs WHERE map_id=h.map_id AND mob_code=p_payload->>'targetId' FOR UPDATE;
   IF NOT FOUND OR m.hp<=0 OR m.respawn_at IS NOT NULL THEN RETURN jsonb_build_object('ok',false,'error','Monster not alive');END IF;
   attack_range=CASE WHEN is_skill THEN 190 WHEN h.class_id IN (1,2) THEN 155 ELSE 100 END;
   IF sqrt((h.x-m.x)^2+(h.y-m.y)^2)>attack_range THEN RETURN jsonb_build_object('ok',false,'error','Out of range');END IF;
   dmg=greatest(1,floor((h.attack+h.level*2+greatest(0,h.class_id)*4)*
      (CASE WHEN is_skill THEN 2.35 ELSE 1 END)*(0.86+random()*0.28)-m.level*0.48)::int);
   IF is_skill THEN
     UPDATE public.awc_characters SET mp=mp-15 WHERE id=h.id;
     UPDATE public.awc_action_timing SET last_skill=now_ts WHERE user_id=p_user;
   ELSE UPDATE public.awc_action_timing SET last_attack=now_ts WHERE user_id=p_user;END IF;
   UPDATE public.awc_world_mobs SET hp=greatest(0,hp-dmg),
     respawn_at=CASE WHEN hp<=dmg THEN now_ts+(CASE WHEN boss THEN interval '26 seconds' ELSE interval '9 seconds' END) ELSE NULL END
     WHERE map_id=m.map_id AND mob_code=m.mob_code;
   IF m.hp<=dmg THEN
     gain_exp=CASE WHEN m.boss THEN 550+m.level*9 ELSE 55+m.level*8 END;
     gain_gold=CASE WHEN m.boss THEN 600 ELSE 16+m.level*3 END;
     UPDATE public.awc_characters SET exp=exp+gain_exp,gold=gold+gain_gold,mob_kills=mob_kills+1,
       quest_kills=quest_kills+1,potions=potions+(CASE WHEN random()<0.12 THEN 1 ELSE 0 END),
       updated_at=now_ts WHERE id=h.id;
     SELECT * INTO h FROM public.awc_characters WHERE id=h.id;
     IF h.quest_kills=5 THEN
       UPDATE public.awc_characters SET exp=exp+250,gold=gold+100 WHERE id=h.id;
       gain_exp=gain_exp+250;gain_gold=gain_gold+100;
       SELECT * INTO h FROM public.awc_characters WHERE id=h.id;
     END IF;
     WHILE h.level<100 AND h.exp>=120+h.level*45 LOOP
       UPDATE public.awc_characters SET exp=exp-(120+level*45),level=level+1,
        stat_points=stat_points+5,max_hp=max_hp+30,max_mp=max_mp+10,
        hp=max_hp+30,mp=max_mp+10,attack=attack+3,defense=defense+1 WHERE id=h.id;
       SELECT * INTO h FROM public.awc_characters WHERE id=h.id;
       levelled=true;
     END LOOP;
     IF h.level=100 THEN UPDATE public.awc_characters SET exp=0 WHERE id=h.id;END IF;
     notice_text='ชนะมอนสเตอร์ +'||gain_exp||' EXP +'||gain_gold||' Gold';
   ELSE gain_exp=0;gain_gold=0;notice_text='โจมตี '||dmg||' DMG';END IF;
   INSERT INTO public.awc_combat_audit(character_id,mob_code,map_id,damage,exp_awarded,gold_awarded)
       VALUES(h.id,m.mob_code,h.map_id,dmg,gain_exp,gain_gold);
 END IF;
 UPDATE public.awc_world_mobs SET hp=max_hp,respawn_at=NULL
   WHERE map_id=h.map_id AND respawn_at IS NOT NULL AND respawn_at<=now_ts;
 SELECT * INTO h FROM public.awc_characters WHERE id=h.id;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',mob_code,'type',mob_type,'level',level,'x',x,'y',y,
  'hp',hp,'maxHp',max_hp,'boss',boss,'alive',(hp>0),'respawn',0,'phase',0) ORDER BY mob_code),'[]'::jsonb)
  INTO out_mobs FROM public.awc_world_mobs WHERE map_id=h.map_id;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'level',level,'x',x,'y',y,
   'classId',class_id,'facing',0) ORDER BY name),'[]'::jsonb)
 INTO out_peers FROM
 (SELECT id,name,level,x,y,class_id FROM public.awc_characters WHERE map_id=h.map_id AND id<>h.id
     AND updated_at>now_ts-interval '90 seconds' ORDER BY updated_at DESC LIMIT 30) peers;
 out_hero=jsonb_build_object('id',h.id,'name',h.name,'level',h.level,'exp',h.exp,
 'mapId',h.map_id,'x',h.x,'y',h.y,'classId',h.class_id,'statPoints',h.stat_points,'atk',h.attack,
 'def',h.defense,'hp',h.hp,'maxHp',h.max_hp,'mp',h.mp,'maxMp',h.max_mp,'gold',h.gold,
 'gems',h.gems,'potions',h.potions,'mobKills',h.mob_kills,'questKills',h.quest_kills);
 RETURN jsonb_build_object('ok',true,'type','state','character',out_hero,'mobs',out_mobs,
  'players',out_peers,'notice',notice_text,'levelUp',levelled);
END $function$

REVOKE ALL ON FUNCTION public.awc_server_action(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.awc_server_action(uuid,text,jsonb) TO service_role;
