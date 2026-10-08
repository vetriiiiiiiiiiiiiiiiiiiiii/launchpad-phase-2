import { useEffect, useMemo, useRef, useState } from 'react';
import { drawPass, downloadPass, loadPassFonts, ticketNo } from '../../lib/boardingPass.js';

/* Seat passes: fill in the attendee, pick a seat on the map, issue and download.
   300 seats — rows A–O, 10 seats each side of a centre aisle (150 | 150). */
const ROWS = 'ABCDEFGHIJKLMNO'.split('');
const LEFT = Array.from({ length: 10 }, (_, i) => i + 1);
const RIGHT = Array.from({ length: 10 }, (_, i) => i + 11);
const EMPTY = { name: '', year: '', dept: '', section: '' };

export default function Tickets({ api, token, settings, defaults, onError }) {
  const [tickets, setTickets] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [seat, setSeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [q, setQ] = useState('');
  const [fonts, setFonts] = useState(false);
  const preview = useRef(null);

  const ev = useMemo(() => {
    const v = (k) => (settings[k] ?? '').trim() || defaults[k] || '';
    return {
      summit: v('summitLabel'),
      date: '26 October 2026',
      doors: v('doorsTime') || 'To be announced',
      venue: [v('venue'), v('city')].filter(Boolean).join(', ') || 'To be announced',
    };
  }, [settings, defaults]);

  const load = () => api('/api/tickets', {}, token).then((r) => setTickets(r.tickets)).catch((x) => { onError(x.message); setTickets([]); });
  useEffect(() => { load(); loadPassFonts().then(() => setFonts(true)); }, []);

  const taken = useMemo(() => new Map((tickets || []).map((t) => [t.seat, t])), [tickets]);
  useEffect(() => { if (preview.current) drawPass(preview.current, { ...form, seat, number: 0 }, ev); }, [form, seat, ev, fonts]);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setDone(''); };
  const ready = form.name.trim() && form.year.trim() && form.dept.trim() && form.section.trim() && seat;

  const save = async (t) => {
    await loadPassFonts();
    await downloadPass(drawPass(document.createElement('canvas'), t, ev), t);
  };
  const issue = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setBusy(true); onError('');
    try {
      const { ticket } = await api('/api/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, seat }) }, token);
      setTickets((l) => [ticket, ...(l || [])]);
      await save(ticket);
      setDone(`Issued ${ticketNo(ticket.number)} — seat ${ticket.seat} for ${ticket.name}. The pass has been downloaded.`);
      setForm((f) => ({ ...EMPTY, year: f.year, dept: f.dept, section: f.section }));   // same class is often next
      setSeat('');
    } catch (x) {
      onError(x.message);
      if (/taken/i.test(x.message)) { setSeat(''); load(); }
    } finally { setBusy(false); }
  };
  const cancel = async (t) => {
    if (!window.confirm(`Cancel ${ticketNo(t.number)} for ${t.name}? Seat ${t.seat} becomes free again. A pass already downloaded will no longer match the list.`)) return;
    try { await api(`/api/tickets/${t.id}`, { method: 'DELETE' }, token); setTickets((l) => l.filter((x) => x.id !== t.id)); }
    catch (x) { onError(x.message); }
  };

  const list = (tickets || []).filter((t) => !q.trim() || `${t.name} ${t.seat} ${t.dept} ${t.year} ${t.section} ${ticketNo(t.number)}`.toLowerCase().includes(q.trim().toLowerCase()));
  const seatBtn = (row, n) => {
    const id = `${row}${n}`, who = taken.get(id);
    const cls = who ? 'is-taken' : id === seat ? 'is-on' : '';
    return (
      <button key={id} type="button" className={`ad-seat ${cls}`} disabled={!!who}
        title={who ? `${id} — ${who.name}` : `Seat ${id}`} aria-label={who ? `Seat ${id}, taken by ${who.name}` : `Seat ${id}`}
        aria-pressed={id === seat} onClick={() => { setSeat(id === seat ? '' : id); setDone(''); }}>{n}</button>
    );
  };

  return (
    <>
      <p className="ad-hint">Fill in the attendee, choose a free seat, then <b>Issue &amp; download</b>. The pass is saved straight away (no need to press Save changes) and the seat is marked taken. Venue and doors time come from <i>Event details</i>.</p>

      <form className="ad-tk" onSubmit={issue}>
        <div className="ad-tk__fields">
          <label className="ad-field"><span>Name</span><input value={form.name} onChange={set('name')} maxLength={80} placeholder="Full name" /></label>
          <label className="ad-field"><span>Year</span><input value={form.year} onChange={set('year')} maxLength={20} placeholder="e.g. II Year" /></label>
          <label className="ad-field"><span>Department</span><input value={form.dept} onChange={set('dept')} maxLength={60} placeholder="e.g. CSE" /></label>
          <label className="ad-field"><span>Section</span><input value={form.section} onChange={set('section')} maxLength={20} placeholder="e.g. A" /></label>
        </div>

        <div className="ad-hall">
          <div className="ad-hall__stage">Stage</div>
          <div className="ad-hall__scroll">
            <div className="ad-hall__grid" role="group" aria-label="Seat map">
              {ROWS.map((r) => (
                <div className="ad-hall__row" key={r}>
                  <span className="ad-hall__r">{r}</span>
                  <div className="ad-hall__block">{LEFT.map((n) => seatBtn(r, n))}</div>
                  <span className="ad-hall__aisle" aria-hidden="true" />
                  <div className="ad-hall__block">{RIGHT.map((n) => seatBtn(r, n))}</div>
                  <span className="ad-hall__r">{r}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="ad-hall__legend">
            <span><i className="ad-seat" /> Free</span>
            <span><i className="ad-seat is-on" /> Selected</span>
            <span><i className="ad-seat is-taken" /> Taken</span>
            <b>{tickets ? `${300 - taken.size} of 300 free` : 'Loading seats…'}</b>
          </div>
        </div>

        <div className="ad-tk__preview">
          <canvas ref={preview} width="2000" height="760" aria-label="Boarding pass preview" />
        </div>
        {done && <p className="ad-note">{done}</p>}
        <div className="ad-row">
          <button className="ad-btn ad-btn--solid" disabled={!ready || busy}>{busy ? 'Issuing…' : seat ? `Issue & download — seat ${seat}` : 'Choose a seat'}</button>
          {!ready && <span className="ad-tk__need">{!seat ? 'Pick a seat on the map' : 'Fill in name, year, department and section'}</span>}
        </div>
      </form>

      <h3 className="ad-sub">Issued passes <span>{tickets?.length ?? 0}</span></h3>
      {tickets?.length > 0 && <input className="ad-tk__search" placeholder="Search name, seat, department…" value={q} onChange={(e) => setQ(e.target.value)} />}
      {tickets?.length === 0 && <p className="ad-hint">No passes issued yet.</p>}
      {list.length > 0 && (
        <div className="ad-tk__table">
          <table>
            <thead><tr><th>Ticket</th><th>Seat</th><th>Name</th><th>Year</th><th>Department</th><th>Section</th><th /></tr></thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id}>
                  <td>{ticketNo(t.number)}</td><td><b>{t.seat}</b></td><td>{t.name}</td><td>{t.year}</td><td>{t.dept}</td><td>{t.section}</td>
                  <td className="ad-tk__act">
                    <button type="button" className="ad-btn" onClick={() => save(t)}>Download</button>
                    <button type="button" className="ad-btn ad-btn--ghost" onClick={() => cancel(t)}>Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
