# AMBER WORLD CLASS – Security and Operations (V0.3)

## Immutable project boundaries
- GitHub write target: `tanawattanwa22-dotcom/amber-world-class`.
- Supabase write target: `uykldiwsjgctgvtuocxn`.
- Do NOT modify or query the old 55 AMBERLANDS project for this game's player data.

## Trust boundary
- Chrome is UNTRUSTED: it may request `move/attack/skill/travel/potion/chooseClass/allocateStat` but never specify XP, HP, rewards or direct coordinates.
- The Edge Function `awc-action` requires a Supabase Auth JWT, validates identity via `auth.getUser(jwt)`, limits actions/fields and calls server RPC.
- Database function `public.awc_server_action` uses server-side cooldown tables, row locks, monster HP, anti-teleport movement limits, legal levels/jobs and transactionally awards XP/Gold.
- Execution is revoked from `PUBLIC, anon, authenticated` and granted to `service_role` only.
- RLS is enabled on every public game table. User-facing read policies are for owner-only character, inventory and audit. No browser INSERT/UPDATE.
- `awc_action_timing` and `awc_world_mobs` have NO RLS policies intentionally: the browser must not access them.
- The key `sb_publishable_...` is allowed in `public/config.js`. The `SUPABASE_SERVICE_ROLE_KEY` secret belongs only in Supabase's private Edge environment; NEVER publish it.

## Manual operational steps (not yet completed by tools)
1. GitHub `Settings → Pages → Source: GitHub Actions`. Verify successful deployment and test mobile UI.
2. In the NEW Supabase project's Auth URL Configuration, set Site URL and Redirect URLs to `https://tanawattanwa22-dotcom.github.io/amber-world-class/`. For Google login, enable Google provider with its OWN credentials. Email/password sign-in is available in client already.
3. Test sign-in with two real, separate non-admin accounts and verify own-data isolation, player visibility, leaderboard and persistence after refresh.
4. Set spending alerts and usage monitoring before inviting many players. Polling may produce substantial DB and Edge invocation volume.
5. Run a full security review, performance/load tests, error logging and recovery before public launch.

## Verified database test coverage
- Synthetic users created INSIDE a transaction that was rolled back; no test accounts remained.
- Character/login, legitimate movement, impossible direction rejection, travel level gate, job level gate.
- Attack distance validation, damage, exp/gold reward, audit entry, one-time mob death, cooldown.
- Monster proximity damage, top-three list, peer list and stat allocation with point exhaustion.
- Direct authenticated role has no UPDATE on progression tables and no EXECUTE on protected RPC.

## Intentional limitations
- This is a prototype, not a full anti-cheat solution; collidable terrain, item trading, realtime lag compensation and packet abuse testing are unfinished.
- The Edge API is stateless request/polling, not a persistent tick-synchronized WebSocket world. Multiplayer PvP will need additional architecture.
- GitHub Pages activation and live OAuth/login are not verified end-to-end yet.

## References
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Edge auth](https://supabase.com/docs/guides/functions/auth)
- [GitHub Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
