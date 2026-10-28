# AMBER WORLD CLASS · Sprite Sheet V0.7

**THIS IS AN ART UPDATE ONLY.** The existing 55 AMBERLANDS repository/database and AMBER WORLD CLASS Supabase project are unchanged.

## Generated Sprite Sheet Contract

| Kind | Count | File path | Grid | Cell | Frames |
|---|---:|---|---|---|---:|
| Hero actions | 24 = 4 classes × 6 actions | `public/assets/v07/heroes/hero-{0..3}-{idle,walk,attack,cast,hurt,die}.png` | 4 columns × 8 directions | 48×48 | 32 per sheet |
| Monsters | 48 | `public/assets/v07/monsters/monster-{00..47}.png` | 4×8 | 48×48 | 32 per sheet |
| World bosses | 10 | `public/assets/v07/bosses/boss-{00..09}.png` | 4×8 | 96×96 | 32 per sheet |
| Skill visuals | 120 = 4 classes × 30 | `public/assets/v07/skills/skill-{0..3}-{00..29}.png` | 5×4 | 80×80 | 20 per sheet |

Total **202 PNG sprite sheets** and **5,024 individual frames** (24×32 + 48×32 + 10×32 + 120×20).

Rows of the 8-direction sheets: Down / Down-Left / Left / Up-Left / Up / Up-Right / Right / Down-Right.

Hero actions: idle, walk, attack, cast, hurt, die.

## How they enter the site

Workflow `.github/workflows/pages.yml` builds these assets from `tools/build_sprite_full_v07.py`, validates the existence/dimensions and frame changes, then packages **the generated `public/` folder** for GitHub Pages.

No previous V0.6 assets are deleted or overwritten. The client uses `v07Image()` and falls back to V0.6 imagery if the new file cannot be loaded. Monsters are visually assigned across the 10 maps without changing server monster IDs, rewards or combat attributes.

The separate `public/sprite-lab-v07.html` is a visual-only atlas inspector with class/action/direction selection and playable frame previews.

## Important limitations

- The 120 sprite sheets are **animated spell effects**. They do *not* constitute 120 implemented gameplay skills, unique damage formulas, cooldowns, or new trusted server actions.
- The 48 sheets are distinct by species/palette/details, but this is a **procedural pixel art foundation**, not the high-detail professional artwork of the user's reference images. Future professional art can replace the PNGs without changing the frame contract.
- Existing map artwork and core UI remain V0.6, while Sprite Lab and sprite rendering are V0.7.
- GitHub Pages deployment success must be checked in Actions. Source commits alone are not confirmation that the public CDN has the generated files.
- Large-scale multiplayer, market, guild, PvP and complete equipment systems are not completed by an art-only patch.

## Test before accepting art

```sh
python -m pip install pillow==11.3.0
python tools/build_sprite_full_v07.py --out public/assets/v07
python tools/build_sprite_full_v07.py --out public/assets/v07 --verify
node --check public/game.js
```

The generator performs frame-by-frame checks: correct atlas dimensions, transparency, no empty frames, nonidentical animation frames and exact file counts.
