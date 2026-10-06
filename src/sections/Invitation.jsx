import { useMemo, useRef, useState } from 'react';
import Rv from '../components/Rv.jsx';
import { RegistrationLink } from '../components/RegistrationLink.jsx';
import { finePointer, reduceMotion } from '../hooks/env.js';

/* A keepsake ticket — a fun souvenir, clearly marked as NOT an entry pass. Write your name; it gets a seat and a number,
   tilts in your hand, catches light on its foil, and can be saved. */
const ROWS = 'ABCDEFGHJKLM';
const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

function seatFor(name) {
  const n = name.trim().toLowerCase();
  if (!n) return { row: 'L', seat: '26', no: '2610-0000' };
  const h = hash(n);
  return { row: ROWS[h % ROWS.length], seat: String((h >>> 8) % 28 + 1).padStart(2, '0'), no: `2610-${String((h >>> 4) % 10000).padStart(4, '0')}` };
}

/* the same ticket, drawn to a canvas for saving */
function drawTicket(name, s) {
  const W = 2000, H = 800, M = 70, c = document.createElement('canvas');
  c.width = W + M * 2; c.height = H + M * 2;
  const g = c.getContext('2d');
  // paper margin, so no viewer ever shows the corners as black
  g.fillStyle = '#fafbf8'; g.fillRect(0, 0, c.width, c.height);
  g.translate(M, M);
  const r = 36;
  const body = new Path2D();
  body.roundRect(0, 0, W, H, r);
  g.save(); g.clip(body);
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#087a56'); bg.addColorStop(0.55, '#04503b'); bg.addColorStop(1, '#023b2c');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const sheen = g.createLinearGradient(0, 0, W, 0);
  sheen.addColorStop(0.2, 'rgba(127,224,181,0)'); sheen.addColorStop(0.45, 'rgba(191,245,220,.22)'); sheen.addColorStop(0.7, 'rgba(127,224,181,0)');
  g.fillStyle = sheen; g.fillRect(0, 0, W, H);
  g.fillStyle = '#f0f4ef'; g.fillRect(1500, 0, 500, H);
  g.restore();
  // perforation
  g.fillStyle = '#fafbf8';
  for (let y = 24; y < H; y += 34) { g.beginPath(); g.arc(1500, y, 6, 0, Math.PI * 2); g.fill(); }
  const serif = 'Fraunces, Georgia, serif', sans = 'Manrope, Helvetica, Arial, sans-serif';
  g.fillStyle = '#7fe0b5'; g.font = `600 30px ${sans}`; g.letterSpacing = '12px';
  g.fillText('SOUVENIR  ·  26 OCTOBER 2026', 110, 140);
  g.fillStyle = '#fafbf8'; g.font = `400 150px ${serif}`; g.letterSpacing = '-4px';
  g.fillText('LAUNCHPAD', 100, 330);
  g.font = `italic 400 76px ${serif}`; g.letterSpacing = '0px'; g.fillStyle = '#cfe5d9';
  g.fillText((name.trim() || 'Your name here').slice(0, 28), 110, 470);
  g.fillStyle = '#93b8a6'; g.font = `500 26px ${sans}`; g.letterSpacing = '8px';
  g.fillText('ONE DAY  ·  THREE LAUNCHES  ·  WHERE IDEAS BECOME REAL', 110, 680);
  // the notice, on the image itself, so a shared copy can't pass as a ticket
  g.save(); g.translate(0, 0);
  g.fillStyle = 'rgba(232,200,134,.95)'; g.fillRect(0, H - 64, 1500, 64);
  g.fillStyle = '#3a2a05'; g.font = `700 26px ${sans}`; g.letterSpacing = '4px';
  g.fillText('⚠  NOT A TICKET OR ENTRY PASS  ·  A FUN SOUVENIR ONLY', 110, H - 22);
  g.restore();
  g.fillStyle = '#023b2c'; g.font = `500 26px ${sans}`;
  g.fillText('ROW', 1580, 180); g.fillText('SEAT', 1780, 180); g.fillText('NO.', 1580, 520);
  g.font = `400 140px ${serif}`; g.letterSpacing = '0px';
  g.fillText(s.row, 1575, 330); g.fillText(s.seat, 1770, 330);
  g.font = `400 54px ${serif}`; g.fillText(s.no, 1580, 600);
  return c;
}

export default function Invitation() {
  const [name, setName] = useState('');
  const s = useMemo(() => seatFor(name), [name]);
  const card = useRef(null);
  const tilt = (e) => {
    if (!finePointer || reduceMotion) return;
    const r = card.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    card.current.style.setProperty('--rx', `${(-y * 14).toFixed(2)}deg`);
    card.current.style.setProperty('--ry', `${(x * 18).toFixed(2)}deg`);
    card.current.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
    card.current.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const rest = () => { ['--rx', '--ry'].forEach((k) => card.current.style.setProperty(k, '0deg')); card.current.style.setProperty('--gx', '30%'); };
  const save = async () => {
    await document.fonts?.ready;
    const c = drawTicket(name, s);
    const a = document.createElement('a');
    a.download = `launchpad-invitation-${(name.trim() || 'guest').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
    a.href = c.toDataURL('image/png');
    a.click();
  };

  return (
    <section className="invite" data-tone="dark" id="invitation" data-folio="The Invitation">
      <div className="invite__inner">
        <header className="invite__head">
          <p className="eyebrow" data-reveal>The Invitation</p>
          <h2 className="invite__title" data-reveal><Rv>Your name</Rv><Rv><em>on the list.</em></Rv></h2>
          <p className="invite__body" data-reveal>Write your name and keep it as a souvenir of the day the three launches happen.</p>
          <label className="invite__field" data-reveal>
            <span>Name on the ticket</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={28} placeholder="Your name" autoComplete="name" />
          </label>
          <div className="invite__actions" data-reveal>
            <button type="button" className="btn btn--light magnetic" onClick={save}><span>Save invitation</span><i aria-hidden="true">↓</i></button>
            <RegistrationLink className="btn btn--ghost"><span>Be in the room</span><i aria-hidden="true">→</i></RegistrationLink>
          </div>
          <p className="invite__notice" role="note" data-reveal>
            <b aria-hidden="true">!</b>
            <span><strong>Not a ticket or entry pass.</strong> This is just a fun keepsake — it doesn't reserve a seat or get you in. To attend, register through “Be in the room”.</span>
          </p>
        </header>

        <div className="invite__stage" onPointerMove={tilt} onPointerLeave={rest}>
          <div className="ticket" ref={card} role="img" aria-label={`Souvenir ticket for ${name.trim() || 'a guest'} — not valid for entry`}>
            <div className="ticket__main">
              <p className="ticket__admit">Souvenir · 26 October 2026</p>
              <p className="ticket__word">Launchpad</p>
              <p className="ticket__name">{name.trim() || 'Your name here'}</p>
              <p className="ticket__foot">One day · Three launches · Where ideas become real</p>
            </div>
            <div className="ticket__stub">
              <div><span>Row</span><b>{s.row}</b></div>
              <div><span>Seat</span><b>{s.seat}</b></div>
              <div className="ticket__no"><span>No.</span><b>{s.no}</b></div>
            </div>
            <p className="ticket__void" aria-hidden="true">Not a ticket · Souvenir only</p>
            <i className="ticket__foil" aria-hidden="true" />
          </div>
          <div className="ticket__shadow" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
