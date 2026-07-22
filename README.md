# 2026.rasa.com

Landing page for Rasa's video series on the architecture of production AI agents.

Deployed on Netlify at [2026.rasa.com](https://2026.rasa.com).

## Structure

- `index.html` — the site (single page, vanilla HTML/CSS/JS)
- `cymatics.js` — canvas animation engine for the hero + motif tiles
- `assets/` — fonts, thumbnails, videos, brand SVGs
- `netlify/functions/vote.mjs` — Netlify Function that records video votes + follow-up emails in Upstash Redis (served at `/api/vote`)
- `netlify/functions/track.mjs` — Netlify Function that records video view events in Supabase (served at `/api/track`)
- `netlify/edge-functions/og-inject.js` — Netlify Edge Function that injects per-video Open Graph tags for the video routes (plain and `/:code` tracking-code deep links)
- `netlify.toml` — rewrites the per-video URLs to `/index.html` so deep links resolve, and wires up the functions
- `llms.txt` — LLM-readable description of the series
- `_vercel-legacy/` — the previous Vercel config (`vercel.json`, `middleware.js`, `api/vote.js`, `api/track.js`), kept for reference

## Video routes

Each video has a deep-linkable URL that opens the lightbox on page load, with an optional tracking-code segment:

- `/multitasking` (and `/multitasking/:code`)
- `/memory` (and `/memory/:code`)
- `/skills` (and `/skills/:code`)
- `/self-improving` (and `/self-improving/:code`)

## Local preview

It's a static site — open `index.html` in a browser, or run any static server from the repo root. To exercise the APIs and OG injection locally, run `netlify dev` (requires the [Netlify CLI](https://docs.netlify.com/cli/get-started/) and the environment variables below).

## Reading votes

```
GET /api/vote?secret=$ADMIN_SECRET&limit=100
```

Returns per-topic counts plus the most recent votes (with emails merged in).

## Environment variables

Set these in Netlify (Site configuration → Environment variables):

- `KV_REST_API_URL` — Upstash Redis REST URL (vote API)
- `KV_REST_API_TOKEN` — Upstash Redis REST token, read/write (vote API)
- `ADMIN_SECRET` — secret guarding the admin GET on `/api/vote`
- `SUPABASE_URL` — Supabase project URL (track API)
- `SUPABASE_ANON_KEY` — Supabase anon key (track API)

See `DEPLOY.md` for full deployment steps.
