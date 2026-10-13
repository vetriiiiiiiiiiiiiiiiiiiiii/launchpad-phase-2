/* Site content that the admin panel controls. Loaded once, before the app's
   modules are evaluated, so every section picks up the saved values. */
import { P, DEFAULT_P, DERIVED } from './images.js';

export const DEFAULT_SETTINGS = {
  summitLabel: 'Entrepreneurs & Startup Summit',
  eventStart: '2026-10-28T09:30:00+05:30',
  registerUrl: '',
  doorsTime: '',          // e.g. "9:00 AM" — shown in the key facts
  venue: '',              // e.g. "Main Auditorium, SRM Campus"
  city: '',               // e.g. "Tiruchirappalli"
  contactEmail: '',
  instagramUrl: '',
  linkedinUrl: '',
  marksCaption: 'An experience built with purpose.',
  privacyPolicy: '',      // empty = the default policy below
};

/* A plain-language starting point that describes what this website actually
   does. Organisers should review it (and adapt it if registration moves onto
   this site). Format: "## " headings, "- " bullets, blank lines between
   paragraphs. {contact} becomes the contact email. */
export const DEFAULT_PRIVACY = `Last updated: 6 October 2026

This policy explains what information the Launchpad website handles and why. Launchpad is an entrepreneurship and innovation event taking place on 28 October 2026.

## What this website collects
The website does not ask you to create an account, and it does not collect your name, email address or phone number.

## The souvenir ticket
When you write your name on the souvenir ticket, it stays in your browser. It is not sent to us or stored anywhere. The downloadable image is created on your own device.

## Registration
Registration for the event happens through the registration link on this site. Any details you submit there are handled by the organisers through that registration form, under the terms shown on it.

## Technical information
Like most websites, our hosting server may record standard technical details when you visit — such as your IP address, browser type, the pages you requested and the time — to keep the site secure and working. We do not use this information to identify you.

## Cookies and browser storage
We do not use advertising or analytics cookies. The site keeps one small note in your browser's session storage to remember that you have already seen the opening animation. It is removed when you close the tab.

## Third-party services
Fonts are loaded from Google Fonts, and some photographs are served by Unsplash. When your browser loads them, those services receive your IP address under their own privacy policies.

## Questions
For any question about this policy or your information, contact us at {contact}.

## Changes
If we change how the website handles information, we will update this page and the date above.`;

/* questions people ask before they register; editable in the admin */
export const DEFAULT_FAQ = [
  { q: 'What is Launchpad?', a: 'LaunchPad 2026 – Phase 2 is an Entrepreneurs & Startup Summit in Trichy on 28 October 2026, presented by the R. Shivakumar Foundation and the Entrepreneurship Development Cell, SRM IST Tiruchirappalli. It brings together startup founders, innovators, investors, industry leaders and aspiring entrepreneurs.' },
  { q: 'Who should attend?', a: 'Investors, angels and VCs; startups; innovators; students; and aspiring entrepreneurs — anyone building something, or about to.' },
  { q: 'What are the three launches?', a: 'Three products revealed live on stage during the day. What they are stays under wraps until the moment they are revealed.' },
  { q: 'How do I register?', a: 'Use “Be in the room” on this page. Registration details are shared there as soon as they open.' },
  { q: 'Where is it held?', a: 'The venue will be announced here soon.' },
];
/* the programme for the day; editable in the admin */
export const DEFAULT_PROGRAMME = [
  { time: '9:30 – 10:00 AM', title: 'Inauguration Ceremony' },
  { time: '10:00 – 10:25 AM', title: 'Speaker Session 1' },
  { time: '10:25 – 10:50 AM', title: 'Speaker Session 2' },
  { time: '10:50 – 11:15 AM', title: 'Speaker Session 3' },
  { time: '11:15 – 11:40 AM', title: 'Speaker Session 4' },
  { time: '11:40 AM – 12:50 PM', title: 'Panel Discussion' },
  { time: '12:50 – 1:00 PM', title: 'Vote of Thanks & Closing' },
];

/* the logo row near the end of the page */
export const DEFAULT_LOGOS = [
  { name: 'RS Foundation', image: '/assets/logos/rs-foundation.png' },
  { name: 'SRM Organization', image: '/assets/logos/srm.png' },
];
export const S = { ...DEFAULT_SETTINGS, faq: DEFAULT_FAQ, speakers: [], logos: DEFAULT_LOGOS, contacts: [], programme: DEFAULT_PROGRAMME };

export async function loadContent() {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 2500);
    const res = await fetch('/api/content', { signal: ctl.signal, cache: 'no-store' });
    clearTimeout(t);
    if (!res.ok) return;
    const data = await res.json();
    Object.entries(data.images || {}).forEach(([k, v]) => { if (k in DEFAULT_P && v) P[k] = v; });
    // a slot that used to share a photo follows it until it is changed on its own
    Object.entries(DERIVED).forEach(([k, base]) => { if (!data.images?.[k] && data.images?.[base]) P[k] = data.images[base]; });
    Object.entries(data.settings || {}).forEach(([k, v]) => { if (k in DEFAULT_SETTINGS && typeof v === 'string') S[k] = v; });
    if (Array.isArray(data.faq)) S.faq = data.faq;
    if (Array.isArray(data.settings?.programme) && data.settings.programme.length) S.programme = data.settings.programme.filter((r) => r && r.title);
    if (Array.isArray(data.settings?.contacts)) S.contacts = data.settings.contacts.filter((c) => c && c.name);
    if (Array.isArray(data.settings?.logos)) S.logos = data.settings.logos.filter((l) => l && l.image);
    if (Array.isArray(data.speakers)) S.speakers = data.speakers.filter((sp) => sp && sp.name);
  } catch { /* no server (static hosting): defaults stand */ }
}

/* where "Be in the room" goes: the registration link if set, else the finale */
export const registerHref = () => S.registerUrl || '#be-in-the-room';

/* tidy display values for the key facts */
export const TBA = 'To be announced';
/* "9:30 – 10:00 AM" → start "9:30 AM", end "10:00 AM" (a start with no AM/PM borrows the end's) */
const ampm = (t) => (t.match(/\b(AM|PM)\b/i) || [])[1];
export const timeStart = (t = '') => { const [a, b = ''] = t.split(/[–-]/).map((x) => x.trim()); return a && !ampm(a) && ampm(b) ? `${a} ${ampm(b)}` : a; };
export const timeEnd = (t = '') => t.split(/[–-]/).pop().trim();
export const placeLine = () => [S.venue, S.city].filter(Boolean).join(', ') || TBA;

/* a phone number as a tel: link (digits and a leading +) */
export const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`;
