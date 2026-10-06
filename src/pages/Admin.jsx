import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/admin.css';
import { DEFAULT_P, IMAGE_SLOTS, IMG } from '../lib/images.js';
import { DEFAULT_SETTINGS } from '../lib/content.js';

/* /admin — change every photograph and the key event settings.
   Saved content is served by the content server and applies on next load. */
const api = async (path, opts = {}, token) => {
  const res = await fetch(path, { ...opts, headers: { ...(opts.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
};

/* accepts an Unsplash photo id, an unsplash.com photo link, or any https image URL */
function normalise(input) {
  const v = input.trim();
  if (!v) return '';
  const m = v.match(/(photo-[\w-]+)/);
  if (m && /unsplash/.test(v)) return m[1];
  if (/^photo-[\w-]+$/.test(v)) return v;
  if (/^https:\/\//.test(v)) return v;
  return null;
}

function Login({ onToken }) {
  const [pw, setPw] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { const { token } = await api('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) }); onToken(token); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <form className="ad-login" onSubmit={submit}>
      <p className="ad-brand">Launchpad</p>
      <h1>Admin</h1>
      <label><span>Password</span><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus autoComplete="current-password" /></label>
      {err && <p className="ad-err" role="alert">{err}</p>}
      <button className="ad-btn ad-btn--solid" disabled={busy || !pw}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}

function Slot({ k, label, value, onChange, token, onError }) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const file = useRef(null);
  const current = value || DEFAULT_P[k];
  const changed = !!value && value !== DEFAULT_P[k];
  const upload = async (f) => {
    if (!f) return;
    setBusy(true);
    try { const { url: u } = await api('/api/upload', { method: 'POST', headers: { 'Content-Type': f.type }, body: f }, token); onChange(u); }
    catch (x) { onError(x.message); } finally { setBusy(false); file.current.value = ''; }
  };
  const useUrl = () => {
    const n = normalise(url);
    if (n === null) { onError('Paste an Unsplash photo link or an https:// image URL'); return; }
    onChange(n); setUrl('');
  };
  return (
    <article className={`ad-slot${changed ? ' is-changed' : ''}`}>
      <div className="ad-thumb" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files[0]); }}>
        <img src={IMG(current, 640)} alt="" loading="lazy" />
        {busy && <span className="ad-busy">Uploading…</span>}
        {changed && <span className="ad-flag">Custom</span>}
      </div>
      <p className="ad-label">{label}</p>
      <div className="ad-row">
        <button type="button" className="ad-btn" onClick={() => file.current.click()} disabled={busy}>Upload</button>
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(e) => upload(e.target.files[0])} />
        {changed && <button type="button" className="ad-btn ad-btn--ghost" onClick={() => onChange('')}>Reset</button>}
      </div>
      <div className="ad-row">
        <input className="ad-url" placeholder="…or paste Unsplash / image link" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && useUrl()} />
        <button type="button" className="ad-btn" onClick={useUrl} disabled={!url.trim()}>Use</button>
      </div>
    </article>
  );
}

export default function Admin() {
  const [token, setToken] = useState(() => { try { return sessionStorage.getItem('lp-admin') || ''; } catch { return ''; } });
  const [images, setImages] = useState({});
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState('');
  const [status, setStatus] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { document.title = 'Admin — Launchpad'; document.body.classList.remove('is-loading'); }, []);
  useEffect(() => {
    api('/api/content').then((c) => { setImages(c.images || {}); setSettings(c.settings || {}); setSaved(JSON.stringify({ i: c.images || {}, s: c.settings || {} })); })
      .catch(() => setErr('Cannot reach the content server. Start it with "npm run dev".'));
  }, []);
  const keep = (t) => { setToken(t); try { sessionStorage.setItem('lp-admin', t); } catch { /* private mode */ } };
  const dirty = useMemo(() => saved && JSON.stringify({ i: images, s: settings }) !== saved, [images, settings, saved]);

  const save = async () => {
    setStatus('Saving…'); setErr('');
    try {
      await api('/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images, settings }) }, token);
      setSaved(JSON.stringify({ i: images, s: settings }));
      setStatus('Saved — reload the site to see it');
    } catch (x) {
      if (/signed in/i.test(x.message)) keep('');
      setErr(x.message); setStatus('');
    }
  };

  if (!token) return <main className="ad"><Login onToken={keep} /></main>;

  const setting = (k, label, hint, type = 'text') => (
    <label className="ad-field" key={k}>
      <span>{label}</span>
      <input type={type} value={settings[k] ?? ''} placeholder={DEFAULT_SETTINGS[k] || ''} onChange={(e) => setSettings((s) => ({ ...s, [k]: e.target.value }))} />
      <em>{hint}</em>
    </label>
  );

  return (
    <main className="ad">
      <header className="ad-bar">
        <p className="ad-brand">Launchpad <span>Admin</span></p>
        <div className="ad-bar__right">
          {status && <span className="ad-status">{status}</span>}
          <a className="ad-btn ad-btn--ghost" href="/" target="_blank" rel="noopener">View site ↗</a>
          <button className="ad-btn ad-btn--solid" onClick={save} disabled={!dirty}>{dirty ? 'Save changes' : 'Saved'}</button>
          <button className="ad-btn ad-btn--ghost" onClick={() => keep('')}>Sign out</button>
        </div>
      </header>
      {err && <p className="ad-err ad-err--bar" role="alert">{err}</p>}

      <section className="ad-sec">
        <h2>Event</h2>
        <div className="ad-fields">
          {setting('summitLabel', 'Line above the headline', 'Shown in the hero, e.g. "Entrepreneurship & Innovation Summit"')}
          {setting('eventStart', 'Doors open (countdown target)', 'ISO date & time with offset, e.g. 2026-10-26T09:00:00+05:30')}
          {setting('registerUrl', 'Registration link', '"Enter Launchpad" and the final "Be in the room" open this link', 'url')}
        </div>
      </section>

      {IMAGE_SLOTS.map(([section, slots]) => (
        <section className="ad-sec" key={section}>
          <h2>{section}</h2>
          <div className="ad-grid">
            {slots.map(([k, label]) => (
              <Slot key={k} k={k} label={label} value={images[k]} token={token} onError={setErr}
                onChange={(v) => { setErr(''); setStatus(''); setImages((im) => { const n = { ...im }; if (v) n[k] = v; else delete n[k]; return n; }); }} />
            ))}
          </div>
        </section>
      ))}
      <p className="ad-foot">Photos: upload JPG, PNG, WebP or AVIF up to 15 MB, drop a file on a picture, or paste an Unsplash photo link. Wide photos (at least 2000px) look best in the hero.</p>
    </main>
  );
}
