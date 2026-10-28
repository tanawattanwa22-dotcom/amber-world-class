# AMBER WORLD CLASS — Visual Asset V0.9 (verified status)

**Repository:** `tanawattanwa22-dotcom/amber-world-class` ONLY. **Database:** unchanged. No files from 55 AMBERLANDS are used or edited.

## What this patch actually delivers
- The live game's **Skills** menu renders animated 20-frame previews of 30 sprite FX for the currently selected class. Across four classes there are 120 visual FX sheets.
- Choose any of these 30 FX previews to set the sprite animation rendered for a successful skill attack. This is a visual selection only; it does not grant or alter combat abilities.
- Per-map monster visual indexing now chooses 8 different sprite indices for 8 spawn slots, instead of repeating 5 appearance indices.
- Game **System** menu opens the existing `sprite-lab-v07.html` gallery, giving access to the generated 4 classes × 6 action sheets, 48 monster sheets, 10 boss sheets and 120 FX sheets.
- Client JS/CSS are cache-busted in V0.9 HTML. No PostgreSQL schema, Supabase Edge Function, or server combat rules changed.

## Asset verification done from the existing V0.7 ZIP
- Actual archive inspected: `AMBER_WORLD_CLASS_V07_FULL_SPRITES.zip`.
- **202 PNG sprite sheets / 5,024 individual rectangular frames**.
- 24 hero action sheets (4 classes × 6 actions; each with 4 columns × 8 direction rows): 768 frames.
- 48 monster sheets, each with 32 cells: 1,536 frames.
- 10 boss sheets, each with 32 cells: 320 frames.
- 120 skill FX sheets, each with 5 × 4 cells: 2,400 frames.
- **0 empty-alpha cells; 0 invalid sheet dimensions; 202 different file hashes.** Checked locally using Pillow and ZIP bytes.
- The repository's GitHub Actions runs `tools/build_sprite_full_v07.py` before Pages upload; the source PNG files generated at deploy time are *not* all individually committed in Git.
- Actual public GitHub Pages deployment and mobile login/visual QA remain to be verified separately.

## Quality and completeness, honestly
- **Art direction target NOT met.** Existing V0.7 generated sheets are low-detail procedural pixel art, *not* faithful high-definition fantasy-chibi artwork like the six reference boards.
- V0.8 provides exactly one independent high-detail Sword FRONT idle sheet with 4 actual frames (with a render fallback for other actions and directions).
- The 120 FX sheets are 120 **visual prototypes**, not a server-authoritative 120-ability skills system.
- Animated equipment layers, quality-matched four-class 8-direction HD animations, 48 distinct high-detail monsters, 10 polished bosses, complete tile/object sets, collisions, and other MMORPG systems remain unfinished.

## Source frame geometry
| Group | Relative directory | Individual PNG sheet | Frame | Grid |
|---|---|---:|---:|---:|
| Heroes | `public/assets/v07/heroes/` | 192 × 384 | 48 × 48 | 4 × 8 |
| Monsters | `public/assets/v07/monsters/` | 192 × 384 | 48 × 48 | 4 × 8 |
| Bosses | `public/assets/v07/bosses/` | 384 × 768 | 96 × 96 | 4 × 8 |
| Skills | `public/assets/v07/skills/` | 400 × 320 | 80 × 80 | 5 × 4 |
| One Sword HD idle | `public/assets/sprites/sword-idle-front-4f-v08.svg` | 768 × 288 | 192 × 288 | 4 × 1 |

## Scope guard
Do not confuse image concept collages with ready-to-integrate assets. Do not crop source reference boards into game sprites, artificially duplicate frames, claim unverified asset completeness, or change combat logic to showcase visual art.
