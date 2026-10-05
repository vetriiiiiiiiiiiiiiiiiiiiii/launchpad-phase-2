import { useEffect, useRef } from 'react';
import Rv from '../components/Rv.jsx';
import Photo from '../components/Photo.jsx';
import { finePointer, reduceMotion } from '../hooks/env.js';
import { P } from '../lib/images.js';

const STEPS = [
  ['i.', 'Find the real problem.', 'Not the symptom. The thing underneath it.'],
  ['ii.', 'Break it apart.', 'Smaller pieces. Clearer questions.'],
  ['iii.', 'Build something rough.', 'Paper, code, cardboard — whatever moves it forward.'],
  ['iv.', 'Test it on the room.', 'Real feedback, from real people.'],
];

/* Hands-on problem solving, on graph paper. Move the cursor and it sketches
   in graphite; the marks fade the way pencil does under a thumb. */
export default function Workshop() {
  const ref = useRef(null), cv = useRef(null);
  useEffect(() => {
    if (!finePointer || reduceMotion) return undefined;
    const shop = ref.current, canvas = cv.current, ctx = canvas.getContext('2d');
    const size = () => { canvas.width = shop.clientWidth; canvas.height = shop.clientHeight; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; };
    size();
    const ro = new ResizeObserver(size); ro.observe(shop);
    let lx = null, ly = null, last = 0, fading = false, raf = 0;
    const fade = () => {
      const idleFor = performance.now() - last;
      if (idleFor > 900) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(250,251,248,0.03)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      }
      if (idleFor < 9000) raf = requestAnimationFrame(fade); else fading = false;
    };
    const move = (e) => {
      const r = shop.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (lx !== null) {
        const sp = Math.hypot(x - lx, y - ly);
        ctx.strokeStyle = 'rgba(2,80,59,0.6)'; ctx.lineWidth = Math.max(0.6, 1.8 - sp * 0.02);
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(x, y); ctx.stroke();
        ctx.strokeStyle = 'rgba(16,162,115,0.22)'; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(lx + (Math.random() - 0.5) * 1.6, ly + (Math.random() - 0.5) * 1.6); ctx.lineTo(x + (Math.random() - 0.5) * 1.6, y + (Math.random() - 0.5) * 1.6); ctx.stroke();
      }
      lx = x; ly = y; last = performance.now();
      if (!fading) { fading = true; raf = requestAnimationFrame(fade); }
    };
    const leave = () => { lx = ly = null; };
    shop.addEventListener('pointermove', move); shop.addEventListener('pointerleave', leave);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); shop.removeEventListener('pointermove', move); shop.removeEventListener('pointerleave', leave); };
  }, []);

  return (
    <section className="shop" data-tone="light" id="the-workshop" ref={ref} data-folio="The Workshop" data-cursor="Draw">
      <canvas className="shop__pencil" ref={cv} aria-hidden="true" />
      <div className="shop__inner">
        <header className="shop__head">
          <p className="eyebrow" data-reveal>Hands-on problem solving</p>
          <h2 className="shop__title" data-reveal><Rv>Don't just</Rv><Rv>listen.</Rv><Rv><em>Solve.</em></Rv></h2>
          <p className="shop__body" data-reveal>Hands-on sessions where you learn by working through real problems — with guidance, with tools, and with the people beside you.</p>
          <p className="shop__note" aria-hidden="true">go on — sketch on the page ↗</p>
        </header>
        <ol className="steps">
          {STEPS.map(([n, h, p]) => <li key={n} data-reveal><span>{n}</span><h3>{h}</h3><p>{p}</p></li>)}
        </ol>
        <div className="prints">
          <figure className="print print--1" data-reveal><Photo id={P.chalkTeacher} w={1100} sizes="(max-width: 860px) 100vw, 40vw" alt="A teacher working through a problem on a green chalkboard." /><figcaption>Fig. 1 — Learning by doing</figcaption></figure>
          <figure className="print print--2" data-reveal><Photo id={P.chalkStudents} w={900} alt="Two students solving a problem together at the board." /><figcaption>Fig. 2 — Solving it together</figcaption></figure>
          <figure className="print print--3" data-reveal><Photo id={P.chalkNotes} w={900} alt="A green chalkboard covered in working notes." /><figcaption>Fig. 3 — The working</figcaption></figure>
        </div>
      </div>
    </section>
  );
}
