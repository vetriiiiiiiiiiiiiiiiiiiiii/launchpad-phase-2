import { useRef } from 'react';
import Photo from '../components/Photo.jsx';
import { useScrollVars } from '../hooks/useScroll.js';
import { clamp } from '../lib/scroll.js';
import { P } from '../lib/images.js';

const CARDS = [
  ['01', 'The problem.', 'Something is broken. Say what.'],
  ['02', 'The insight.', "What you see that others don't."],
  ['03', 'The solution.', 'What you built. Show it.'],
  ['04', 'Why now.', 'Why this, why you, why today.'],
  ['05', 'The ask.', 'What you need from the room.'],
];

/* Pitching: a deck of paper slides, one card leaving at a time as you scroll. */
export default function Pitch() {
  const ref = useRef(null), cards = useRef([]), count = useRef(null);
  useScrollVars(ref, ({ p }) => {
    const n = CARDS.length + 1;
    const s = clamp((p - 0.1) / 0.8) * (n - 1);
    cards.current.forEach((c, i) => {
      if (!c) return;
      c.style.setProperty('--t', (i === n - 1 ? 0 : clamp(s - i)).toFixed(3));
      c.style.setProperty('--d', Math.min(Math.max(0, i - s), 4).toFixed(3));
      c.style.zIndex = n - i;
    });
    if (count.current) count.current.textContent = String(Math.min(n, Math.floor(s + 0.5) + 1)).padStart(2, '0');
  });
  return (
    <section className="pitch" id="the-pitch" ref={ref} data-folio="The Pitch">
      <div className="pitch__sticky">
        <div className="pitch__bg" aria-hidden="true"><Photo id={P.podium} w={2000} sizes="100vw" /></div>
        <div className="pitch__copy">
          <p className="eyebrow">Pitching</p>
          <h2 className="pitch__title"><span>Stand up.</span> <span>Speak up.</span> <span><em>Be heard.</em></span></h2>
          <p className="pitch__body">Founders and student builders take the stage to pitch their ideas to the room — and to the people in it who can help those ideas happen.</p>
        </div>
        <div className="deck" aria-label="Anatomy of a pitch">
          {CARDS.map(([n, h, p], i) => (
            <article key={n} className="card" ref={(el) => { cards.current[i] = el; }}>
              <p className="card__n">{n}</p><h3>{h}</h3><p>{p}</p><span className="card__f">Launchpad · The Pitch</span>
            </article>
          ))}
          <article className="card card--end" ref={(el) => { cards.current[CARDS.length] = el; }}>
            <h3>The room is <em>listening.</em></h3><span className="card__f">26 October 2026</span>
          </article>
        </div>
        <p className="pitch__progress"><span className="pitch__count" ref={count}>01</span> / 06</p>
      </div>
    </section>
  );
}
