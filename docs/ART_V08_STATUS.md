# AMBER WORLD CLASS — Original Character Art V0.8

This is a real, incrementally shipped artwork change, without touching the old 55 AMBERLANDS project or game server rules.

## Shipped original assets
- public/assets/portraits/sword-concept-v08.svg: SINGLE source-generated full-body Sword illustration with transparency, not cropped from a multi-subject collage.
- public/assets/portraits/sword-portrait-v08.svg: matching original upper-body portrait.
- public/assets/sprites/sword-idle-front-4f-v08.svg: 4-frame DOWN-facing idle atlas (192x288 each frame, 210ms/frame), with subtle breathing and cape sway derived from that original artwork.
- public/hd-art-v08.html: mobile browser page showing original art and animating the four-frame sheet.

## In game
- Sword HUD portrait and Character panel use the new high-detail art. System menu has a link to the HD Art gallery.
- Existing 8-direction gameplay sheet remains untouched because the new art does not have verified other-direction animation frames. All gameplay/XP/Supabase server behavior remains unchanged.

## Missing work (not completed)
- Independently illustrated 8-directions across idle/walk/attack/cast/hurt/die for all four classes.
- High-quality matching monster art 48 unique, 10 bosses, 120 genuine 20-frame skill animations.
- Full quality ten maps as standalone tiles/object sets and collision geometry.
- GitHub Pages successful deployment of this commit not yet verified.

## Source and frame contract
- Self-contained SVG files embed transparent WebP source art as data: URI, no remote dependency.
- The real Sword idle 4-frame sheet is 768x288; cell 192x288, row 0, frames 0..3. A single frontal original is not an eight-direction sprite sheet.
- Never use reference poster crops as game assets or assert directions/actions are complete unless each has separately inspected real frames.
## Playable integration V0.8.2 (new)
- `public/game.js` now displays **actual original four-frame HD Sword idle** on the world canvas when local/peer Sword or Novice stands still facing DOWN; frame advances every 210ms. It does not replace other animation directions with fake rotations.
- Characters retain original wing layer behind the 4-frame HD image. Walking, attacks, casts, damage, death and seven other directions continue using existing V0.7 atlases so combat and positions remain unchanged.
- `public/index.html` uses refreshed `?v=082` game and CSS URLs for Android Chrome cache updates.
- `tools/verify_hd_sword_v08.py` and GitHub Pages workflow now check the original SVG-embedded transparent four-frame atlas (192×288/frame) before release.
- No Supabase, server-side combat, authentication, old 55 AMBERLANDS resources or existing saves were touched in this art patch.
- This is not full delivery of the requested reference-quality assets for four classes, 48 monsters, 10 bosses and 120 skills. Those high-quality, individually illustrated animation sets remain unbuilt.
