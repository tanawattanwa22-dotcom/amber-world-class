# MONSTER WORLD ONLINE — V0.2.4 REBUILD

Date: 2026-10-28

## Design and UX changes
The former cramped, emoji-heavy V0.1 interface is replaced with a consistent dark-blue fantasy adventure UI:
- Desktop sidebar, touch-friendly Android navigation bar and clear HUD for coins, capture balls, mode and trainer.
- Primary path: choose starter → explore → battle → capture → team → evolve.
- Rebuilt Battle, Starter, Explorer, 100-Species Book, Creature Detail, Team, Evolution, World Map (10 regions), Bag, Shop, Quest, Ranking and Profile interfaces.
- 25 creature family silhouettes in 4 evolution variations = 100 art cells, **not 100 individually hand-painted HD anime illustrations**.
- New standalone `creatures-100-v2.svg` illustrated vector atlas and region background integration.
- Legible mobile cards, health bars, level requirements, rarity distinctions, inventory counts and unlocked/locked map states.

## Combat changes (online authoritative AND demo)
- Fast attack: lower damage and reduced counterattack.
- Element attack: receives advantage against designated opposing elements.
- Heavy attack: stronger damage, slightly increased counterattack.
- Burst attack: charged and available after two earlier turns in a battle.
- Correct XP rollover on multi-level ups (up to level 80), do not waste potions when the whole team is healthy.
- Daily reward reset uses Bangkok calendar day on the server.

## Compatibility / backups
- Old Monster World V0.1 is preserved in `public/monster-world/legacy.html` and uses `game-legacy.js` + `style-legacy.css`.
- Original Amber World Class V0.9 remains in `public/amber-classic.html`.
- No migration, wipe, deletion or rewriting of `awc_pet_owned` or player accounts.
- No access or changes to the **55 AMBERLANDS** Supabase project or repository.
- Supabase RPG combat RPC updated and version-controlled at `supabase/monster-world/002_server_actions.sql`.

## Tests run
- Client JavaScript syntax parse: PASS.
- 100 unique independent art cells in SVG: GitHub Actions validation; last successful workflow also confirms updated art.
- Server rollback transactions: quick/element/burst moves, burst gate, HP-full guard, XP rollover, starter/explore tests: PASS.
- Existing RLS: authenticated direct UPDATE on player/pet tables disabled, privileged RPC service_role-only (verified earlier).
- **Still needs manual QA on real Android devices and multiple signed-in accounts.**

## Not implemented or not production ready
- 100 unique high-resolution illustrated/animated monster sprite sheets.
- Real-time shared 2D overworld, synchronized PvP battles, guilds, auctions, player trading, co-op dungeons.
- Real-world browser-load and performance profiling, large concurrent-user load test, matchmaking, email deliverability check.

## Live paths
- New game: https://tanawattanwa22-dotcom.github.io/amber-world-class/monster-world/
- Backup V0.1: https://tanawattanwa22-dotcom.github.io/amber-world-class/monster-world/legacy.html
- Classic AMBER WORLD CLASS: https://tanawattanwa22-dotcom.github.io/amber-world-class/amber-classic.html
