# Instructions for Codex — AMBER WORLD CLASS

This repository is an **independent** mobile browser MMORPG. The user has explicitly forbidden changes to the old game.

## Boundaries (non-negotiable)
- Work only in `tanawattanwa22-dotcom/amber-world-class`.
- The only associated Supabase project is `uykldiwsjgctgvtuocxn`. NEVER use, read or mutate Supabase `55-amberlands`.
- NEVER modify/delete/reuse `55amberlands/55amberlands.github.io` or its players/assets.
- Preserve existing character progression, server-owned XP/damage/inventory, JSON protocols, map IDs, sprite origin, HUD controls, and login logic unless separately requested.
- Do not add secrets, service role keys, tokens or real player data to the public repo.

## Current stable art contract, V0.5
- Images live under `public/assets`. Web assets are served from GitHub Pages project subpath, so use relative URLs.
- `maps/map-01.png` through `map-10.png`: exactly 1152 × 1152 PNG; logical world coordinates unchanged.
- `sprites/hero-0.png` through `hero-3.png`: 192 × 384 RGBA; 4 walk columns × 8 direction rows, 48 × 48 cell.
- `sprites/wing-0.png` through `wing-3.png`: SAME cell layout as heroes; always render behind matching character.
- `sprites/boss-00.png` through `boss-09.png`: SAME cell layout; boss image is map-specific. Never substitute enlarged common mob artwork where boss art exists.
- `sprites/mob-0.png` through `mob-9.png`: same cell layout; these are PROTOTYPE species, not full 48 distinct species.
- `effects/skill-0.png` through `skill-3.png`: 384 × 384 RGBA, 4 × 4, 96 × 96 cells; distinct 16-frame alpha sprites, not stationary icons.
- `ui/interface-icons-v05.png`: 384 × 256 RGBA, 6 × 4, 64 × 64 cells. Draw real sprites/particles, not stretched atlas previews.
- `tools/upgrade_assets_v05.py` generates these deterministically from V0.4 baseline. If you rerun it, ensure output really matches intended design before committing. Do NOT run V0.4-only generator at GitHub Pages deployment.

## Safety and testing requirements
- Before making any changes, inspect current files and understand the local code layout. Never start a new client or replace the V0.5 game.
- Any art/code integration must preserve the existing online authoritative Edge Function and RLS schema.
- Test JS syntax, gallery JS, atlas dimensions and frame uniqueness. Run `python tools/verify_asset_frames_v05.py`.
- Deployment is `.github/workflows/pages.yml`, publishing `public/`. Do not enable another competing Pages deployment workflow.
- Art in the README is a prototype, not a promise of final cinematic image quality.
- Unfinished: 120 unique skill sets; 48 unique monster species; full PvP, real-time tick server, party, guild, trading, dungeon, equipment and cosmetic persistence. Do not falsely mark them complete.
