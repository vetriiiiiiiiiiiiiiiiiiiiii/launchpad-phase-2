import { useRef } from 'react';
import Rv from '../components/Rv.jsx';
import Photo from '../components/Photo.jsx';
import Crop from '../components/Crop.jsx';
import { useScrollVars } from '../hooks/useScroll.js';
import { finePointer, reduceMotion } from '../hooks/env.js';
import { P } from '../lib/images.js';
import { clamp } from '../lib/scroll.js';

/* Letters that thicken as the cursor passes (on touch: as you scroll). */
function Weighted({ text, letters }) {
  return [...text].map((c, i) => (c === ' ' ? ' ' : (
    <span key={i} className="ch" ref={(el) => { if (el) letters.current.add(el); }}>{c}</span>
  )));
}

export default function Statement() {
  const ref = useRef(null);
  const letters = useRef(new Set());
  useScrollVars(ref, ({ y, vh, top }) => {
    if (finePointer || reduceMotion) return;
    const v = clamp((y + vh - top) / (vh * 1.4));
    const all = [...letters.current];
    all.forEach((l, i) => {
      const f = i / all.length;
      l.style.setProperty('--w', Math.round(400 + 480 * Math.max(0, 1 - Math.abs(f - (v * 1.5 - 0.25)) * 3.2)));
    });
  });
  const onMove = (e) => {
    if (!finePointer || reduceMotion) return;
    letters.current.forEach((l) => {
      const r = l.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      l.style.setProperty('--w', Math.round(400 + 500 * Math.max(0, 1 - d / 260)));
    });
  };
  const onLeave = () => letters.current.forEach((l) => l.style.setProperty('--w', 400));

  return (
    <section className="statement" data-tone="light" id="about" ref={ref} data-folio="Not another event">
      <div className="statement__inner">
        <p className="eyebrow" data-reveal>Launchpad · 26.10.2026</p>
        <h2 className="statement__big" data-reveal onPointerMove={onMove} onPointerLeave={onLeave}>
          <Rv><Weighted text="Not another" letters={letters} /></Rv>
          <Rv><Weighted text="event." letters={letters} /></Rv>
        </h2>
        <figure className="statement__plate">
          <Crop><Photo id={P.spotlight} w={1800} alt="A figure caught in a single beam of emerald light, waiting to begin." /></Crop>
          <figcaption>Pl. i — Before the room fills.</figcaption>
        </figure>
        <div className="statement__after">
          <h3 className="statement__sub" data-reveal><Rv>A day built around</Rv><Rv><em>people who build.</em></Rv></h3>
          <p className="statement__body" data-reveal>
            Launchpad brings together entrepreneurs, innovators, creators and ambitious minds for a concentrated day of conversations, experiences and three major product launches.
          </p>
        </div>
      </div>
    </section>
  );
}
