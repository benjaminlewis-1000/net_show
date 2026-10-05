# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A full-screen photo slideshow web app (React + Vite) that pulls a personal photo library from a private backend API (a "Picasa"-style image server, unrelated to Google Picasa) and cycles through it using Swiper. Deployed via Docker/Traefik behind a domain configured in `.env`.

## Commands

All app code lives under `project_root/`, not the repo root — run npm commands from there:

```
cd project_root
npm run dev      # vite dev server on :3000
npm run build    # production build to project_root/dist
npm run preview  # serve the production build locally
```

There is no lint or test setup in this repo.

### Docker

`docker-compose.yml` builds from the root `Dockerfile` (which copies from `project_root/`), maps container ports 3000 (vite dev) and 5000 (`serve -s dist`) to host 8084/8085, and bind-mounts `project_root/` into the container for live editing. `/start.sh` (generated in the Dockerfile) runs `npm run build` then serves `dist/` with `serve` on port 5000 — the container always serves a production build, not the dev server, despite exposing both ports.

## Configuration

Runtime config comes from `project_root/.env`-style Vite env vars, read via `import.meta.env`:
- `VITE_BASE_URL` — base URL of the backend image API
- `VITE_PICASA_API_KEY` — sent as the `X-Slideshow-Key` header on every request

The root-level `.env` (used by docker-compose, not Vite) sets `WEBAPP_DOMAIN` for the Traefik router rule.

## Architecture

**`App.jsx`** owns all data fetching and is the only place that talks to the backend:
- Parses frontend-only URL params (`slide_len`, `help`, `debug_limit`, `cronological`) off `window.location.search`, then builds a *separate* query string with those stripped before calling the backend (the backend 500s if it sees params it doesn't understand).
- On mount, fetches the access key (`api/parameters`) and the image ID list (`api/image_list/`) in parallel via `Promise.all`, shuffles the ID list client-side unless `cronological` is set, then hands `image_ids` + `img_access_key` + `base_url` down to `Slideshow`.
- Image URLs are built on demand as `{base_url}api/keyed_image/slideshow/?id={id}&access_key={key}` — the app never fetches actual image bytes itself, only the ID list.
- `?help` shows a static usage page instead of the slideshow.

**`Slideshow.jsx`** is a windowed, infinitely-looping Swiper carousel — the core piece of nontrivial logic in the repo:
- Only a sliding window of `2*BUFFER+1` (`BUFFER = 10`) slides around the current position is ever mounted in the DOM, regardless of library size (tested with 200,000+ photos).
- `currentIndex` counts up forever (never clamped/wrapped); the window is expressed in these unbounded logical positions and only mapped to a real `image_ids` index with `% total` when building slide content (`windowIds`) — this is what makes forward looping seamless.
- Extending the window backward (prepending) shifts every mounted slide's position, so a "compensating" zero-duration `slideTo()` runs in a `useEffect` keyed on `windowStart` to keep Swiper's visible slide in place.
- Prev/next availability (`isFirst`/`isLast`) is pushed onto the Swiper instance imperatively (`allowSlidePrev`/`allowSlideNext` + `navigation.update()`) rather than trusted to Swiper's declarative props, which don't reliably re-apply after init.
- Autoplay's countdown is restarted on every transition (manual or automatic) in `handleTransitionEnd`, so a manual navigation always gets a full `slide_len` before autoplaying again.

**`ErrorBoundary.jsx`** wraps `Slideshow` only — a rendering error there won't take down the loading screen or the `?help` view.

`Playground.jsx`, `RealDataTest.jsx`, and `sshow_reasonable.jsx` are not wired into `main.jsx` — they're kept-around scratch/experimental components, not part of the live app.
