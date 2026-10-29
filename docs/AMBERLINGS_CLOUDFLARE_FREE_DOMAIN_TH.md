# AMBERLINGS ONLINE — free game-name URL (Cloudflare Pages)

Target project name: `amberlings-online` (subject to availability).
New production URL, once created: `https://amberlings-online.pages.dev/`.
Do not assume it exists until Cloudflare confirms the first deployment.

## Connect the existing game without copying or deleting projects

1. Log in to https://dash.cloudflare.com/ and open **Workers & Pages**.
2. Create application > Pages > **Connect to Git** and authorize GitHub.
3. Select the **existing** repository `tanawattanwa22-dotcom/amber-world-class`.
4. Choose **Project name:** `amberlings-online` (if taken, choose a close alternative and update the actual URL below).
5. Choose **Production branch:** `main`.
6. **Framework preset:** None; **Build command:** leave blank (or `exit 0`); **Build output directory:** `public`; **Root directory:** repository root (blank).
7. **Save and Deploy**. Cloudflare serves `public/` at the new domain; `public/_redirects` sends the homepage to `/amberlings/`.
8. Confirm the exact `*.pages.dev` production URL from Cloudflare Pages dashboard, not from an unverified guess.

## AFTER the domain has been created (OAuth must come second)

- Update allowed origin in `supabase/functions/amberlings-action/index.ts` to include the **actual** `https://<game-name>.pages.dev`. Deploy the Edge Function again. Do not grant the client direct table write permissions.
- Set Supabase Auth **Site URL** and **Redirect URLs** to `https://<game-name>.pages.dev/amberlings/`.
- In Google Cloud OAuth **Authorized JavaScript origins**, enter `https://<game-name>.pages.dev` (no path), and **Authorized redirect URI** `https://uykldiwsjgctgvtuocxn.supabase.co/auth/v1/callback`.
- Enter Google OAuth Client ID/Secret in Supabase Auth > Sign in / Providers > Google. Never commit the secret.
- Test sign-in on the new domain and two actual player accounts before inviting the public.

**Safety:** Leave the old GitHub Pages URL working during cutover; do not touch the unrelated 55 AMBERLANDS project or merge in the separate `amberlings-online` repository, which has a different schema.

Sources: https://developers.cloudflare.com/pages/get-started/git-integration/ and https://developers.cloudflare.com/pages/configuration/redirects/
