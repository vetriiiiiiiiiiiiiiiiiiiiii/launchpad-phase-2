# Launchpad — 26 October 2026

One day. Three launches. A React (Vite) site with a small Node content server
and an admin panel.

## Run it

```bash
npm install
cp .env.example .env   # then set ADMIN_PASSWORD
npm run dev            # site on http://localhost:5173, content server on :8787
npm start              # production: builds, then serves site + API on $PORT (default 8787)
```

## Admin panel — `/asdfghjkl`

Open `http://localhost:5173/asdfghjkl` (or `https://your-domain/asdfghjkl`). The address is
unlisted and not linked anywhere on the site, but the password is what protects it.

Sign in with `ADMIN_PASSWORD` from `.env`. You can change:

- **Every photograph**, grouped by section: upload a file (JPG, PNG, WebP, AVIF,
  up to 40 MB, or drop it on the picture), paste an Unsplash photo link or any
  `https://` image URL, or reset to the default.

### Automatic ratio fix and compression

Every upload goes through three steps in the browser before it's saved:

1. **Ratio fix** — each spot has a fixed shape, shown on its picture (e.g. `16:9 · 2400px`).
   A crop window opens at exactly that ratio; drag the photo to choose what shows
   and zoom if needed. The photo is cropped to that ratio, so nothing is stretched.
2. **Resize** — scaled down to the width that spot needs (2400px for the hero, less
   elsewhere). Photos are never enlarged; you're warned if one is too small.
3. **Compress** — saved as WebP at quality 0.82 (JPEG on browsers without WebP),
   typically 85–95% smaller than a phone or camera original. The before/after
   size is shown under the picture.

Pasted Unsplash links are already resized and compressed by Unsplash; other
pasted links are used as-is, so uploading is better.
- **Event settings**: the line above the hero headline, the countdown target
  (doors-open date and time), and the registration link used by
  "Enter Launchpad" and the final "Be in the room".

Saved content lives in `server/data/content.json`, uploads in
`server/data/uploads/` (both gitignored). Changes appear on the next page load.
Without the content server (pure static hosting) the site uses its built-in
defaults and the admin panel can't save.

## Hosting

Needs a Node host (Render, Railway, a VPS…) running `npm start`, with
`ADMIN_PASSWORD` set and a persistent disk for `server/data/`.

## Structure

```
server/index.js        content API, admin sign-in, uploads; serves dist/ in production
src/App.jsx            routes (/, /launches, /asdfghjkl admin), page transition, global layers
src/pages/             Home, LaunchesPage, Admin
src/sections/          one component per chapter of the home page
src/components/        Nav, Cursor, Photo, StageCanvas, FlapClock, Loader…
src/lib/               images (photo slots), content (settings), curtain3d, launch3d, scroll
src/styles/            site.css, launches.css, react.css, admin.css
public/assets/logos/   RS Foundation and SRM marks (as supplied)
```

## Still to supply

- Product imagery for the three launches (currently veiled on purpose)
- Speaker names for the lineup
