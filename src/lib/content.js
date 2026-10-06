/* Site content that the admin panel controls. Loaded once, before the app's
   modules are evaluated, so every section picks up the saved values. */
import { P, DEFAULT_P } from './images.js';

export const DEFAULT_SETTINGS = {
  summitLabel: 'Entrepreneurship & Innovation Summit',
  eventStart: '2026-10-26T00:00:00+05:30',
  registerUrl: '',
  doorsTime: '',          // e.g. "9:00 AM" — shown in the key facts
  venue: '',              // e.g. "Main Auditorium, SRM Campus"
  city: '',               // e.g. "Tiruchirappalli"
  contactEmail: '',
  instagramUrl: '',
  linkedinUrl: '',
};

/* questions people ask before they register; editable in the admin */
export const DEFAULT_FAQ = [
  { q: 'What is Launchpad?', a: 'A one-day entrepreneurship and innovation experience on 26 October 2026: expert talks, live pitching, hands-on problem solving, an exhibition of what is being built, and three product launches revealed on stage.' },
  { q: 'Who should attend?', a: 'Founders, students, creators, innovators, investors and anyone building something — or about to.' },
  { q: 'What are the three launches?', a: 'Three products revealed live on stage during the day. What they are stays under wraps until the moment they are revealed.' },
  { q: 'How do I register?', a: 'Use “Be in the room” on this page. Registration details are shared there as soon as they open.' },
  { q: 'Where is it held?', a: 'The venue will be announced here soon.' },
];
export const S = { ...DEFAULT_SETTINGS, faq: DEFAULT_FAQ };

export async function loadContent() {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 2500);
    const res = await fetch('/api/content', { signal: ctl.signal, cache: 'no-store' });
    clearTimeout(t);
    if (!res.ok) return;
    const data = await res.json();
    Object.entries(data.images || {}).forEach(([k, v]) => { if (k in DEFAULT_P && v) P[k] = v; });
    Object.entries(data.settings || {}).forEach(([k, v]) => { if (k in DEFAULT_SETTINGS && typeof v === 'string') S[k] = v; });
    if (Array.isArray(data.faq)) S.faq = data.faq;
  } catch { /* no server (static hosting): defaults stand */ }
}

/* where "Be in the room" goes: the registration link if set, else the finale */
export const registerHref = () => S.registerUrl || '#be-in-the-room';

/* tidy display values for the key facts */
export const TBA = 'To be announced';
export const placeLine = () => [S.venue, S.city].filter(Boolean).join(', ') || TBA;
