-- Amberlings live fashion SQL source. Only apply to Supabase amber-world-class.
BEGIN;
CREATE OR REPLACE FUNCTION public.amberlings_cosmetic_action(p_uid uuid, p_action text, p_args jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
 p public.amberlings_players%ROWTYPE;
 item public.amberlings_item_catalog%ROWTYPE;
 mon_id uuid;
 skin_num int;
 msg text;
 answer jsonb;
BEGIN
 IF p_uid IS NULL OR p_action NOT IN ('cosmetic_buy','cosmetic_equip','cosmetic_skin')
   OR jsonb_typeof(p_args) IS DISTINCT FROM 'object' THEN
   RETURN jsonb_build_object('ok',false,'error','Invalid cosmetic request');
 END IF;
 SELECT * INTO p FROM public.amberlings_players WHERE user_id=p_uid FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Sign in first'); END IF;
 IF p.starter_species IS NULL THEN
   RETURN jsonb_build_object('ok',false,'error','Choose starter first');
 END IF;
 SELECT * INTO item FROM public.amberlings_item_catalog
  WHERE id=p_args->>'item' AND kind IN ('cosmetic','skin');
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Unknown cosmetic'); END IF;
 IF p_action='cosmetic_buy' THEN
   IF item.price_gems<=0 OR item.price_gems>1000000 THEN
     RETURN jsonb_build_object('ok',false,'error','Not on sale'); END IF;
   IF EXISTS(SELECT 1 FROM public.amberlings_inventory
     WHERE owner_id=p_uid AND item_id=item.id AND quantity>0) THEN
     RETURN jsonb_build_object('ok',false,'error','Already owned'); END IF;
   UPDATE public.amberlings_players SET gems=gems-item.price_gems
     WHERE user_id=p_uid AND gems>=item.price_gems;
   IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Not enough gems'); END IF;
   INSERT INTO public.amberlings_inventory(owner_id,item_id,quantity)
     VALUES(p_uid,item.id,1)
     ON CONFLICT(owner_id,item_id) DO UPDATE SET quantity=public.amberlings_inventory.quantity+1;
   msg:='ซื้อแฟชั่นด้วยเจมสำเร็จ';
 ELSIF p_action='cosmetic_equip' THEN
   IF item.kind<>'cosmetic' OR item.slot NOT IN ('out','hat','back','fx') THEN
     RETURN jsonb_build_object('ok',false,'error','Invalid fashion slot'); END IF;
   IF NOT EXISTS(SELECT 1 FROM public.amberlings_inventory
       WHERE owner_id=p_uid AND item_id=item.id AND quantity>0) THEN
     RETURN jsonb_build_object('ok',false,'error','Cosmetic not owned'); END IF;
   UPDATE public.amberlings_players
     SET equipped=jsonb_set(coalesce(equipped,'{}'::jsonb),ARRAY[item.slot],to_jsonb(item.id),true)
     WHERE user_id=p_uid;
   msg:='สวมแฟชั่นสำเร็จ';
 ELSIF p_action='cosmetic_skin' THEN
   IF item.kind<>'skin' OR item.id !~ '^skin([1-9]|10)$' THEN
     RETURN jsonb_build_object('ok',false,'error','Invalid monster skin'); END IF;
   BEGIN mon_id=(p_args->>'monsterId')::uuid;
   EXCEPTION WHEN others THEN RETURN jsonb_build_object('ok',false,'error','Invalid monster'); END;
   IF NOT EXISTS(SELECT 1 FROM public.amberlings_monsters
        WHERE id=mon_id AND owner_id=p_uid AND escrow_listing_id IS NULL) THEN
     RETURN jsonb_build_object('ok',false,'error','Monster not owned'); END IF;
   UPDATE public.amberlings_inventory SET quantity=quantity-1
     WHERE owner_id=p_uid AND item_id=item.id AND quantity>0;
   IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Skin item not owned'); END IF;
   skin_num=substring(item.id from 5)::int;
   UPDATE public.amberlings_monsters SET skin_index=skin_num WHERE id=mon_id AND owner_id=p_uid;
   msg:='ใช้สกินกับมอนสเตอร์สำเร็จ';
 END IF;
 INSERT INTO public.amberlings_events(actor_id,type,details)
    VALUES(p_uid,p_action,jsonb_build_object('item',item.id,'monsterId',mon_id));
 answer:=public.amberlings_action(p_uid,'state','{}'::jsonb);
 RETURN jsonb_set(answer,'{message}',to_jsonb(msg));
END $function$
REVOKE ALL ON FUNCTION public.amberlings_cosmetic_action(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.amberlings_cosmetic_action(uuid,text,jsonb) TO service_role;
COMMIT;
