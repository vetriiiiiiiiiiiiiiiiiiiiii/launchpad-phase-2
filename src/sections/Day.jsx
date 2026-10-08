import { useEffect, useRef, useState } from 'react';
import Rv from '../components/Rv.jsx';
import Photo from '../components/Photo.jsx';
import { isMobile } from '../hooks/env.js';
import { P } from '../lib/images.js';

/* the three launches, shown as their veiled silhouettes (drawn from SvgDefs) */
const VEILS = {
  dark: { vb: '0 0 400 500', shape: 'tall', fill: 'litTop', folds: 'folds', t: 'translate(20 44) scale(3.6 4.3)' },
  light: { vb: '0 0 600 360', shape: 'wide', fill: 'litIvory', folds: 'foldsLight', t: 'translate(0 62) scale(6 2.75)' },
  spot: { vb: '0 0 420 460', shape: 'peak', fill: 'litSpot', folds: 'folds', t: 'translate(20 24) scale(3.8 3.9)' },
};
function Veil({ kind }) {
  const v = VEILS[kind];
  return (
    <svg className={`veil-art veil-art--${kind}`} viewBox={v.vb} aria-hidden="true">
      <use href={`#shape-${v.shape}`} fill={`url(#${v.fill})`} />
      <g clipPath={`url(#clip-${v.shape})`}><use href={`#${v.folds}`} transform={v.t} filter="url(#fold)" /></g>
    </svg>
  );
}

const ACTS = ['Arrive', 'Discover', 'Launch', 'Connect', 'Leave different'];
const NUM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
const MOMENTS = [
  { act: 'Arrive', time: 'Morning', title: 'Arrival', text: 'People enter. The room begins to fill.', img: P.tealHall, alt: 'An empty auditorium of teal seats before the audience arrives.' },
  { act: 'Arrive', time: 'Then', title: 'Opening', text: 'The stage comes alive.', img: P.dayOpening, alt: 'An audience facing a stage flooded with green light.' },
  { act: 'Discover', time: 'Expert talks', title: 'The Talks', text: "People who've done it take the stage.", img: P.dayTalks, alt: 'A speaker at the lectern, mid-sentence.' },
  { act: 'Discover', time: 'Hands-on', title: 'The Workshop', text: 'Real problems, solved together.', img: P.dayWorkshop, alt: 'A teacher working through a problem on a green chalkboard.' },
  { act: 'Discover', time: 'Pitching', title: 'The Pitch', text: 'Ideas, said out loud.', img: P.dayPitch, alt: 'A student pitching from a podium.' },
  { act: 'Discover', time: 'Exhibition', title: 'Discovery', text: 'Ideas, products and people meet.', img: P.dayDiscovery, alt: 'Inside a glasshouse full of green.' },
  { act: 'Launch', time: 'On stage', title: 'Three Launches', text: 'Three products, revealed live — under wraps until the moment.', veil: 'spot' },
  { act: 'Connect', time: 'After', title: 'Connection', text: 'People meet.', img: P.dayConnection, alt: 'A crowded café under hanging lights, everyone mid-conversation.' },
  { act: 'Leave different', time: 'Evening', title: 'Closing', text: 'The room leaves with something new.', img: P.dayClosing, alt: 'A library opening onto a forest.' },
];

/* The day as one continuous journey: a sticky frame on the left follows the
   moment you're reading; on phones the moments become full-bleed swipe cards. */
export default function Day() {
  const [active, setActive] = useState(0);
  const items = useRef([]);
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting && !isMobile()) setActive(+e.target.dataset.i); });
    }, { rootMargin: '-48% 0px -48% 0px' });
    items.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  const act = MOMENTS[active].act;
  // the sun crosses the day as the moments pass; the room's light follows it
  const tDay = active / (MOMENTS.length - 1);
  const ang = Math.PI * (1 - tDay);
  const sunX = 150 + 128 * Math.cos(ang), sunY = 118 - 100 * Math.sin(ang);
  const sky = (() => {
    const stops = [[238, 246, 239], [250, 251, 248], [222, 233, 225]];
    const k = tDay < 0.5 ? tDay * 2 : (tDay - 0.5) * 2, [a, b2] = tDay < 0.5 ? [stops[0], stops[1]] : [stops[1], stops[2]];
    return `rgb(${a.map((v, i) => Math.round(v + (b2[i] - v) * k)).join(',')})`;
  })();
  const clock = ['Morning', 'Morning', 'Late morning', 'Midday', 'Midday', 'Afternoon', 'Late afternoon', 'Evening', 'Evening'][active];

  return (
    <section className="day is-light" data-tone="light" id="the-day" data-folio="The Day" style={{ background: sky }}>
      <header className="day__head">
        <p className="eyebrow" data-reveal>A single, continuous day</p>
        <h2 className="day__title" data-reveal><Rv>The Day</Rv></h2>
        <ol className="acts" data-reveal aria-label="The five acts of the day">
          {ACTS.map((a) => <li key={a} className={a === act ? 'is-now' : undefined}>{a}</li>)}
        </ol>
      </header>
      <div className="day__body">
        <div className="day__media" aria-hidden="true">
          <div className="day__sun">
            <svg viewBox="0 0 300 130">
              <path d="M22 118 A128 100 0 0 1 278 118" className="day__arc" />
              <path d="M22 118 A128 100 0 0 1 278 118" className="day__arc day__arc--done" pathLength="1" style={{ strokeDasharray: `${tDay} 1` }} />
              <line x1="10" y1="118" x2="290" y2="118" className="day__horizon" />
              <g style={{ transform: `translate(${sunX.toFixed(1)}px, ${sunY.toFixed(1)}px)` }} className="day__sundot">
                <circle r="14" className="day__halo" /><circle r="5.5" />
              </g>
            </svg>
            <p className="day__clock"><span>{clock}</span><em>{NUM[active]} / {NUM[MOMENTS.length - 1]}</em></p>
          </div>
          <div className="day__frame">
            {MOMENTS.map((m, i) => (m.veil
              ? <div key={i} className={`day__veil day__veil--${m.veil}${i === active ? ' is-active' : ''}`}><Veil kind={m.veil} /></div>
              : <Photo key={i} id={m.img} w={1400} sizes="(max-width: 860px) 100vw, 55vw" className={i === active ? 'is-active' : undefined} eager={i < 2} />))}
          </div>
        </div>
        <ol className="day__list">
          {MOMENTS.map((m, i) => (
            <li key={i} ref={(el) => { items.current[i] = el; }} data-i={i}
              className={['moment', m.veil && 'moment--launch', m.veil === 'light' && 'moment--light', i === active && 'is-active'].filter(Boolean).join(' ')}>
              <span className="moment__num">{NUM[i]}</span>
              <div><p className="moment__time">{m.time}</p><h3>{m.title}</h3><p>{m.text}</p></div>
              {m.veil
                ? <div className={`moment__m moment__m--${m.veil}`} aria-hidden="true"><Veil kind={m.veil} /></div>
                : <Photo className="moment__m" id={m.img} w={900} alt={m.alt} sizes="84vw" />}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
