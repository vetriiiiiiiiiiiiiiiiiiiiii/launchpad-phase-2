/* LAUNCHPAD — content server.
   Serves the site's editable content (photos + key settings) and the admin
   API. In production it also serves the built site from dist/.

   ADMIN_PASSWORD (env, or .env) protects every write. */
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(root, 'server', 'data');
const UPLOADS = path.join(DATA, 'uploads');
const CONTENT = path.join(DATA, 'content.json');
fs.mkdirSync(UPLOADS, { recursive: true });

const PASSWORD = process.env.ADMIN_PASSWORD;
if (!PASSWORD) {
  console.error('\n  ADMIN_PASSWORD is not set. Add it to .env (see .env.example). Admin writes are disabled.\n');
}

const read = () => { try { return JSON.parse(fs.readFileSync(CONTENT, 'utf8')); } catch { return { images: {}, settings: {} }; } };
const write = (c) => { const tmp = CONTENT + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(c, null, 2)); fs.renameSync(tmp, CONTENT); };

/* sessions: random tokens held in memory, 12 hours */
const sessions = new Map();
const TTL = 12 * 3600 * 1000;
const auth = (req, res, next) => {
  const t = (req.get('authorization') || '').replace(/^Bearer /, '');
  const exp = sessions.get(t);
  if (!exp || exp < Date.now()) { sessions.delete(t); return res.status(401).json({ error: 'Not signed in' }); }
  next();
};
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

/* a little brute-force friction on login */
const attempts = new Map();

const app = express();
app.disable('x-powered-by');

app.get('/api/content', (req, res) => { res.set('Cache-Control', 'no-store'); res.json(read()); });

app.post('/api/login', express.json({ limit: '4kb' }), (req, res) => {
  const ip = req.ip;
  const a = attempts.get(ip) || { n: 0, until: 0 };
  if (a.until > Date.now()) return res.status(429).json({ error: 'Too many attempts. Try again in a minute.' });
  if (!PASSWORD || !same(req.body?.password || '', PASSWORD)) {
    a.n += 1; if (a.n >= 5) { a.until = Date.now() + 60_000; a.n = 0; }
    attempts.set(ip, a);
    return res.status(401).json({ error: PASSWORD ? 'Wrong password' : 'ADMIN_PASSWORD is not configured on the server' });
  }
  attempts.delete(ip);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + TTL);
  res.json({ token });
});

const SETTINGS = ['summitLabel', 'eventStart', 'registerUrl'];
const okImage = (v) => typeof v === 'string' && v.length < 2000 && (/^photo-[\w-]+$/.test(v) || /^\/uploads\/[\w.-]+$/.test(v) || /^https:\/\/[^\s"'<>]+$/.test(v));

app.put('/api/content', auth, express.json({ limit: '64kb' }), (req, res) => {
  const body = req.body || {};
  const images = {}, settings = {};
  for (const [k, v] of Object.entries(body.images || {})) {
    if (!/^\w{1,40}$/.test(k)) continue;
    if (v === null || v === '') continue;             // empty = back to default
    if (!okImage(v)) return res.status(400).json({ error: `Not a usable image for ${k}` });
    images[k] = v;
  }
  for (const k of SETTINGS) {
    const v = body.settings?.[k];
    if (typeof v !== 'string' || !v.trim()) continue;
    if (k === 'registerUrl' && !/^https?:\/\/\S+$/.test(v.trim())) return res.status(400).json({ error: 'Registration link must start with https://' });
    if (k === 'eventStart' && Number.isNaN(Date.parse(v))) return res.status(400).json({ error: 'Event start is not a valid date' });
    settings[k] = v.trim().slice(0, 300);
  }
  write({ images, settings, updatedAt: new Date().toISOString() });
  res.json({ ok: true });
});

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };
app.post('/api/upload', auth, express.raw({ type: Object.keys(TYPES), limit: '15mb' }), (req, res) => {
  const ext = TYPES[req.get('content-type')];
  if (!ext || !Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: 'Upload a JPG, PNG, WebP or AVIF image (max 15 MB)' });
  const name = `${crypto.createHash('sha256').update(req.body).digest('hex').slice(0, 20)}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS, name), req.body);
  res.json({ url: `/uploads/${name}` });
});

app.use('/uploads', express.static(UPLOADS, { maxAge: '365d', immutable: true }));

/* production: the built site */
const dist = path.join(root, 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const port = +process.env.API_PORT || +process.env.PORT || 8787;
app.listen(port, () => console.log(`  Launchpad content server on http://localhost:${port}`));
