/* Site content that the admin panel controls. Loaded once, before the app's
   modules are evaluated, so every section picks up the saved values. */
import { P, DEFAULT_P } from './images.js';

export const DEFAULT_SETTINGS = {
  summitLabel: 'Entrepreneurship & Innovation Summit',
  eventStart: '2026-10-26T00:00:00+05:30',
  registerUrl: '',
};
export const S = { ...DEFAULT_SETTINGS };

export async function loadContent() {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 2500);
    const res = await fetch('/api/content', { signal: ctl.signal, cache: 'no-store' });
    clearTimeout(t);
    if (!res.ok) return;
    const data = await res.json();
    Object.entries(data.images || {}).forEach(([k, v]) => { if (k in DEFAULT_P && v) P[k] = v; });
    Object.entries(data.settings || {}).forEach(([k, v]) => { if (k in DEFAULT_SETTINGS && v !== '') S[k] = v; });
  } catch (e) { /* no server (static hosting): defaults stand */ }
}

/* where "Be in the room" goes: the registration link if set, else the finale */
export const registerHref = () => S.registerUrl || '#be-in-the-room';
