# Deploying to Netlify

This site was ported from Vercel. Everything Netlify needs is in the repo
(`netlify.toml`, `netlify/functions/*.mjs`, `netlify/edge-functions/og-inject.js`).
The vote data lives in the same Upstash Redis instance the Vercel deployment
used, and view tracking writes to the same Supabase table, so both carry over
with no migration.

## 1. Connect the repo

In the Netlify dashboard: **Add new site → Import an existing project →
GitHub → `RasaHQ/video-test`**. Netlify reads build settings from `netlify.toml`
(publish `.`, functions `netlify/functions`) and installs `@upstash/redis` from
`package.json` when it bundles the functions.

## 2. Set environment variables

**Site configuration → Environment variables.** Add all five:

| Key | Used by | Notes |
| --- | --- | --- |
| `KV_REST_API_URL` | `/api/vote` | Upstash Redis REST URL |
| `KV_REST_API_TOKEN` | `/api/vote` | Upstash Redis REST token (read/write) — secret |
| `ADMIN_SECRET` | `/api/vote` | guards the admin GET — secret |
| `SUPABASE_URL` | `/api/track` | Supabase project URL |
| `SUPABASE_ANON_KEY` | `/api/track` | Supabase anon key — secret |

Copy the values from the Vercel project's environment settings (the Upstash
values are also in the local `.env`; `ADMIN_SECRET` and the Supabase values were
Vercel-only).

## 3. Deploy & verify

After the first deploy:

- `/` loads.
- `/memory` (and `/skills`, `/multitasking`, `/self-improving`, plus their
  `/:code` variants) load with per-video OG tags via the edge function —
  `curl -s https://<site>/memory | grep 'og:title'`.
- `/orchestration` loads `index.html` (no custom OG tags — matches the original).
- Cast a test vote, then read it back:
  `curl "https://<site>/api/vote?secret=$ADMIN_SECRET&limit=5"`.
- Play a video and confirm rows land in the Supabase `video_views` table.

## 4. Custom domain

Point `2026.rasa.com` at the new site under **Domain management**, then remove
the domain from the old Vercel project so DNS resolves to Netlify.

## Notes on the port

- `api/vote.js` → `netlify/functions/vote.mjs`; `@vercel/kv` → `@upstash/redis`
  (same Upstash instance, same key names and JSON format).
- `api/track.js` → `netlify/functions/track.mjs` (unchanged Supabase REST logic).
- Both moved from Vercel's `(req, res)` handler to the Web-standard
  `(request)` → `Response` signature of Netlify Functions v2, routed via
  `config.path`.
- `middleware.js` → `netlify/edge-functions/og-inject.js`.
- `vercel.json` rewrites → `[[redirects]]` in `netlify.toml`.
- The old Vercel files are preserved under `_vercel-legacy/` for reference.
