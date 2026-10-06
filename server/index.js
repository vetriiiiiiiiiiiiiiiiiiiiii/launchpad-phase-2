/* LAUNCHPAD — PostgreSQL-backed content API and production web server. */
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(root, 'server', 'data');
const UPLOADS = path.join(DATA, 'uploads');
const LEGACY_CONTENT = path.join(DATA, 'content.json');
const prisma = new PrismaClient();

const PASSWORD = process.env.ADMIN_PASSWORD;
const OPEN = !PASSWORD;
if (OPEN) {
  console.warn('\n  Admin panel is OPEN (no ADMIN_PASSWORD set): anyone who finds /asdfghjkl can edit the site.\n  Set ADMIN_PASSWORD in .env before going live.\n');
}

const SETTINGS = [
  'summitLabel', 'eventStart', 'registerUrl', 'doorsTime', 'venue', 'city',
  'contactEmail', 'instagramUrl', 'linkedinUrl',
];
const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };
const okImage = (v) => typeof v === 'string' && v.length < 2000
  && (/^photo-[\w-]+$/.test(v) || /^\/uploads\/[\w.-]+$/.test(v) || /^\/api\/uploads\/[\w-]+$/.test(v) || /^https:\/\/[^\s"'<>]+$/.test(v));
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const same = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/* Preserve content written by the previous JSON-backed server on first startup. */
async function importLegacyContent() {
  if (await prisma.eventSettings.findUnique({ where: { id: 'main' } })) return;

  let legacy = {};
  if (fs.existsSync(LEGACY_CONTENT)) {
    legacy = JSON.parse(fs.readFileSync(LEGACY_CONTENT, 'utf8'));
  }
  const settings = isRecord(legacy.settings) ? legacy.settings : {};
  const images = isRecord(legacy.images) ? legacy.images : {};
  const faqs = Array.isArray(legacy.faq) ? legacy.faq : [];

  await prisma.$transaction(async (tx) => {
    if (await tx.eventSettings.findUnique({ where: { id: 'main' } })) return;
    await tx.eventSettings.create({ data: { id: 'main', values: settings, faqConfigured: faqs.length > 0 } });

    for (const [key, savedSource] of Object.entries(images)) {
      if (!/^\w{1,40}$/.test(key) || typeof savedSource !== 'string') continue;
      let source = savedSource;
      const match = source.match(/^\/uploads\/([\w.-]+)$/);
      if (match) {
        const filename = match[1];
        const contentType = Object.entries(IMAGE_TYPES).find(([, ext]) => filename.endsWith(`.${ext}`))?.[0];
        const file = path.join(UPLOADS, filename);
        if (contentType && fs.existsSync(file)) {
          const data = fs.readFileSync(file);
          const sha256 = crypto.createHash('sha256').update(data).digest('hex');
          const asset = await tx.mediaAsset.upsert({
            where: { sha256 },
            create: { sha256, contentType, data },
            update: {},
            select: { id: true },
          });
          source = `/api/uploads/${asset.id}`;
        }
      }
      if (okImage(source)) await tx.imageSlot.create({ data: { key, source } });
    }

    const items = faqs.slice(0, 16)
      .map((item) => ({
        question: String(item?.q || '').trim().slice(0, 200),
        answer: String(item?.a || '').trim().slice(0, 1200),
      }))
      .filter((item) => item.question && item.answer)
      .map((item, sortOrder) => ({ ...item, sortOrder }));
    if (items.length) await tx.faqItem.createMany({ data: items });
  });
}

/* Sessions: random tokens held in memory for 12 hours. */
const sessions = new Map();
const TTL = 12 * 3600 * 1000;
const auth = (req, res, next) => {
  if (OPEN) return next();
  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const expiry = sessions.get(token);
  if (!expiry || expiry < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Not signed in' });
  }
  next();
};

const attempts = new Map();
const app = express();
app.disable('x-powered-by');

app.get('/api/auth', (req, res) => res.json({ required: !OPEN }));

app.get('/api/content', async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');
    const [event, images, faq] = await Promise.all([
      prisma.eventSettings.findUnique({ where: { id: 'main' } }),
      prisma.imageSlot.findMany({ orderBy: { key: 'asc' } }),
      prisma.faqItem.findMany({ orderBy: { sortOrder: 'asc' } }),
    ]);
    res.json({
      images: Object.fromEntries(images.map(({ key, source }) => [key, source])),
      settings: event?.values || {},
      ...(event?.faqConfigured ? { faq: faq.map(({ question: q, answer: a }) => ({ q, a })) } : {}),
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/login', express.json({ limit: '4kb' }), (req, res) => {
  const ip = req.ip;
  const attempt = attempts.get(ip) || { count: 0, until: 0 };
  if (attempt.until > Date.now()) return res.status(429).json({ error: 'Too many attempts. Try again in a minute.' });
  if (!PASSWORD || !same(req.body?.password || '', PASSWORD)) {
    attempt.count += 1;
    if (attempt.count >= 5) { attempt.until = Date.now() + 60_000; attempt.count = 0; }
    attempts.set(ip, attempt);
    return res.status(401).json({ error: PASSWORD ? 'Wrong password' : 'ADMIN_PASSWORD is not configured on the server' });
  }
  attempts.delete(ip);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + TTL);
  res.json({ token });
});

app.put('/api/content', auth, express.json({ limit: '128kb' }), async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!isRecord(body.images) || !isRecord(body.settings) || !Array.isArray(body.faq)) {
      return res.status(400).json({ error: 'Content must include images, settings and FAQ data' });
    }

    const images = {};
    for (const [key, value] of Object.entries(body.images)) {
      if (!/^\w{1,40}$/.test(key)) continue;
      if (value === null || value === '') continue;
      if (!okImage(value)) return res.status(400).json({ error: `Not a usable image for ${key}` });
      images[key] = value;
    }

    const settings = {};
    for (const key of SETTINGS) {
      if (!(key in body.settings)) continue;
      const value = body.settings[key];
      if (typeof value !== 'string') return res.status(400).json({ error: `Invalid value for ${key}` });
      const trimmed = value.trim();
      if (key === 'summitLabel' && !trimmed) return res.status(400).json({ error: 'Summit label cannot be empty' });
      if (key === 'eventStart' && (!trimmed || Number.isNaN(Date.parse(trimmed)))) {
        return res.status(400).json({ error: 'Event start is not a valid date' });
      }
      if (key === 'registerUrl' && trimmed && !/^https?:\/\/\S+$/.test(trimmed)) {
        return res.status(400).json({ error: 'Registration link must start with https://' });
      }
      if ((key === 'instagramUrl' || key === 'linkedinUrl') && trimmed && !/^https:\/\/\S+$/.test(trimmed)) {
        return res.status(400).json({ error: 'Social links must start with https://' });
      }
      if (key === 'contactEmail' && trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return res.status(400).json({ error: 'Contact email does not look right' });
      }
      settings[key] = trimmed.slice(0, 300);
    }

    const faq = body.faq.slice(0, 16)
      .map((item) => ({
        question: String(item?.q || '').trim().slice(0, 200),
        answer: String(item?.a || '').trim().slice(0, 1200),
      }))
      .filter((item) => item.question && item.answer)
      .map((item, sortOrder) => ({ ...item, sortOrder }));

    await prisma.$transaction(async (tx) => {
      const current = await tx.eventSettings.findUnique({ where: { id: 'main' } });
      await tx.eventSettings.upsert({
        where: { id: 'main' },
        create: { id: 'main', values: settings, faqConfigured: true },
        update: { values: { ...(isRecord(current?.values) ? current.values : {}), ...settings }, faqConfigured: true },
      });

      const imageKeys = Object.keys(images);
      if (imageKeys.length) await tx.imageSlot.deleteMany({ where: { key: { notIn: imageKeys } } });
      else await tx.imageSlot.deleteMany();
      for (const [key, source] of Object.entries(images)) {
        await tx.imageSlot.upsert({
          where: { key },
          create: { key, source },
          update: { source },
        });
      }

      await tx.faqItem.deleteMany();
      if (faq.length) await tx.faqItem.createMany({ data: faq });
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post('/api/upload', auth, express.raw({ type: Object.keys(IMAGE_TYPES), limit: '15mb' }), async (req, res, next) => {
  try {
    const contentType = req.get('content-type');
    if (!IMAGE_TYPES[contentType] || !Buffer.isBuffer(req.body) || !req.body.length) {
      return res.status(400).json({ error: 'Upload a JPG, PNG, WebP or AVIF image (max 15 MB)' });
    }
    const data = req.body;
    const sha256 = crypto.createHash('sha256').update(data).digest('hex');
    const asset = await prisma.mediaAsset.upsert({
      where: { sha256 },
      create: { sha256, contentType, data },
      update: {},
      select: { id: true },
    });
    res.json({ url: `/api/uploads/${asset.id}` });
  } catch (error) {
    next(error);
  }
});

app.get('/api/uploads/:id', async (req, res, next) => {
  try {
    const asset = await prisma.mediaAsset.findUnique({ where: { id: req.params.id } });
    if (!asset) return res.status(404).json({ error: 'Image not found' });
    res.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': asset.contentType,
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(asset.data);
  } catch (error) {
    next(error);
  }
});

/* Keep serving existing local uploads not yet referenced by a database asset. */
if (fs.existsSync(UPLOADS)) {
  app.use('/uploads', express.static(UPLOADS, { maxAge: '365d', immutable: true }));
}

const dist = path.join(root, 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((error, req, res, next) => {
  console.error('API request failed:', error);
  if (res.headersSent) return next(error);
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large' });
  res.status(500).json({ error: 'The content service could not complete the request' });
});

const port = Number(process.env.API_PORT || process.env.PORT || 8787);
try {
  await prisma.$connect();
  await importLegacyContent();
  app.listen(port, () => console.log(`  Launchpad content server on http://localhost:${port}`));
} catch (error) {
  console.error('Could not start the content server. Check DATABASE_URL and ensure PostgreSQL is reachable.', error);
  await prisma.$disconnect();
  process.exitCode = 1;
}
