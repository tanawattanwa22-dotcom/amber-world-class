# AMBERLINGS ONLINE Social V4 (CBT)

This patch deploys real Supabase-backed online modules: public guilds (up to 40 members, leader transfers, kicks), friend requests, world/guild text chat with reporting and 3-second rate limit, consent-based turn PvP, 3 solo gyms and one-time quests. All state changes are server RPC only, authenticated using the existing Supabase Edge gateway.

- Project Supabase: `uykldiwsjgctgvtuocxn`; repository: `tanawattanwa22-dotcom/amber-world-class`.
- Do not merge with 55 AMBERLANDS. Legacy AWC game files remain isolated.
- PvP is turn-based; one currently pending or active duel per player and no coins from duel results.
- Chat uses 12-second foreground polling, not WebSocket or instant push; abuse reports are stored for manual review (automated moderation is not installed).
- Gyms are 3 server-calculated solo instances with one-time first-clear rewards, not an open-world synchronous boss instance.
- No AI players, fake guilds, fake PvP opponents or simulated chat. Requires at least two actual registered users for social multiplayer.
- Google sign-in requires Supabase Auth Google provider credentials configured in dashboard. Email signup may require email verification/SMTP.
- New tables `public.amberlings_*` all have RLS and no direct browser write/read permissions; functions only executable by service_role.
- SQL: `supabase/amberlings/005_social_schema.sql`, `006_social_actions.sql` (for deploying to a fresh dedicated instance after core migrations).
- TODO before public scale: chat moderation/admin tools, spam abuse tooling, friend privacy and block/mute, long-lived PvP timeout and PvP rating/season prizes, real-time push, full guild war and dungeon matchmaking.
