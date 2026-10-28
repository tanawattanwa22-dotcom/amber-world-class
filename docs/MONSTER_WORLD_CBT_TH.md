# MONSTER WORLD ONLINE — Creature Collector CBT 0.1

## What changed
This is a NEW original monster-catching game under `public/monster-world/`, hosted as the new landing experience at `https://tanawattanwa22-dotcom.github.io/amber-world-class/`.
It is inspired by the *genre* of monster-collecting games, not an adaptation of Pokemon IP.
The previous AMBER WORLD CLASS HTML game has been backed up at `public/amber-classic.html` and remains available; **nothing is deleted** from older assets. The new game does not load old assets.

## Playable new game systems
- 100 separately indexed creature species: 25 families × 4 distinct evolution stages, with 11 elemental classes.
- 10 regions with level gates; four rarity grades and server-authoritative encounter/capture probability.
- Choose one of three starter creatures; catch more with in-game balls; browse all 100 species in a searchable encyclopedia.
- Build a six-creature active team with storage for up to 300 captured pets per account.
- Server computes damage, wild counterattacks, XP, levels 1–80, monster HP, evolutions at levels 12, 28, 48, and win rewards.
- Capture balls, HP restoration items, coin shop, once-per-day rewards, trainer renaming, quest progress.
- Online saved account profiles, cross-device persistence, leaderboard and online presence.
- Bright 100-cell original **SVG vector creature atlas** with unique visual variations by family/stage: `public/monster-world/creatures-100.svg`. These are **early cartoon prototypes, not final high-definition individually illustrated creature art**.
- 12 menu views (Home, Book, Team, Explore, Battle/Capture, Evolution, World Map, Bag, Store, Quest, Online Rankings, Profile).
- Local demo is independent and stored in browser LocalStorage; never synced to online play.

## Architecture and security
- GitHub public client: `public/monster-world/index.html`, `style.css`, `game.js`, `creatures-100.svg`.
- Supabase **new project of AMBER WORLD CLASS only**: `uykldiwsjgctgvtuocxn`.
- Supabase dedicated Edge Function: `awc-pets` (`supabase/functions/awc-pets/index.ts`).
- Creature database prefix: `awc_pet_*`, isolated from prior `awc_*` and totally separate from **55 AMBERLANDS**.
- Clients authenticate with Supabase Auth, then send only typed actions to Edge Function. The server verifies JWT, uses service-role-only RPC `awc_pet_action` and calculates outcomes itself.
- Tables use RLS; direct client UPDATE/INSERT on player currency, pets, encounters and item stocks are denied. Protected RPC unavailable to `anon` and `authenticated`.
- API transport is HTTPS requests; a realtime synchronous PvP server has **not** been built yet.
- Never insert private service keys into JavaScript or GitHub.

## Tested (rollback-only test accounts)
- Login → starter → explore → attack → attempt capture → buy items → daily reward.
- Daily rewards only once; duplicate starter blocked; inaccessible region blocked.
- Cross-account team edit and evolution blocked.
- Level-gated evolution and team slot assignment enforced.
- One wild encounter at a time, no free skip by spamming explore.
- Catalog count verified exactly 100, 25 families, 25 final forms.
- Role privileges checked: authenticated users cannot call privileged RPC or UPDATE owned pets.

## Known unfinished areas
- Individual hand-painted HD artwork / bespoke animation for all 100 monsters. The vector atlas is initial artwork only.
- Real-time PvP, guilds, friends, chat moderation, player trading, co-op raids, animated world navigation and sound/music.
- Browser-to-server live OAuth/login and high-concurrency load tests need device verification; GitHub Pages deployment must show a successful Actions run.
- The game is therefore **CBT MVP**, not a complete production MMO.

## How to run / rollback
- [New game](https://tanawattanwa22-dotcom.github.io/amber-world-class/)
- [New game direct](https://tanawattanwa22-dotcom.github.io/amber-world-class/monster-world/)
- [Old game preserved](https://tanawattanwa22-dotcom.github.io/amber-world-class/amber-classic.html)
- [GitHub Pages Actions](https://github.com/tanawattanwa22-dotcom/amber-world-class/actions/workflows/pages.yml)

## Art and licensing
All monsters in the running vector atlas are original programmatic illustrations, **not** cropped from Pokemon artwork or any promotional collage, and nothing has been imported from AMBER WORLD CLASS V0.9. More detailed bespoke illustrations are still required for final art quality.
