import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Rv from '../components/Rv.jsx';
import { RegistrationButton } from '../components/RegistrationLink.jsx';
import StageCanvas from '../components/StageCanvas.jsx';
import { useCountdown } from '../hooks/useCountdown.js';
import { useLaunchesSeo } from '../hooks/useEventSeo.js';
import { useReveal } from '../hooks/useReveal.js';
import { useArrive } from '../hooks/useArrive.js';
import { hasWebGL, reduceMotion } from '../hooks/env.js';
import { IMG, P } from '../lib/images.js';

/* ---------- a classified field: it refuses, visibly ---------- */
const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&/';
function Redact({ len }) {
  const ref = useRef(null);
  const [txt, setTxt] = useState('');
  const timer = useRef(0);
  const scramble = () => {
    if (timer.current || reduceMotion) return;
    let n = 0;
    timer.current = setInterval(() => {
      setTxt(Array.from({ length: len }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join(''));
      if (++n > 14) { clearInterval(timer.current); timer.current = 0; setTxt(''); }
    }, 55);
  };
  useEffect(() => {
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { setTimeout(scramble, 300 + Math.random() * 900); io.disconnect(); } }, { rootMargin: '-20% 0px' });
    io.observe(ref.current);
    return () => { io.disconnect(); clearInterval(timer.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span ref={ref} className={`redact${txt ? ' is-scrambling' : ''}`} style={{ '--len': len }}
      role="img" aria-label="Classified until 26 October 2026" onPointerEnter={scramble}>{txt}</span>
  );
}

/* ---------- one product chapter ---------- */
const PRODUCTS = [
  { key: 'one', n: '01', a: 'The First', tone: 'dark', progress: 0.78, lens: [11, 16, 9, 7],
    seen: '26 October 2026 — on stage, at Launchpad',
    say: <>It's real, and it's under that cloth. On 26 October, in front of everyone in the room, <em>it won't be.</em></> },
  { key: 'two', n: '02', a: 'The Second', tone: 'light', progress: 0.5, lens: [13, 12, 14, 6], room: P.lpRoom02,
    seen: '26 October 2026 — on stage, at Launchpad',
    say: <>You can see its shadow. You can see its shape. The rest is <em>for the room.</em></> },
  { key: 'three', n: '03', a: 'The Final', tone: 'dark', progress: 0.7, lens: [10, 15, 12, 8],
    seen: '26 October 2026 — the last reveal of the day',
    say: <>Saved for last, for a reason. One light, one object, <em>one moment.</em></> },
];
const FIELDS = ['Category', 'Made for', 'Built by', 'Name'];

function Product({ p }) {
  const stageEl = useRef(null), stage = useRef(null);
  const [ready, setReady] = useState(false);
  const [held, setHeld] = useState(false);
  const { d } = useCountdown();
  const press = useRef(0);
  const hold = (on) => { setHeld(on); stage.current?.setPeek(on ? 1 : 0); };
  return (
    <section className={`lp-product lp-product--${p.key}`} id={`product-${p.n.slice(1)}`} data-tone={p.tone}>
      <div className={`lp-stage${ready ? ' has-3d' : ''}${!hasWebGL || reduceMotion ? ' no-3d' : ''}`} ref={stageEl}
        onPointerDown={() => { press.current = setTimeout(() => hold(true), 380); }}
        onPointerUp={() => { clearTimeout(press.current); hold(false); }}
        onPointerLeave={() => { clearTimeout(press.current); hold(false); }}
        onPointerCancel={() => { clearTimeout(press.current); hold(false); }}>
        {p.room && <div className="lp-stage__room" aria-hidden="true"><img src={IMG(p.room, 1600)} alt="" loading="lazy" /></div>}
        <StageCanvas ref={stage} stageKey={p.key} interactiveRef={stageEl} idleMotion initialProgress={p.progress} onReady={() => setReady(true)} />
        <div className="lp-stage__fallback" aria-hidden="true" />
        <p className="lp-stage__hint">Drag to look around · <b>Hold to peek</b></p>
      </div>
      <article className="lp-dossier">
        <motion.p className="lp-dossier__num" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 0.6, y: 0 }} viewport={{ once: true, margin: '-15%' }} transition={{ duration: 1.1, ease: [0.2, 0.7, 0.1, 1] }}>{p.n}</motion.p>
        <h2 className="lp-dossier__name">{p.a} <em>Reveal</em></h2>
        <p className="lp-dossier__tag">Product Launch <i /> Coming soon</p>
        <div className="lp-status"><span>Status</span><b>Under wraps</b><span className="lp-status__count">Reveal in <b>{d}</b> days</span></div>
        <dl className="lp-file">
          {FIELDS.map((f, i) => <div key={f}><dt>{f}</dt><dd><Redact len={p.lens[i]} /></dd></div>)}
          <div><dt>First seen</dt><dd>{p.seen}</dd></div>
        </dl>
        <p className="lp-say">{p.say}</p>
        <div className="lp-actions">
          <button type="button" className={`btn btn--light lp-peek${held ? ' is-held' : ''}`}
            onPointerDown={(e) => { e.preventDefault(); hold(true); }} onPointerUp={() => hold(false)} onPointerLeave={() => hold(false)} onPointerCancel={() => hold(false)}
            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); hold(true); } }} onKeyUp={() => hold(false)}>
            <span>Hold to peek</span><i aria-hidden="true">◐</i>
          </button>
          <RegistrationButton variant="ghost">Be in the room for the reveal</RegistrationButton>
        </div>
      </article>
    </section>
  );
}

export default function LaunchesPage() {
  useReveal();
  useArrive();
  useLaunchesSeo();
  const { d, h, m, s } = useCountdown();
  const [lineupReady, setLineupReady] = useState(false);
  useEffect(() => { document.body.classList.remove('is-loading'); }, []);
  return (
    <main className="lp">
      <section className={`lp-hero is-in${lineupReady ? ' has-3d' : ''}${!hasWebGL || reduceMotion ? ' no-3d' : ''}`} data-tone="dark">
        <StageCanvas lineup className="lp-hero__stage" onReady={() => setLineupReady(true)} />
        <div className="lp-hero__copy">
          <p className="eyebrow">The Launches · 26 October 2026</p>
          <h1 className="lp-hero__title"><Rv>Three objects.</Rv><Rv><em>One day.</em></Rv></h1>
          <p className="lp-hero__sub">Three products, kept under cloth until the moment they are revealed on stage. Nothing before. Everything on the day.</p>
        </div>
        <div className="lp-hero__labels" aria-hidden="true">
          <span>01 <em>The First Reveal</em></span><span>02 <em>The Second Reveal</em></span><span>03 <em>The Final Reveal</em></span>
        </div>
        <div className="lp-hero__count" role="timer" aria-label="Time until the reveals">
          <span className="lp-hero__countlabel">All three revealed in</span>
          <span className="lp-clock"><b>{d}</b>d <b>{h}</b>h <b>{m}</b>m <b>{s}</b>s</span>
        </div>
      </section>

      <section className="lp-protocol" data-tone="light">
        <p className="eyebrow" data-reveal>The reveal protocol</p>
        <ol className="lp-rules">
          <li data-reveal><span>i.</span><p>Nothing is shown <em>before the day.</em></p></li>
          <li data-reveal><span>ii.</span><p>Each launch is revealed <em>live, on stage.</em></p></li>
          <li data-reveal><span>iii.</span><p>Everyone in the room sees it <em>at the same moment.</em></p></li>
        </ol>
      </section>

      {PRODUCTS.map((p) => <Product key={p.key} p={p} />)}

      <section className="lp-seq" data-tone="light">
        <p className="eyebrow" data-reveal>From idea to stage</p>
        <div className="lp-seq__line" data-reveal>
          <div className="lp-seq__node is-done"><b>Idea</b><span>Someone saw a problem.</span></div>
          <div className="lp-seq__node is-done"><b>Creation</b><span>Someone built the answer.</span></div>
          <div className="lp-seq__node is-next"><b>Launch</b><span>26 October 2026, in the room.</span></div>
        </div>
        <p className="lp-seq__note" data-reveal>Every product on this page has made it through the first two. <em>The third happens on stage.</em></p>
      </section>

      <section className="lp-cta" data-tone="dark">
        <h2 className="lp-cta__title"><span>See them</span> <em>first.</em></h2>
        <p className="lp-cta__date">26 October 2026 · Launchpad</p>
        <RegistrationButton big magnetic>Be in the room</RegistrationButton>
      </section>
    </main>
  );
}
