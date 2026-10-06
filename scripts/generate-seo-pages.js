import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_FAQ } from '../src/lib/content.js';

try {
  process.loadEnvFile('.env');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const dist = path.resolve('dist');
const origin = (process.env.SITE_URL || '').trim().replace(/\/+$/, '');
if (origin) {
  const url = new URL(origin);
  const local = ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw new Error('SITE_URL must use HTTPS (HTTP is allowed for localhost only).');
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_URL must be the site origin only, for example https://example.com.');
  }
}
if (process.env.NODE_ENV === 'production' && !origin) {
  throw new Error('Set SITE_URL to your public HTTPS domain before a production build.');
}

const image = 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&w=1200&h=630&q=75';
const home = {
  title: 'Launchpad 2026 | Entrepreneurship & Innovation Summit',
  description: 'Entrepreneurship & Innovation Summit on 26 October 2026: expert talks, live pitching, hands-on problem solving and three product launches.',
  path: '/',
};
const launches = {
  title: 'Three Product Launches Revealed Live | Launchpad 2026',
  description: 'Discover the three products launching live at Launchpad on 26 October 2026, alongside expert talks, pitching and hands-on problem solving.',
  path: '/launches',
};

const escapeAttr = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const escapeXml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

function setMeta(html, attr, key, value) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(`<meta\\s+${attr}="${escapedKey}"[^>]*>`, 'i');
  if (value === null) return html.replace(matcher, '');
  const tag = `<meta ${attr}="${escapeAttr(key)}" content="${escapeAttr(value)}">`;
  return matcher.test(html) ? html.replace(matcher, tag) : html.replace('</head>', `  ${tag}\n</head>`);
}

function setCanonical(html, url) {
  const matcher = /<link\s+rel="canonical"[^>]*>/i;
  if (!url) return html.replace(matcher, '');
  const tag = `<link rel="canonical" href="${escapeAttr(url)}">`;
  return matcher.test(html) ? html.replace(matcher, tag) : html.replace('</head>', `  ${tag}\n</head>`);
}

function setTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttr(title)}</title>`);
}

function setSchema(html, id, value) {
  const matcher = new RegExp(`<script[^>]*data-seo-schema="${id}"[^>]*>[\\s\\S]*?<\\/script>`, 'i');
  if (!value) return html.replace(matcher, '');
  const tag = `<script type="application/ld+json" data-seo-schema="${id}">${JSON.stringify(value).replace(/</g, '\\u003c')}</script>`;
  return matcher.test(html) ? html.replace(matcher, tag) : html.replace('</head>', `  ${tag}\n</head>`);
}

function makePage(template, page, schema) {
  let html = setTitle(template, page.title);
  html = setMeta(html, 'name', 'description', page.description);
  html = setMeta(html, 'name', 'site-url', origin);
  html = setMeta(html, 'property', 'og:type', 'website');
  html = setMeta(html, 'property', 'og:site_name', 'Launchpad');
  html = setMeta(html, 'property', 'og:title', page.title);
  html = setMeta(html, 'property', 'og:description', page.description);
  html = setMeta(html, 'property', 'og:url', origin ? new URL(page.path, `${origin}/`).href : null);
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'property', 'og:image:alt', 'A full room gathered for a live event at Launchpad');
  html = setMeta(html, 'property', 'og:image:width', '1200');
  html = setMeta(html, 'property', 'og:image:height', '630');
  html = setMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = setMeta(html, 'name', 'twitter:title', page.title);
  html = setMeta(html, 'name', 'twitter:description', page.description);
  html = setMeta(html, 'name', 'twitter:image', image);
  html = setMeta(html, 'name', 'twitter:image:alt', 'A full room gathered for a live event at Launchpad');
  html = setCanonical(html, origin ? new URL(page.path, `${origin}/`).href : null);
  return setSchema(html, 'page', schema);
}

const homeUrl = origin ? new URL('/', `${origin}/`).href : null;
const launchesUrl = origin ? new URL('/launches', `${origin}/`).href : null;
const website = {
  '@type': 'WebSite', name: 'Launchpad', inLanguage: 'en',
  ...(homeUrl ? { '@id': `${homeUrl}#website`, url: homeUrl } : {}),
};
const homeSchema = origin ? {
  '@context': 'https://schema.org',
  '@graph': [
    website,
    {
      '@type': 'FAQPage',
      mainEntity: DEFAULT_FAQ.map(({ q, a }) => ({
        '@type': 'Question', name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ],
} : null;
const launchSchema = origin ? {
  '@context': 'https://schema.org',
  '@graph': [
    website,
    {
      '@type': 'CollectionPage',
      name: launches.title,
      description: launches.description,
      url: launchesUrl,
      inLanguage: 'en',
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: ['The First Reveal', 'The Second Reveal', 'The Final Reveal'].map((name, index) => ({
          '@type': 'ListItem', position: index + 1, name, url: `${launchesUrl}#product-0${index + 1}`,
        })),
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Launchpad', item: homeUrl },
          { '@type': 'ListItem', position: 2, name: 'The Launches', item: launchesUrl },
        ],
      },
    },
  ],
} : null;

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, 'index.html'), makePage(template, home, homeSchema));
fs.mkdirSync(path.join(dist, 'launches'), { recursive: true });
fs.writeFileSync(path.join(dist, 'launches', 'index.html'), makePage(template, launches, launchSchema));

let admin = setTitle(template, 'Admin — Launchpad');
admin = setMeta(admin, 'name', 'robots', 'noindex, nofollow');
admin = setMeta(admin, 'name', 'description', null);
admin = setMeta(admin, 'property', 'og:type', null);
admin = setMeta(admin, 'property', 'og:site_name', null);
admin = setMeta(admin, 'property', 'og:locale', null);
admin = setMeta(admin, 'property', 'og:title', null);
admin = setMeta(admin, 'property', 'og:description', null);
admin = setMeta(admin, 'property', 'og:url', null);
admin = setMeta(admin, 'property', 'og:image', null);
admin = setMeta(admin, 'property', 'og:image:alt', null);
admin = setMeta(admin, 'property', 'og:image:width', null);
admin = setMeta(admin, 'property', 'og:image:height', null);
admin = setMeta(admin, 'name', 'twitter:card', null);
admin = setMeta(admin, 'name', 'twitter:title', null);
admin = setMeta(admin, 'name', 'twitter:description', null);
admin = setMeta(admin, 'name', 'twitter:image', null);
admin = setMeta(admin, 'name', 'twitter:image:alt', null);
admin = setCanonical(admin, null);
fs.mkdirSync(path.join(dist, 'asdfghjkl'), { recursive: true });
fs.writeFileSync(path.join(dist, 'asdfghjkl', 'index.html'), admin);

const robots = ['User-agent: *', 'Allow: /', ...(origin ? [`Sitemap: ${origin}/sitemap.xml`] : [])].join('\n') + '\n';
fs.writeFileSync(path.join(dist, 'robots.txt'), robots);
const sitemapFile = path.join(dist, 'sitemap.xml');
if (origin) {
  const urls = ['/', '/launches'].map((route) => `  <url><loc>${escapeXml(new URL(route, `${origin}/`).href)}</loc></url>`).join('\n');
  fs.writeFileSync(sitemapFile, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
} else if (fs.existsSync(sitemapFile)) {
  fs.rmSync(sitemapFile);
}
