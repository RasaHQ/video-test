# 2026.rasa.com

Landing page for Rasa's video series on the architecture of production AI agents.

Deployed on Vercel at [2026.rasa.com](https://2026.rasa.com).

## Structure

- `index.html` — the site (single page, vanilla HTML/CSS/JS)
- `cymatics.js` — canvas animation engine for the hero + motif tiles
- `assets/` — fonts, thumbnails, videos, brand SVGs
- `api/vote.js` — Vercel function that records video votes + follow-up emails in Vercel KV
- `middleware.js` — injects per-video Open Graph tags for `/multitasking`, `/memory`, `/skills`, `/self-improving`
- `vercel.json` — rewrites the per-video URLs to `/index.html` so deep links resolve
- `llms.txt` — LLM-readable description of the series

## Video routes

Each video has a deep-linkable URL that opens the lightbox on page load:

- `/multitasking`
- `/memory`
- `/skills`
- `/self-improving`

## Local preview

It's a static site — open `index.html` in a browser, or run any static server from the repo root. The vote API and OG injection only work on Vercel.

## Reading votes

```
GET /api/vote?secret=$ADMIN_SECRET&limit=100
```

Returns per-topic counts plus the most recent votes (with emails merged in).
