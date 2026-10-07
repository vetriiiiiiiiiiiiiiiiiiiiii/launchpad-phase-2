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

const PRODUCTION = process.env.NODE_ENV === 'production';
const PASSWORD = process.env.ADMIN_PASSWORD || '';
const OPEN = !PASSWORD;
if (PRODUCTION && (OPEN || PASSWORD.length < 16)) {
  console.error('Refusing to start in production: set ADMIN_PASSWORD to a value at least 16 characters long.');
  process.exit(1);
}
if (OPEN) {
  console.warn('\n  Admin panel is OPEN (no ADMIN_PASSWORD set): anyone who finds /asdfghjkl can edit the site.\n  Set ADMIN_PASSWORD in .env before going live.\n');
}

const SETTINGS = [
  'summitLabel', 'eventStart', 'registerUrl', 'doorsTime', 'venue', 'city',
  'contactEmail', 'instagramUrl', 'linkedinUrl', 'marksCaption',
];
const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };
const IMAGE_SIGNATURES = {
  'image/jpeg': (data) => data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff,
  'image/png': (data) => data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (data) => data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP',
  'image/avif': (data) => data.length >= 12 && data.toString('ascii', 4, 8) === 'ftyp' && /^(avif|avis|mif1|msf1)$/.test(data.toString('ascii', 8, 12)),
};
const okImage = (v) => typeof v === 'string' && v.length < 2000
  && (/^photo-[\w-]+$/.test(v) || /^\/uploads\/[\w.-]+$/.test(v) || /^\/api\/(uploads|media)\/[\w-]+$/.test(v) || /^https:\/\/[^\s"'<>]+$/.test(v));
/* Uploaded images used to be served from /api/uploads/ as JSON (a Prisma
   Uint8Array passed straight to res.send) with a one-year cache. They are now
   served correctly from /api/media/, which also sidesteps those cached copies. */
const mediaPath = (source) => (typeof source === 'string' ? source.replace(/^\/api\/uploads\//, '/api/media/') : source);
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

/* Raw session tokens are sent to the admin browser; only their SHA-256 hashes are stored. */
const TTL = 12 * 3600 * 1000;
const tokenHash = (token) => crypto.createHash('sha256').update(token).digest('hex');
const auth = (req, res, next) => {
  if (OPEN) return next();
  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!/^[a-f\d]{64}$/i.test(token)) return res.status(401).json({ error: 'Not signed in' });
  const hash = tokenHash(token);
  prisma.adminSession.findUnique({ where: { tokenHash: hash } })
    .then(async (session) => {
      if (!session || session.expiresAt <= new Date()) {
        if (session) await prisma.adminSession.deleteMany({ where: { tokenHash: hash } });
        return res.status(401).json({ error: 'Not signed in' });
      }
      req.adminTokenHash = hash;
      next();
    })
    .catch(next);
};

const attempts = new Map();
const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
const proxyHops = process.env.TRUST_PROXY_HOPS;
if (proxyHops !== undefined && /^\d+$/.test(proxyHops)) app.set('trust proxy', Number(proxyHops));

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, attempt] of attempts) {
    if (attempt.until <= now && now - attempt.updatedAt > 15 * 60 * 1000) attempts.delete(ip);
  }
  prisma.adminSession.deleteMany({ where: { expiresAt: { lte: new Date(now) } } }).catch((error) => {
    console.error('Could not clean up expired admin sessions:', error.message);
  });
}, 15 * 60 * 1000);
cleanupTimer.unref();

app.get('/api/health', async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.set('Cache-Control', 'no-store').json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth', (req, res) => res.json({ required: !OPEN }));

app.get('/api/content', async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');
    const [event, images, faq, speakers] = await Promise.all([
      prisma.eventSettings.findUnique({ where: { id: 'main' } }),
      prisma.imageSlot.findMany({ orderBy: { key: 'asc' } }),
      prisma.faqItem.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.speaker.findMany({ orderBy: { sortOrder: 'asc' } }),
    ]);
    res.json({
      images: Object.fromEntries(images.map(({ key, source }) => [key, mediaPath(source)])),
      settings: isRecord(event?.values) && Array.isArray(event.values.logos)
        ? { ...event.values, logos: event.values.logos.map((l) => ({ ...l, image: mediaPath(l.image) })) }
        : event?.values || {},
      ...(event?.faqConfigured ? { faq: faq.map(({ question: q, answer: a }) => ({ q, a })) } : {}),
      speakers: speakers.map(({ name, role, organisation, topic, photo }) => ({ name, role, organisation, topic, photo: mediaPath(photo) })),
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/login', express.json({ limit: '4kb' }), async (req, res, next) => {
  const ip = req.ip;
  const attempt = attempts.get(ip) || { count: 0, until: 0, updatedAt: Date.now() };
  if (attempt.until > Date.now()) return res.status(429).json({ error: 'Too many attempts. Try again in a minute.' });
  if (!PASSWORD || !same(req.body?.password || '', PASSWORD)) {
    attempt.count += 1;
    if (attempt.count >= 5) { attempt.until = Date.now() + 60_000; attempt.count = 0; }
    attempt.updatedAt = Date.now();
    attempts.set(ip, attempt);
    return res.status(401).json({ error: PASSWORD ? 'Wrong password' : 'ADMIN_PASSWORD is not configured on the server' });
  }
  attempts.delete(ip);
  const token = crypto.randomBytes(32).toString('hex');
  try {
    await prisma.adminSession.create({
      data: { tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + TTL) },
    });
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

app.post('/api/logout', auth, (req, res, next) => {
  if (!req.adminTokenHash) return res.json({ ok: true });
  prisma.adminSession.deleteMany({ where: { tokenHash: req.adminTokenHash } })
    .then(() => res.json({ ok: true }))
    .catch(next);
});

app.put('/api/content', auth, express.json({ limit: '256kb' }), async (req, res, next) => {
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
      if (key === 'registerUrl' && trimmed && !/^https:\/\/\S+$/.test(trimmed)) {
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
    if ('privacyPolicy' in body.settings) {
      if (typeof body.settings.privacyPolicy !== 'string') return res.status(400).json({ error: 'Invalid privacy policy' });
      settings.privacyPolicy = body.settings.privacyPolicy.replace(/\r\n/g, '\n').trim().slice(0, 20000);
    }

    // logos in the "built with purpose" row: optional; when sent, the list replaces the saved one
    if (body.logos !== undefined) {
      if (!Array.isArray(body.logos)) return res.status(400).json({ error: 'Logos must be a list' });
      settings.logos = [];
      for (const item of body.logos.slice(0, 12)) {
        const name = String(item?.name || '').trim().slice(0, 80);
        const image = String(item?.image || '').trim();
        if (!image) continue;
        if (!okImage(image) && !/^\/assets\/logos\/[\w.-]+$/.test(image)) return res.status(400).json({ error: `Not a usable logo for ${name || 'a logo'}` });
        settings.logos.push({ name, image });
      }
    }

    // speakers: optional for older admin clients; when sent, the list replaces the saved one
    let speakers = null;
    if (body.speakers !== undefined) {
      if (!Array.isArray(body.speakers)) return res.status(400).json({ error: 'Speakers must be a list' });
      speakers = [];
      for (const item of body.speakers.slice(0, 40)) {
        const name = String(item?.name || '').trim().slice(0, 120);
        if (!name) continue;
        const photo = String(item?.photo || '').trim();
        if (photo && !okImage(photo)) return res.status(400).json({ error: `Not a usable photo for ${name}` });
        speakers.push({
          name,
          role: String(item?.role || '').trim().slice(0, 160),
          organisation: String(item?.organisation || '').trim().slice(0, 160),
          topic: String(item?.topic || '').trim().slice(0, 240),
          photo,
          sortOrder: speakers.length,
        });
      }
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

      if (speakers) {
        await tx.speaker.deleteMany();
        if (speakers.length) await tx.speaker.createMany({ data: speakers });
      }
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
    if (!IMAGE_SIGNATURES[contentType](data)) {
      return res.status(400).json({ error: 'The uploaded file does not match its image type' });
    }
    const sha256 = crypto.createHash('sha256').update(data).digest('hex');
    const asset = await prisma.mediaAsset.upsert({
      where: { sha256 },
      create: { sha256, contentType, data },
      update: {},
      select: { id: true },
    });
    res.json({ url: `/api/media/${asset.id}` });
  } catch (error) {
    next(error);
  }
});

app.get(['/api/media/:id', '/api/uploads/:id'], async (req, res, next) => {
  try {
    const asset = await prisma.mediaAsset.findUnique({ where: { id: req.params.id } });
    if (!asset) return res.status(404).json({ error: 'Image not found' });
    res.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': asset.contentType,
      'X-Content-Type-Options': 'nosniff',
    });
    // Prisma returns Bytes as a Uint8Array; Express would serialise that as JSON,
    // so send it as a Buffer (raw bytes)
    res.send(Buffer.from(asset.data.buffer, asset.data.byteOffset, asset.data.byteLength));
  } catch (error) {
    next(error);
  }
});

app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found' }));

/* Keep serving existing local uploads not yet referenced by a database asset. */
if (fs.existsSync(UPLOADS)) {
  app.use('/uploads', express.static(UPLOADS, { maxAge: '365d', immutable: true }));
}

const dist = path.join(root, 'dist');
if (fs.existsSync(dist)) {
  app.get('/launches', (req, res, next) => {
    res.sendFile(path.join(dist, 'launches', 'index.html'), (error) => { if (error) next(error); });
  });
  app.get('/privacy', (req, res, next) => {
    res.sendFile(path.join(dist, 'privacy', 'index.html'), (error) => { if (error) next(error); });
  });
  app.get('/asdfghjkl', (req, res, next) => {
    res.sendFile(path.join(dist, 'asdfghjkl', 'index.html'), (error) => { if (error) next(error); });
  });
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
let httpServer;
try {
  await prisma.$connect();
  await importLegacyContent();
  httpServer = app.listen(port, '127.0.0.1', () => {
    console.log(`  Launchpad content server on http://127.0.0.1:${port}`);
  });
  httpServer.on('error', async (error) => {
    console.error('Could not start the content server:', error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
} catch (error) {
  console.error('Could not start the content server. Check DATABASE_URL and ensure PostgreSQL is reachable.', error);
  await prisma.$disconnect();
  process.exitCode = 1;
}

async function shutdown(signal) {
  console.log(`Received ${signal}; shutting down.`);
  clearInterval(cleanupTimer);
  if (!httpServer) {
    await prisma.$disconnect();
    return;
  }
  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();
  httpServer.close(async () => {
    clearTimeout(forceExit);
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
