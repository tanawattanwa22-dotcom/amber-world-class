# AMBER WORLD CLASS
**Original 2D pixel-art Android/Chrome MMORPG prototype — separate from 55 AMBERLANDS.**

## Project boundaries
- ONLY repository: `tanawattanwa22-dotcom/amber-world-class`.
- ONLY Supabase project: `uykldiwsjgctgvtuocxn` (Singapore).
- Never import, write to, reset, or reuse `55amberlands/55amberlands.github.io` or Supabase `55-amberlands`.
- All game images in this repository were generated as prototype assets, not copied from the reference collage.


## V0.5 Visual Asset Integration (October 28, 2026)
- Preserved V0.4 client gameplay, Supabase RPC, combat/stat logic, save data and four classes.
- Regenerated and **checked in** 10 enriched 1152×1152 pixel-art map backgrounds, retaining the same world-coordinate system.
- Created 10 original transparent boss atlases (`public/assets/sprites/boss-00.png` to `boss-09.png`), each **4 × 8 frames of 48 × 48 px**. Boss now renders from its own dedicated art rather than enlarged common mobs.
- Added four separately animated **paper-doll wing** atlases (`wing-0.png` to `wing-3.png`) in matching frame grids, rendered behind existing character art and aligned by direction/frame.
- Replaced four skill FX PNG atlases, each **4 × 4 frames of 96 × 96 px** with transparent pixels and time-progressing effects. Effects are still **four prototype sets**, not the requested 120 unique final skills.
- Created a 24-icon fantasy UI atlas (6 × 4 frames at 64 × 64 pixels); visual references can be inspected in the repository.
- Expanded `public/asset-gallery.html` to show 10 bosses, wing layers, 10 maps, classes and frame animations.
- **Reproducible workflow:** run `python -m pip install pillow==11.3.0`, then `python tools/upgrade_assets_v05.py`; it first resets V0.4 generated images from the committed baseline generator, then applies V0.5 and writes `public/assets/`. Confirmed deterministic PNG output when rerun.
- GitHub Actions deploys committed images **without running V0.4 generator again**. Old competing deploy workflow is manual-only.
- No existing 55 AMBERLANDS repository or Supabase project was changed.
- The visual result is still **not the same quality as the submitted high-fidelity concept art**, which would require authored high-end character/model sheets, environment art, normal/attack/hurt/death state animation passes and much deeper asset production.

## V0.4 Original Sprite and Map Assets
- 10 original world maps rendered at 1152 x 1152 pixels with distinct terrain palettes and structures.
- 4 **separate character sprite sheets**, each 192 x 384 PNG (RGBA): 8 facing directions, 4 unique walking phases; weapons are drawn aligned to hands.
- 10 **separate monster sheets**, also 8 directions x 4 frames, with distinctive silhouettes; these are base archetypes, not 48 unique finished monster species.
- 4 **transparent combat skill animation sheets**, each 384 x 384 PNG with 16 distinct frames of 96 x 96 pixels. Attack/skill animations are anchored to the world target position, not repeated CSS images.
- The character HUD portrait and job-selection images use those original sprites.
- All art is created by `tools/generate_assets_v04.py` (Pillow 11.3.0), which runs **inside GitHub Pages Actions during deployment** to replace the initial placeholder PNGs in the published website. The binary originals in repository may remain older placeholders until generator runs; deployed site is the authoritative visual sample. Regenerate locally with `python -m pip install pillow==11.3.0 && python tools/generate_assets_v04.py`.
- Art is original procedural pixel illustration, not cropped/repurposed reference images. This is a *first-pass art pack*, NOT yet the final art quality of the supplied visual references.

## What works in V0.4
- Android/Chrome single-page pixel-art demo: 10 newly generated maps, 8-direction sprite sheets, 16-frame animated effects, touch joystick, tap-to-move, combat, potions, AUTO and basic HUD.
- Level 1–100, select one of four classes at level 10: Sword, Archer, Mage, Fighter.
- STR/DEX/INT/POW/VIT points from level-ups, allocated by **server-side database actions**.
- **Supabase Edge backend** `awc-action` (JWT authentication, strict action allowlist, server-only database RPC).
- 10 server world maps with 9 spawn slots each (8 standard + 1 boss = 90 independent spawn slots). Only 10 prototype monster artwork sheets exist; 48 distinct monster species not finished.
- Server-computed movement speed, attack range, HP damage, EXP, Gold, skills, cooldowns, potions, boss deaths/respawns, game saves, nearby players, top-three ranking and combat audit.
- Browser roles are read-own only; no client update/insert rights on progression, world mobs or cooldowns.
- Email signup / login / logout through Supabase Auth. Email verification behavior depends on project settings.
- Google OAuth button is coded but **Google provider setup must be completed in Supabase and Google Cloud** before it will work.

## Repository structure
| Path | Role |
|---|---|
| `public/index.html` | Mobile game page |
| `public/game.js` | Frontend rendering, HUD, input, login and Edge RPC |
| `public/config.js` | PUBLIC Supabase URL, publishable API key and function URL. No secrets. |
| `public/assets/` | 10 generated map images and 14 sprite sheets, built into the published site from source |
| `supabase/functions/awc-action/index.ts` | Deployed trusted Edge gateway |
| `supabase/migrations/` | Reproducible PostgreSQL game schema and server RPC |
| `.github/workflows/pages.yml` | Validate JS and deploy public/ through GitHub Actions |

## Publish on GitHub Pages
Repository Settings → Pages → Build and deployment → **Source: GitHub Actions**.
Workflow `Deploy AMBER WORLD CLASS to GitHub Pages` should publish the `public/` folder.
Expected **URL after confirmed deployment**:
`https://tanawattanwa22-dotcom.github.io/amber-world-class/`

If the Pages site is not active, enable the GitHub Actions source first and check the Actions job. Do not assume a published site merely from a committed workflow.

## Authentication configuration
The browser uses project `uykldiwsjgctgvtuocxn` only.
To enable Google login:
1. Configure Google OAuth provider in this NEW Supabase project Auth → Providers.
2. Register this project's Supabase OAuth callback in Google Cloud, not the old project.
3. Set Auth → URL Configuration → Site URL to the published GitHub Pages URL and add it to Redirect URLs.

Email signup is already offered as a separate option and does not need Google Cloud credentials. Depending on project settings, users may first need to confirm their email.

## Security model
**Never** paste the Supabase `service_role` or a secret key into files under `public/` or GitHub.
The function uses runtime environment secret, verifies every bearer JWT, and invokes database RPC `awc_server_action` as a trusted role. The RPC is explicitly revoked from `anon` and `authenticated`.
RLS-with-no-policy INFO reports on `awc_world_mobs` and `awc_action_timing` are intentional: neither table should be browser-accessible.
Client demo progress in LocalStorage never converts to server progress.

## Remaining work (not production complete)
- Profession-level skill trees: 120 animated skill sprites and balance.
- 48 unique monsters (only prototype sheets for 10), final-quality 10 boss illustrations / behaviors.
- Real parties and shared EXP, guild/PvP, dungeon instances, card collection effects, inventory/equipment enhancement, marketplace and anti-fraud transactional trading.
- Proper pathfinding / wall collision; latency compensation; cross-region tick server; observability; load testing.
- Google OAuth provider and deployment of the public Pages site must be verified.
- Current Edge-based multiplayer is request/polling rather than 60fps authoritative WebSocket transport. Add a dedicated tick server if aiming for highly responsive PvP or larger player concurrency.

## Test / release
Database engine was exercised using a **rollback-only temporary auth user** to assert login, class gate, map gate, hit range, progression, stat allocation, no double attack, combat audit, monster proximity damage, multiplayer peers and ranking.
These DB checks are not a replacement for end-to-end browser login/performance testing.
See GitHub Actions syntax/asset checks before publishing.

**Do not call this finished or launch-ready.** This is V0.5 pixel-art prototype with protected backend persistence.
