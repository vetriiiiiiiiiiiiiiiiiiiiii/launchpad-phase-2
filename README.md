# Launchpad — 26 October 2026

One day. Three launches. A React (Vite) site with a small Node content server
and an admin panel.

## Run it locally

```bash
npm install
cp .env.example .env   # set DATABASE_URL, DIRECT_URL and ADMIN_PASSWORD
npm run db:deploy      # apply committed migrations to the database
npm run dev            # site on http://localhost:5173, API on :8787
```

Create the PostgreSQL database before starting the app. `DATABASE_URL` is the
runtime connection. `DIRECT_URL` is used by Prisma migrations and can be the
same value unless your provider requires a direct connection separate from its
pooled runtime URL. `npm run dev` applies committed migrations automatically;
`npm run db:dev` is available when creating or editing migrations.

Use Node.js 22.9 or newer. The production command is `npm start`; it builds the
site, applies committed migrations, then starts the API and serves the site on
`PORT` (default 8787).

## Search and sharing metadata

The build emits separate HTML metadata for `/` and `/launches`, so each route
has its own title, description, canonical URL, Open Graph/Twitter preview, and
structured data before client-side JavaScript runs. It also generates
`robots.txt` and `sitemap.xml`. The admin route is marked `noindex, nofollow`
and is excluded from the sitemap. The home page adds Event data only after a
venue or city is configured in Admin; its FAQ data follows the published FAQs.

Set `SITE_URL` to the public HTTPS origin (for example `https://example.com`)
in the deployment environment. The production build requires this setting and
uses it for canonical URLs, the sitemap, and social preview URLs. Since the
public domain has not been chosen yet, local builds use the current browser
origin for client-side canonical tags and omit the absolute sitemap until
`SITE_URL` is set.

## Admin panel — `/asdfghjkl`

Open `http://localhost:5173/asdfghjkl` (or `https://your-domain/asdfghjkl`). The address is
unlisted and not linked anywhere on the site, but the password is what protects it.

Set `ADMIN_PASSWORD` in `.env` for local use. Production startup refuses to run
unless `ADMIN_PASSWORD` is at least 16 characters. Set it as a secret environment
variable on the hosting platform; do not commit `.env`.

You can change:

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
  "Enter Launchpad" and all "Be in the room" buttons.

Settings, image-slot choices, FAQs, and uploaded image bytes are stored in
PostgreSQL. Existing data in `server/data/content.json` and its uploaded files are
imported automatically the first time the new database starts. Changes appear
on the next page load. Without the content server (pure static hosting) the site
uses its built-in defaults and the admin panel can't save.

## Deploy

Use a Node.js 22.9+ host with a reachable PostgreSQL database. Configure these
environment variables in the host dashboard:

- `DATABASE_URL`: runtime PostgreSQL URL (pooled URL is supported).
- `DIRECT_URL`: direct PostgreSQL URL for Prisma migrations; set it to the same
  URL when the provider has no separate direct endpoint.
- `SITE_URL`: the public HTTPS origin used in canonical URLs, metadata and the
  sitemap (for example `https://example.com`).
- `ADMIN_PASSWORD`: a unique secret of at least 16 characters.
- `TRUST_PROXY_HOPS`: set to the exact number of trusted proxies in front of the
  app if the host uses a reverse proxy; leave unset for direct connections.

Set the build/start command to `npm ci` and `npm start` (or let the platform
install dependencies automatically and use `npm start`). Startup builds the
frontend, runs `prisma migrate deploy`, then starts the server. Configure the
platform health check to `GET /api/health`; it returns success only when the
database is reachable. Multiple instances can share database sessions and
content. The login rate limit is per process, so use shared edge-level rate
limiting if you scale across multiple instances.

Uploaded image bytes and admin sessions are stored in PostgreSQL, so no
persistent application disk is required. Back up the database, including the
`MediaAsset` table, because it contains uploaded photos.

## Structure

```
server/index.js        PostgreSQL content API, admin sign-in and database-backed uploads; serves dist/ in production
prisma/                PostgreSQL schema and versioned migrations
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
