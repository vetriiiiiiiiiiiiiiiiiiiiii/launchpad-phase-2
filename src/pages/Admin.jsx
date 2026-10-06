import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/admin.css';
import CropDialog, { fmt } from '../components/admin/CropDialog.jsx';
import { DEFAULT_P, IMAGE_SLOTS, IMG } from '../lib/images.js';
import { DEFAULT_SETTINGS, DEFAULT_FAQ, DEFAULT_PRIVACY } from '../lib/content.js';

/* /asdfghjkl — change every photograph and the key event settings.
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

function Slot({ k, label, ratio, maxW, value, onChange, token, onError }) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);   // a file waiting in the crop step
  const [note, setNote] = useState('');
  const file = useRef(null);
  const current = value || DEFAULT_P[k];
  const changed = !!value && value !== DEFAULT_P[k];
  const pick = (f) => {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp|avif)$/.test(f.type)) { onError('Use a JPG, PNG, WebP or AVIF photo'); return; }
    if (f.size > 40 * 1048576) { onError('That file is over 40 MB — export a smaller version first'); return; }
    setPending(f);
  };
  const done = async (blob, info) => {
    setPending(null); setBusy(true);
    try {
      const { url: u } = await api('/api/upload', { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob }, token);
      onChange(u);
      const saved = Math.max(0, Math.round((1 - info.to.size / info.from.size) * 100));
      setNote(`Compressed ${fmt(info.from.size)} → ${fmt(info.to.size)} (−${saved}%) · ${info.to.w}×${info.to.h} ${info.to.type}`);
    } catch (x) { onError(x.message); } finally { setBusy(false); if (file.current) file.current.value = ''; }
  };
  const useUrl = () => {
    const n = normalise(url);
    if (n === null) { onError('Paste an Unsplash photo link or an https:// image URL'); return; }
    onChange(n); setUrl('');
    setNote(n.startsWith('photo-') ? 'Unsplash photo — served already resized and compressed' : 'External link — used as-is (not compressed). Uploading is better.');
  };
  return (
    <article className={`ad-slot${changed ? ' is-changed' : ''}`}>
      <div className="ad-thumb" style={{ aspectRatio: `${ratio[0]} / ${ratio[1]}` }}
        onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}>
        <img src={IMG(current, 640)} alt="" loading="lazy" />
        {busy && <span className="ad-busy">Uploading…</span>}
        {changed && <span className="ad-flag">Custom</span>}
        <span className="ad-ratio">{ratio[0]}:{ratio[1]} · {maxW}px</span>
      </div>
      <p className="ad-label">{label}</p>
      {note && <p className="ad-note">{note}</p>}
      <div className="ad-row">
        <button type="button" className="ad-btn" onClick={() => file.current.click()} disabled={busy}>Upload</button>
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(e) => pick(e.target.files[0])} />
        {changed && <button type="button" className="ad-btn ad-btn--ghost" onClick={() => { onChange(''); setNote(''); }}>Reset</button>}
      </div>
      <div className="ad-row">
        <input className="ad-url" placeholder="…or paste Unsplash / image link" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && useUrl()} />
        <button type="button" className="ad-btn" onClick={useUrl} disabled={!url.trim()}>Use</button>
      </div>
      {pending && <CropDialog file={pending} ratio={ratio} maxW={maxW} label={label} onCancel={() => { setPending(null); if (file.current) file.current.value = ''; }} onDone={done} />}
    </article>
  );
}

/* one speaker: photo (cropped 4:5, compressed) and the words under it */
function SpeakerCard({ sp, i, count, token, onError, onChange, onMove, onRemove }) {
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const file = useRef(null);
  const set = (k) => (e) => onChange({ ...sp, [k]: e.target.value });
  const pick = (f) => {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp|avif)$/.test(f.type)) { onError('Use a JPG, PNG, WebP or AVIF photo'); return; }
    setPending(f);
  };
  const done = async (blob) => {
    setPending(null); setBusy(true);
    try { const { url } = await api('/api/upload', { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob }, token); onChange({ ...sp, photo: url }); }
    catch (x) { onError(x.message); } finally { setBusy(false); if (file.current) file.current.value = ''; }
  };
  return (
    <article className="ad-speaker">
      <div className="ad-speaker__photo" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}>
        {sp.photo ? <img src={IMG(sp.photo, 400)} alt="" /> : <span>No photo</span>}
        {busy && <span className="ad-busy">Uploading…</span>}
        <span className="ad-ratio">4:5 · 800px</span>
      </div>
      <div className="ad-speaker__fields">
        <input value={sp.name} placeholder="Name (required)" onChange={set('name')} maxLength={120} />
        <input value={sp.role} placeholder="Role, e.g. Founder & CEO" onChange={set('role')} maxLength={160} />
        <input value={sp.organisation} placeholder="Organisation" onChange={set('organisation')} maxLength={160} />
        <input value={sp.topic} placeholder="Talk topic (optional)" onChange={set('topic')} maxLength={240} />
        <div className="ad-row">
          <button type="button" className="ad-btn" onClick={() => file.current.click()} disabled={busy}>{sp.photo ? 'Change photo' : 'Upload photo'}</button>
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(e) => pick(e.target.files[0])} />
          {sp.photo && <button type="button" className="ad-btn ad-btn--ghost" onClick={() => onChange({ ...sp, photo: '' })}>Remove photo</button>}
        </div>
      </div>
      <div className="ad-faq__tools">
        <button type="button" className="ad-btn ad-btn--ghost" disabled={i === 0} onClick={() => onMove(-1)} aria-label="Move up">↑</button>
        <button type="button" className="ad-btn ad-btn--ghost" disabled={i === count - 1} onClick={() => onMove(1)} aria-label="Move down">↓</button>
        <button type="button" className="ad-btn ad-btn--ghost" onClick={onRemove}>Remove</button>
      </div>
      {pending && <CropDialog file={pending} ratio={[4, 5]} maxW={800} label={sp.name || 'Speaker'} onCancel={() => setPending(null)} onDone={done} />}
    </article>
  );
}

export default function Admin() {
  const [token, setToken] = useState(() => { try { return sessionStorage.getItem('lp-admin') || ''; } catch { return ''; } });
  const [needsLogin, setNeedsLogin] = useState(null);   // null until the server says
  const [images, setImages] = useState({});
  const [settings, setSettings] = useState({});
  const [faq, setFaq] = useState(DEFAULT_FAQ);
  const [speakers, setSpeakers] = useState([]);
  const [saved, setSaved] = useState('');
  const [status, setStatus] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    document.title = 'Admin — Launchpad';
    document.body.classList.remove('is-loading');
    // keep the admin out of search engines
    let robots = document.head.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = 'noindex, nofollow';
    document.querySelector('link[rel="canonical"]')?.remove();
    document.head.querySelectorAll('script[data-seo-schema]').forEach((node) => node.remove());
    document.head.querySelectorAll('meta[name="description"], meta[property^="og:"], meta[name^="twitter:"]').forEach((node) => node.remove());
    return () => robots.remove();
  }, []);
  useEffect(() => { api('/api/auth').then((a) => setNeedsLogin(!!a.required)).catch(() => setNeedsLogin(true)); }, []);
  useEffect(() => {
    api('/api/content').then((c) => { const f = Array.isArray(c.faq) ? c.faq : DEFAULT_FAQ; const sp = Array.isArray(c.speakers) ? c.speakers : []; setImages(c.images || {}); setSettings(c.settings || {}); setFaq(f); setSpeakers(sp); setSaved(JSON.stringify({ i: c.images || {}, s: c.settings || {}, f, sp })); })
      .catch(() => setErr('Cannot reach the content server. Start it with "npm run dev".'));
  }, []);
  const keep = (t) => { setToken(t); try { sessionStorage.setItem('lp-admin', t); } catch { /* private mode */ } };
  const signOut = () => {
    if (token) api('/api/logout', { method: 'POST' }, token).catch(() => {});
    keep('');
  };
  const dirty = useMemo(() => saved && JSON.stringify({ i: images, s: settings, f: faq, sp: speakers }) !== saved, [images, settings, faq, speakers, saved]);

  const save = async () => {
    setStatus('Saving…'); setErr('');
    try {
      await api('/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images, settings, faq, speakers }) }, token);
      setSaved(JSON.stringify({ i: images, s: settings, f: faq, sp: speakers }));
      setStatus('Saved — reload the site to see it');
    } catch (x) {
      if (/signed in/i.test(x.message)) keep('');
      setErr(x.message); setStatus('');
    }
  };

  if (needsLogin === null) return <main className="ad" />;
  if (needsLogin && !token) return <main className="ad"><Login onToken={keep} /></main>;

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
          {needsLogin && <button className="ad-btn ad-btn--ghost" onClick={signOut}>Sign out</button>}
        </div>
      </header>
      {err && <p className="ad-err ad-err--bar" role="alert">{err}</p>}
      {!needsLogin && <p className="ad-warn">No password is set — anyone who knows this address can edit the site. Set <code>ADMIN_PASSWORD</code> in <code>.env</code> before the site goes live.</p>}
      <aside className="ad-info">
        <b>Every upload is automatically fitted and compressed.</b>
        <ol>
          <li><b>Ratio fix</b> — each spot has a fixed shape (shown on its picture, e.g. <i>16:9</i>). When you upload, you drag the photo inside that frame to choose what shows; it's cropped to exactly that ratio, so nothing is stretched or awkwardly cut on the site.</li>
          <li><b>Resize</b> — it's scaled down to the size that spot needs (e.g. <i>2400px</i> wide for the hero). Photos are never enlarged; you're warned if one is too small.</li>
          <li><b>Compress</b> — it's saved as WebP at high quality, usually 85–95% smaller than a camera or phone original. You'll see the before and after size.</li>
        </ol>
        <span>Pasted Unsplash links are already resized and compressed by Unsplash. Other pasted links are used as-is, so uploading is better.</span>
      </aside>

      <section className="ad-sec">
        <h2>Event</h2>
        <div className="ad-fields">
          {setting('summitLabel', 'Line above the headline', 'Shown in the hero, e.g. "Entrepreneurship & Innovation Summit"')}
          {setting('eventStart', 'Doors open (countdown target)', 'ISO date & time with offset, e.g. 2026-10-26T09:00:00+05:30')}
          {setting('registerUrl', 'Registration link', 'All “Be in the room” buttons and “Enter Launchpad” open this link. Leave blank to scroll to the invitation section.', 'url')}
          {setting('doorsTime', 'Doors open (shown)', 'As visitors read it, e.g. 9:00 AM. Empty shows "To be announced"')}
          {setting('venue', 'Venue', 'e.g. Main Auditorium, SRM Campus. Empty shows "To be announced"')}
          {setting('city', 'City', 'e.g. Tiruchirappalli')}
        </div>
      </section>

      <section className="ad-sec">
        <h2>Contact &amp; social</h2>
        <div className="ad-fields">
          {setting('contactEmail', 'Contact email', 'Shown in the FAQ and footer', 'email')}
          {setting('instagramUrl', 'Instagram link', 'https://instagram.com/…', 'url')}
          {setting('linkedinUrl', 'LinkedIn link', 'https://linkedin.com/…', 'url')}
        </div>
      </section>

      <section className="ad-sec">
        <h2>Questions (FAQ)</h2>
        <div className="ad-faq">
          {faq.map((f, i) => (
            <div className="ad-faq__item" key={i}>
              <span className="ad-faq__n">{String(i + 1).padStart(2, '0')}</span>
              <div className="ad-faq__fields">
                <input value={f.q} placeholder="Question" onChange={(e) => setFaq((list) => list.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
                <textarea rows={3} value={f.a} placeholder="Answer" onChange={(e) => setFaq((list) => list.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
              </div>
              <div className="ad-faq__tools">
                <button type="button" className="ad-btn ad-btn--ghost" disabled={i === 0} onClick={() => setFaq((l) => { const n = [...l]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })} aria-label="Move up">↑</button>
                <button type="button" className="ad-btn ad-btn--ghost" disabled={i === faq.length - 1} onClick={() => setFaq((l) => { const n = [...l]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })} aria-label="Move down">↓</button>
                <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setFaq((l) => l.filter((_, j) => j !== i))}>Remove</button>
              </div>
            </div>
          ))}
          <div className="ad-row">
            <button type="button" className="ad-btn" disabled={faq.length >= 16} onClick={() => setFaq((l) => [...l, { q: '', a: '' }])}>Add question</button>
            <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setFaq(DEFAULT_FAQ)}>Restore defaults</button>
          </div>
        </div>
      </section>

      <section className="ad-sec">
        <h2>Speakers</h2>
        <p className="ad-hint">{speakers.filter((x) => x.name.trim()).length
          ? <>The lineup shows on the site in this order{dirty ? <> — <b>press Save changes</b> to publish it</> : ' (live now)'}.</>
          : <>Hidden on the site until you add a speaker and save. Until then it says <i>“The lineup — Revealed soon.”</i></>}</p>
        <div className="ad-faq">
          {speakers.map((sp, i) => (
            <SpeakerCard key={i} sp={sp} i={i} count={speakers.length} token={token} onError={setErr}
              onChange={(v) => setSpeakers((l) => l.map((x, j) => (j === i ? v : x)))}
              onMove={(d) => setSpeakers((l) => { const n = [...l]; [n[i + d], n[i]] = [n[i], n[i + d]]; return n; })}
              onRemove={() => setSpeakers((l) => l.filter((_, j) => j !== i))} />
          ))}
          <div className="ad-row">
            <button type="button" className="ad-btn" disabled={speakers.length >= 40} onClick={() => setSpeakers((l) => [...l, { name: '', role: '', organisation: '', topic: '', photo: '' }])}>Add speaker</button>
          </div>
        </div>
      </section>

      <section className="ad-sec">
        <h2>Privacy policy</h2>
        <p className="ad-hint">Shown at <a href="/privacy" target="_blank" rel="noopener">/privacy</a> and linked in the footer. Leave empty to use the default, which describes what this website actually does — review it, and update it if you start collecting registrations on the site. Format: <code>## </code> for headings, <code>- </code> for bullets, a blank line between paragraphs, <code>{'{contact}'}</code> for the contact email.</p>
        <textarea className="ad-policy" rows={18} value={settings.privacyPolicy ?? ''} placeholder={DEFAULT_PRIVACY}
          onChange={(e) => setSettings((x) => ({ ...x, privacyPolicy: e.target.value }))} />
        <div className="ad-row">
          <button type="button" className="ad-btn" onClick={() => setSettings((x) => ({ ...x, privacyPolicy: DEFAULT_PRIVACY }))}>Start from the default text</button>
          {settings.privacyPolicy && <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setSettings((x) => ({ ...x, privacyPolicy: '' }))}>Clear (use default)</button>}
        </div>
      </section>

      {IMAGE_SLOTS.map(([section, slots]) => (
        <section className="ad-sec" key={section}>
          <h2>{section}</h2>
          <div className="ad-grid">
            {slots.map(([k, label, ratio, maxW]) => (
              <Slot key={k} k={k} label={label} ratio={ratio} maxW={maxW} value={images[k]} token={token} onError={setErr}
                onChange={(v) => { setErr(''); setStatus(''); setImages((im) => { const n = { ...im }; if (v) n[k] = v; else delete n[k]; return n; }); }} />
            ))}
          </div>
        </section>
      ))}
      <p className="ad-foot">Upload any JPG, PNG, WebP or AVIF (up to 40 MB), or drop it on a picture.</p>
    </main>
  );
}
