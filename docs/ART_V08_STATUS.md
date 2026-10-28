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