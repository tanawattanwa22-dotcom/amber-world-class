# AMBERLINGS ONLINE V3 — 29 Oct 2026

This release removes public Guest/offline simulation from the deployed game page and uses only verified Supabase sessions.

- GitHub Pages: https://tanawattanwa22-dotcom.github.io/amber-world-class/amberlings/
- Supabase project: `uykldiwsjgctgvtuocxn` (never 55 AMBERLANDS)
- Email+password sign-up/sign-in and Google OAuth use Supabase Auth. Email confirmation may be required.
- Configure Auth -> URL Configuration Site URL/Redirect URLs to the exact GitHub Pages URL.
- For Google OAuth, configure Google Cloud Client ID/Secret on Supabase Auth -> Providers -> Google and whitelist Supabase callback `https://uykldiwsjgctgvtuocxn.supabase.co/auth/v1/callback`.
- Real authoritative data: player, 25 species, captures/battles, shop, inventory, team, daily reward, market transactions and cosmetics.
- 3D scene uses procedural display models keyed to actual server monsters; all geometry is cosmetic, not source of gameplay state.
- No Guest/demo button, no fake player chat or bot battles. Original legacy 3D demo remains recoverable in Git history (before this commit).
- Not implemented: server-authoritative walkable multiplayer 3D world, PvP, gym, guild, realtime chat, or advanced story progression. These are not offered as online features.
- Never put service_role or secret keys in browser or repository.
- Test login with an actual verified account and two users before calling the whole multiplayer game complete.
