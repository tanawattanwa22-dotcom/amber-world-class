-- Versioned canonical server SQL functions, installed in Supabase amber-world-class.
CREATE OR REPLACE FUNCTION public.amberlings_social_state(p_uid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE gid uuid; mg jsonb; run jsonb;
BEGIN
 SELECT guild_id INTO gid FROM public.amberlings_guild_members WHERE user_id=p_uid;
 SELECT jsonb_build_object('id',g.id,'name',g.name,'role',m.role,'leader',g.leader_id)
 INTO mg FROM public.amberlings_guild_members m JOIN public.amberlings_guilds g ON g.id=m.guild_id
 WHERE m.user_id=p_uid;
 SELECT to_jsonb(r) INTO run FROM
 (SELECT stage,boss_hp,mon_hp,rounds FROM public.amberlings_gym_runs WHERE owner_id=p_uid) r;
 RETURN jsonb_build_object(
 'players', (SELECT coalesce(jsonb_agg(x),'[]'::jsonb) FROM
   (SELECT p.user_id AS id,p.name,p.rating,p.last_seen>now()-interval '100 seconds' AS online
    FROM public.amberlings_players p WHERE p.user_id<>p_uid ORDER BY p.last_seen DESC LIMIT 40) x),
 'guild', mg,
 'guilds',(SELECT coalesce(jsonb_agg(x),'[]'::jsonb) FROM
   (SELECT g.id,g.name,p.name AS leader,(SELECT count(*) FROM public.amberlings_guild_members m WHERE m.guild_id=g.id) AS members
    FROM public.amberlings_guilds g JOIN public.amberlings_players p ON p.user_id=g.leader_id ORDER BY g.created_at DESC LIMIT 40) x),
 'members',(SELECT coalesce(jsonb_agg(x),'[]'::jsonb) FROM
   (SELECT p.user_id AS id,p.name,m.role FROM public.amberlings_guild_members m JOIN public.amberlings_players p ON p.user_id=m.user_id
    WHERE m.guild_id=gid ORDER BY m.joined_at LIMIT 40) x),
 'friends',(SELECT coalesce(jsonb_agg(x),'[]'::jsonb) FROM
   (SELECT f.requester,f.recipient,f.status,p.name,
   CASE WHEN f.requester=p_uid THEN 'out' ELSE 'in' END AS direction,
   CASE WHEN f.requester=p_uid THEN f.recipient ELSE f.requester END AS player_id
   FROM public.amberlings_friends f JOIN public.amberlings_players p
     ON p.user_id=(CASE WHEN f.requester=p_uid THEN f.recipient ELSE f.requester END)
   WHERE f.requester=p_uid OR f.recipient=p_uid ORDER BY f.created_at DESC LIMIT 100) x),
 'messages',(SELECT coalesce(jsonb_agg(x ORDER BY x.created_at),'[]'::jsonb) FROM
   (SELECT c.id,c.channel,c.body,c.created_at,p.name AS sender,c.sender AS sender_id,
      c.guild_id FROM public.amberlings_chat c JOIN public.amberlings_players p ON p.user_id=c.sender
    WHERE c.channel='world' OR (gid IS NOT NULL AND c.channel='guild' AND c.guild_id=gid)
    ORDER BY c.created_at DESC LIMIT 65) x),
 'duels',(SELECT coalesce(jsonb_agg(x),'[]'::jsonb) FROM
   (SELECT d.id,d.status,d.challenger,d.opponent,a.name AS challenger_name,b.name AS opponent_name,
    d.ch_hp,d.op_hp,d.turn_user,d.winner,d.rounds
    FROM public.amberlings_pvp_duels d JOIN public.amberlings_players a ON a.user_id=d.challenger
     JOIN public.amberlings_players b ON b.user_id=d.opponent
    WHERE (d.challenger=p_uid OR d.opponent=p_uid) AND d.created_at>now()-interval '7 days'
    ORDER BY d.created_at DESC LIMIT 15) x),
 'gym',run,
 'gymWins',(SELECT coalesce(jsonb_agg(stage),'[]'::jsonb) FROM public.amberlings_gym_claims WHERE owner_id=p_uid),
 'questClaims',(SELECT coalesce(jsonb_agg(quest),'[]'::jsonb) FROM public.amberlings_quest_claims WHERE owner_id=p_uid),
 'pvpWins',(SELECT count(*) FROM public.amberlings_pvp_duels WHERE winner=p_uid AND status='done')
 );
END $function$

REVOKE ALL ON FUNCTION public.amberlings_social_state(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.amberlings_social_state(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.amberlings_social_action(p_uid uuid, p_action text, p_args jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
 pl public.amberlings_players%ROWTYPE;
 target_id uuid; g_id uuid; guild public.amberlings_guilds%ROWTYPE;
 duel public.amberlings_pvp_duels%ROWTYPE;
 mon public.amberlings_monsters%ROWTYPE; defmon public.amberlings_monsters%ROWTYPE;
 run public.amberlings_gym_runs%ROWTYPE;
 atk int; def int; dmg int; boss_dmg int; n int; level_needed int;
 s text; channel text; quest text; msg text:=''; reward int; gems_reward int;
 snap jsonb; did uuid; m1 uuid; m2 uuid;
BEGIN
 IF p_uid IS NULL OR jsonb_typeof(p_args) <> 'object' OR
    p_action NOT IN ('social_state','guild_create','guild_join','guild_leave','guild_transfer','guild_kick',
    'friend_request','friend_accept','friend_remove','chat_post','chat_report',
    'pvp_challenge','pvp_accept','pvp_cancel','pvp_attack','pvp_forfeit',
    'gym_start','gym_attack','gym_cancel','quest_claim') THEN
  RETURN jsonb_build_object('ok',false,'error','Invalid social action');
 END IF;
 SELECT * INTO pl FROM public.amberlings_players WHERE user_id=p_uid;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Sign in first'); END IF;
 IF p_action <> 'social_state' AND pl.starter_species IS NULL THEN
   RETURN jsonb_build_object('ok',false,'error','Select your starter creature first'); END IF;

 IF p_action='guild_create' THEN
  s:=trim(coalesce(p_args->>'name',''));
  IF char_length(s) NOT BETWEEN 3 AND 24 OR s !~ '^[[:alnum:]ก-๙ _-]+$'
  THEN RETURN jsonb_build_object('ok',false,'error','Invalid guild name'); END IF;
  IF EXISTS(SELECT 1 FROM public.amberlings_guild_members WHERE user_id=p_uid)
  THEN RETURN jsonb_build_object('ok',false,'error','Leave your guild first'); END IF;
  UPDATE public.amberlings_players SET coins=coins-500 WHERE user_id=p_uid AND coins>=500;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Guild creation costs 500 coins'); END IF;
  INSERT INTO public.amberlings_guilds(name,leader_id) VALUES(s,p_uid) RETURNING id INTO g_id;
  INSERT INTO public.amberlings_guild_members(user_id,guild_id,role) VALUES(p_uid,g_id,'leader');
  msg:='Guild created';
 ELSIF p_action='guild_join' THEN
  BEGIN g_id=(p_args->>'guildId')::uuid;EXCEPTION WHEN others THEN g_id:=NULL;END;
  IF g_id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Invalid guild');END IF;
  IF EXISTS(SELECT 1 FROM public.amberlings_guild_members WHERE user_id=p_uid)
  THEN RETURN jsonb_build_object('ok',false,'error','Already in guild'); END IF;
  SELECT * INTO guild FROM public.amberlings_guilds WHERE id=g_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Guild not found');END IF;
  IF (SELECT count(*) FROM public.amberlings_guild_members WHERE guild_id=g_id)>=40
  THEN RETURN jsonb_build_object('ok',false,'error','Guild full');END IF;
  INSERT INTO public.amberlings_guild_members(user_id,guild_id) VALUES(p_uid,g_id);
  msg:='Joined guild';
 ELSIF p_action='guild_leave' THEN
  SELECT m.guild_id INTO g_id FROM public.amberlings_guild_members m WHERE m.user_id=p_uid;
  IF g_id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Not in guild');END IF;
  SELECT * INTO guild FROM public.amberlings_guilds WHERE id=g_id FOR UPDATE;
  IF guild.leader_id=p_uid THEN
    IF (SELECT count(*) FROM public.amberlings_guild_members WHERE guild_id=g_id)>1
    THEN RETURN jsonb_build_object('ok',false,'error','Transfer leadership before leaving');END IF;
    DELETE FROM public.amberlings_guild_members WHERE user_id=p_uid;
    DELETE FROM public.amberlings_guilds WHERE id=g_id;
  ELSE DELETE FROM public.amberlings_guild_members WHERE user_id=p_uid;END IF;
  msg:='Left guild';
 ELSIF p_action IN ('guild_transfer','guild_kick') THEN
  BEGIN target_id=(p_args->>'targetId')::uuid;EXCEPTION WHEN others THEN target_id:=NULL;END;
  SELECT g.* INTO guild FROM public.amberlings_guilds g WHERE g.leader_id=p_uid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Only guild leader may manage members');END IF;
  IF target_id IS NULL OR target_id=p_uid OR NOT EXISTS(
   SELECT 1 FROM public.amberlings_guild_members WHERE user_id=target_id AND guild_id=guild.id)
  THEN RETURN jsonb_build_object('ok',false,'error','Invalid guild member');END IF;
  IF p_action='guild_transfer' THEN
   UPDATE public.amberlings_guild_members SET role='member' WHERE user_id=p_uid;
   UPDATE public.amberlings_guild_members SET role='leader' WHERE user_id=target_id;
   UPDATE public.amberlings_guilds SET leader_id=target_id WHERE id=guild.id;
   msg:='Transferred leadership';
  ELSE DELETE FROM public.amberlings_guild_members WHERE user_id=target_id;msg:='Member removed';END IF;
 ELSIF p_action IN ('friend_request','friend_accept','friend_remove') THEN
  BEGIN target_id=(p_args->>'targetId')::uuid;EXCEPTION WHEN others THEN target_id:=NULL;END;
  IF target_id IS NULL OR target_id=p_uid OR NOT EXISTS(
   SELECT 1 FROM public.amberlings_players WHERE user_id=target_id)
  THEN RETURN jsonb_build_object('ok',false,'error','Invalid player');END IF;
  IF p_action='friend_request' THEN
   IF EXISTS(SELECT 1 FROM public.amberlings_friends WHERE
     (requester=p_uid AND recipient=target_id) OR (requester=target_id AND recipient=p_uid))
   THEN RETURN jsonb_build_object('ok',false,'error','Friend request already exists');END IF;
   INSERT INTO public.amberlings_friends(requester,recipient) VALUES(p_uid,target_id);
   msg:='Friend request sent';
  ELSIF p_action='friend_accept' THEN
   UPDATE public.amberlings_friends SET status='accepted' WHERE requester=target_id
     AND recipient=p_uid AND status='pending';
   IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','No incoming request'); END IF;
   msg:='Friend added';
  ELSE DELETE FROM public.amberlings_friends WHERE
   (requester=p_uid AND recipient=target_id) OR (requester=target_id AND recipient=p_uid);
   msg:='Friend removed';
  END IF;
 ELSIF p_action='chat_post' THEN
  PERFORM pg_advisory_xact_lock(hashtext('amberlings_chat_'||p_uid::text));
  s:=trim(coalesce(p_args->>'body',''));channel:=p_args->>'channel';
  IF char_length(s) NOT BETWEEN 1 AND 240 OR channel NOT IN ('world','guild')
  THEN RETURN jsonb_build_object('ok',false,'error','Message must have 1-240 characters');END IF;
  IF EXISTS(SELECT 1 FROM public.amberlings_chat WHERE sender=p_uid AND created_at>now()-interval '3 seconds')
  THEN RETURN jsonb_build_object('ok',false,'error','Please slow down (3s)');END IF;
  IF channel='guild' THEN
   SELECT guild_id INTO g_id FROM public.amberlings_guild_members WHERE user_id=p_uid;
   IF g_id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Join a guild to chat');END IF;
  END IF;
  INSERT INTO public.amberlings_chat(sender,channel,guild_id,body) VALUES(p_uid,channel,g_id,s);
  msg:='Message sent';
 ELSIF p_action='chat_report' THEN
  BEGIN n=(p_args->>'messageId')::bigint;EXCEPTION WHEN others THEN n:=NULL;END;
  IF n IS NULL OR NOT EXISTS(SELECT 1 FROM public.amberlings_chat c
    WHERE c.id=n AND c.sender<>p_uid AND
    (c.channel='world' OR EXISTS(SELECT 1 FROM public.amberlings_guild_members m
       WHERE m.user_id=p_uid AND m.guild_id=c.guild_id)))
  THEN RETURN jsonb_build_object('ok',false,'error','Invalid message');END IF;
  INSERT INTO public.amberlings_chat_reports(reporter,message_id) VALUES(p_uid,n)
    ON CONFLICT DO NOTHING;
  msg:='Report received';
 ELSIF p_action='pvp_challenge' THEN
  PERFORM pg_advisory_xact_lock(978312019);
  BEGIN target_id=(p_args->>'targetId')::uuid;EXCEPTION WHEN others THEN target_id:=NULL;END;
  IF target_id IS NULL OR target_id=p_uid OR NOT EXISTS(
   SELECT 1 FROM public.amberlings_players WHERE user_id=target_id AND starter_species IS NOT NULL)
  THEN RETURN jsonb_build_object('ok',false,'error','Choose another player with a starter');END IF;
  IF EXISTS(SELECT 1 FROM public.amberlings_pvp_duels WHERE status IN ('pending','active')
     AND created_at>now()-interval '1 day' AND
     (challenger IN(p_uid,target_id) OR opponent IN(p_uid,target_id)))
  THEN RETURN jsonb_build_object('ok',false,'error','One player has a pending/active duel');END IF;
  SELECT * INTO mon FROM public.amberlings_monsters WHERE owner_id=p_uid AND slot IS NOT NULL
    AND hp>0 ORDER BY slot LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Need a healthy team creature');END IF;
  INSERT INTO public.amberlings_pvp_duels(challenger,opponent,challenger_mon,ch_hp)
   VALUES(p_uid,target_id,mon.id,mon.max_hp*3);
  msg:='Challenge sent';
 ELSIF p_action IN ('pvp_accept','pvp_cancel','pvp_forfeit','pvp_attack') THEN
  BEGIN did=(p_args->>'duelId')::uuid;EXCEPTION WHEN others THEN did:=NULL;END;
  SELECT * INTO duel FROM public.amberlings_pvp_duels WHERE id=did FOR UPDATE;
  IF NOT FOUND OR p_uid NOT IN (duel.challenger,duel.opponent)
  THEN RETURN jsonb_build_object('ok',false,'error','Duel not found');END IF;
  IF p_action='pvp_accept' THEN
   IF duel.status<>'pending' OR duel.opponent<>p_uid OR duel.created_at<now()-interval '1 day'
   THEN RETURN jsonb_build_object('ok',false,'error','Cannot accept duel');END IF;
   SELECT * INTO mon FROM public.amberlings_monsters WHERE owner_id=p_uid AND slot IS NOT NULL AND hp>0
    ORDER BY slot LIMIT 1;
   IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.amberlings_monsters
      WHERE id=duel.challenger_mon AND owner_id=duel.challenger AND hp>0)
   THEN RETURN jsonb_build_object('ok',false,'error','Both players need healthy creatures');END IF;
   UPDATE public.amberlings_pvp_duels SET status='active',opponent_mon=mon.id,op_hp=mon.max_hp*3,
       turn_user=duel.challenger,last_move_at=now() WHERE id=duel.id;
   msg:='Duel accepted';
  ELSIF p_action='pvp_cancel' THEN
   IF duel.status<>'pending' THEN RETURN jsonb_build_object('ok',false,'error','Cannot cancel duel');END IF;
   UPDATE public.amberlings_pvp_duels SET status='cancelled' WHERE id=duel.id;
   msg:='Duel declined';
  ELSIF p_action='pvp_forfeit' THEN
   IF duel.status<>'active' THEN RETURN jsonb_build_object('ok',false,'error','No active duel');END IF;
   target_id=CASE WHEN p_uid=duel.challenger THEN duel.opponent ELSE duel.challenger END;
   UPDATE public.amberlings_pvp_duels SET status='done',winner=target_id WHERE id=duel.id;
   msg:='Forfeited duel';
  ELSE
   IF duel.status<>'active' OR duel.turn_user<>p_uid THEN
    RETURN jsonb_build_object('ok',false,'error','Not your turn');END IF;
   IF now()-duel.last_move_at<interval '.7 second' THEN
    RETURN jsonb_build_object('ok',false,'error','Attack cooldown');END IF;
   m1=CASE WHEN p_uid=duel.challenger THEN duel.challenger_mon ELSE duel.opponent_mon END;
   m2=CASE WHEN p_uid=duel.challenger THEN duel.opponent_mon ELSE duel.challenger_mon END;
   target_id=CASE WHEN p_uid=duel.challenger THEN duel.opponent ELSE duel.challenger END;
   SELECT * INTO mon FROM public.amberlings_monsters WHERE id=m1 AND owner_id=p_uid;
   SELECT * INTO defmon FROM public.amberlings_monsters WHERE id=m2 AND owner_id=target_id;
   IF mon.id IS NULL OR defmon.id IS NULL THEN
    RETURN jsonb_build_object('ok',false,'error','Duel creature changed ownership');END IF;
   SELECT base_atk INTO atk FROM public.amberlings_species WHERE id=mon.species_id;
   SELECT base_def INTO def FROM public.amberlings_species WHERE id=defmon.species_id;
   dmg:=greatest(3,floor((atk*mon.level/50.0+8)*(0.8+random()*.4)-
                  def*defmon.level/150.0)::int);
   IF p_uid=duel.challenger THEN
    UPDATE public.amberlings_pvp_duels SET op_hp=greatest(0,op_hp-dmg),
      rounds=rounds+1,turn_user=target_id,last_move_at=now() WHERE id=duel.id;
    n:=greatest(0,duel.op_hp-dmg);
   ELSE
    UPDATE public.amberlings_pvp_duels SET ch_hp=greatest(0,ch_hp-dmg),
      rounds=rounds+1,turn_user=target_id,last_move_at=now() WHERE id=duel.id;
    n:=greatest(0,duel.ch_hp-dmg);
   END IF;
   IF n=0 OR duel.rounds>=39 THEN
    IF n<>0 THEN
     SELECT * INTO duel FROM public.amberlings_pvp_duels WHERE id=duel.id;
     target_id=CASE WHEN duel.ch_hp>=duel.op_hp THEN duel.challenger ELSE duel.opponent END;
    ELSE target_id=p_uid;END IF;
    UPDATE public.amberlings_pvp_duels SET status='done',winner=target_id WHERE id=did;
    msg:='Duel finished';
   ELSE msg:='Attack dealt '||dmg||' damage';END IF;
  END IF;
 ELSIF p_action IN ('gym_start','gym_attack','gym_cancel') THEN
  IF p_action='gym_start' THEN
   BEGIN n=(p_args->>'stage')::int;EXCEPTION WHEN others THEN n:=NULL;END;
   IF n NOT BETWEEN 1 AND 3 THEN RETURN jsonb_build_object('ok',false,'error','Invalid gym');END IF;
   level_needed=CASE n WHEN 1 THEN 5 WHEN 2 THEN 12 ELSE 25 END;
   IF NOT EXISTS(SELECT 1 FROM public.amberlings_monsters WHERE owner_id=p_uid AND hp>0
     AND slot IS NOT NULL AND level>=level_needed) THEN
    RETURN jsonb_build_object('ok',false,'error','Gym level requirement not met');END IF;
   SELECT * INTO mon FROM public.amberlings_monsters WHERE owner_id=p_uid AND hp>0
    AND slot IS NOT NULL AND level>=level_needed ORDER BY slot LIMIT 1;
   INSERT INTO public.amberlings_gym_runs(owner_id,stage,boss_hp,mon_hp,rounds)
    VALUES(p_uid,n,CASE n WHEN 1 THEN 100 WHEN 2 THEN 240 ELSE 430 END,mon.max_hp*3,0)
    ON CONFLICT(owner_id) DO UPDATE SET stage=excluded.stage,boss_hp=excluded.boss_hp,
      mon_hp=excluded.mon_hp,rounds=0,last_attack='1970-01-01',created_at=now();
   msg:='Gym challenge started';
  ELSIF p_action='gym_cancel' THEN
   DELETE FROM public.amberlings_gym_runs WHERE owner_id=p_uid;msg:='Gym closed';
  ELSE
   SELECT * INTO run FROM public.amberlings_gym_runs WHERE owner_id=p_uid FOR UPDATE;
   IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Start a gym first');END IF;
   IF now()-run.last_attack<interval '1 second' THEN
    RETURN jsonb_build_object('ok',false,'error','Gym attack cooldown'); END IF;
   SELECT * INTO mon FROM public.amberlings_monsters WHERE owner_id=p_uid AND hp>0
    AND slot IS NOT NULL AND level>=CASE run.stage WHEN 1 THEN 5 WHEN 2 THEN 12 ELSE 25 END
    ORDER BY slot LIMIT 1;
   IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','No eligible active monster');END IF;
   SELECT base_atk INTO atk FROM public.amberlings_species WHERE id=mon.species_id;
   dmg:=greatest(5,floor(atk*mon.level/60.0*(.85+random()*.3))::int);
   boss_dmg:=run.stage*5+floor(random()*10)::int;
   IF dmg>=run.boss_hp THEN
    INSERT INTO public.amberlings_gym_claims(owner_id,stage) VALUES(p_uid,run.stage)
     ON CONFLICT DO NOTHING RETURNING stage INTO n;
    IF n IS NOT NULL THEN
     reward:=CASE run.stage WHEN 1 THEN 400 WHEN 2 THEN 900 ELSE 1600 END;
     gems_reward:=CASE run.stage WHEN 1 THEN 10 WHEN 2 THEN 20 ELSE 35 END;
     UPDATE public.amberlings_players SET coins=least(2000000000,coins+reward),
       gems=least(2000000000,gems+gems_reward) WHERE user_id=p_uid;
     msg:='Gym won! First clear reward granted';
    ELSE msg:='Gym won! Already claimed this gym reward';END IF;
    DELETE FROM public.amberlings_gym_runs WHERE owner_id=p_uid;
   ELSIF boss_dmg>=run.mon_hp OR run.rounds>=29 THEN
    DELETE FROM public.amberlings_gym_runs WHERE owner_id=p_uid;
    msg:='Gym attempt lost, try again';
   ELSE
    UPDATE public.amberlings_gym_runs SET boss_hp=boss_hp-dmg,mon_hp=mon_hp-boss_dmg,
      rounds=rounds+1,last_attack=now() WHERE owner_id=p_uid;
    msg:='Your monster dealt '||dmg||' damage';
   END IF;
  END IF;
 ELSIF p_action='quest_claim' THEN
  quest:=p_args->>'quest';
  IF quest NOT IN ('capture1','wins5','gym1','guild1','pvp1')
  THEN RETURN jsonb_build_object('ok',false,'error','Invalid quest');END IF;
  IF NOT (CASE quest
   WHEN 'capture1' THEN pl.captures>=1
   WHEN 'wins5' THEN pl.wins>=5
   WHEN 'gym1' THEN EXISTS(SELECT 1 FROM public.amberlings_gym_claims WHERE owner_id=p_uid AND stage=1)
   WHEN 'guild1' THEN EXISTS(SELECT 1 FROM public.amberlings_guild_members WHERE user_id=p_uid)
   WHEN 'pvp1' THEN EXISTS(SELECT 1 FROM public.amberlings_pvp_duels WHERE status='done'
       AND (challenger=p_uid OR opponent=p_uid))
   ELSE false END)
  THEN RETURN jsonb_build_object('ok',false,'error','Quest not completed');END IF;
  INSERT INTO public.amberlings_quest_claims(owner_id,quest) VALUES(p_uid,quest)
    ON CONFLICT DO NOTHING RETURNING quest INTO s;
  IF s IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Quest already claimed'); END IF;
  reward:=CASE quest WHEN 'capture1' THEN 250 WHEN 'wins5' THEN 550
    WHEN 'gym1' THEN 800 WHEN 'guild1' THEN 400 ELSE 600 END;
  gems_reward:=CASE quest WHEN 'gym1' THEN 15 ELSE 5 END;
  UPDATE public.amberlings_players SET coins=least(2000000000,coins+reward),
    gems=least(2000000000,gems+gems_reward) WHERE user_id=p_uid;
  msg:='Quest completed! Reward granted';
 END IF;
 snap:=public.amberlings_action(p_uid,'state','{}'::jsonb);
 RETURN snap || jsonb_build_object('social',public.amberlings_social_state(p_uid),
    'message',msg,'ok',true);
END $function$

REVOKE ALL ON FUNCTION public.amberlings_social_action(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.amberlings_social_action(uuid,text,jsonb) TO service_role;
