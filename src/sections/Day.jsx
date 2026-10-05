import { useEffect, useRef, useState } from 'react';
import Rv from '../components/Rv.jsx';
import Photo from '../components/Photo.jsx';
import { isMobile } from '../hooks/env.js';
import { P } from '../lib/images.js';

const ACTS = ['Arrive', 'Discover', 'Launch', 'Connect', 'Leave different'];
const NUM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
const MOMENTS = [
  { act: 'Arrive', time: 'Morning', title: 'Arrival', text: 'People enter. The room begins to fill.', img: P.heroRoom, alt: 'A green-lit hall of empty chairs before the audience arrives.' },
  { act: 'Arrive', time: 'Then', title: 'Opening', text: 'The stage comes alive.', img: P.openingLights, alt: 'Stage lights throwing green beams into the dark before the opening.' },
  { act: 'Discover', time: 'Expert talks', title: 'The Talks', text: "People who've done it take the stage.", img: P.talksStage, alt: 'An audience facing a stage flooded with green light.' },
  { act: 'Discover', time: 'Hands-on', title: 'The Workshop', text: 'Real problems, solved together.', img: P.chalkTeacher, alt: 'A teacher working through a problem on a green chalkboard.' },
  { act: 'Discover', time: 'Pitching', title: 'The Pitch', text: 'Ideas, said out loud.', img: P.podium, alt: 'A student pitching from a podium.' },
  { act: 'Discover', time: 'Exhibition', title: 'Discovery', text: 'Ideas, products and people meet.', img: P.glasshouse, alt: 'Inside a glasshouse full of green.' },
  { act: 'Launch', time: 'The first launch', title: 'Product One', text: 'Under wraps until the moment.', veil: 'dark' },
  { act: 'Launch', time: 'The second launch', title: 'Product Two', text: 'Under wraps until the moment.', veil: 'light' },
  { act: 'Launch', time: 'The third launch', title: 'Product Three', text: 'Under wraps until the moment.', veil: 'spot' },
  { act: 'Connect', time: 'After', title: 'Connection', text: 'People meet.', img: P.cafeTree, alt: 'People talking in a café under a large indoor tree.' },
  { act: 'Leave different', time: 'Evening', title: 'Closing', text: 'The room leaves with something new.', img: P.forestLibrary, alt: 'A library opening onto a forest.' },
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

  return (
    <section className="day is-light" data-tone="light" id="the-day" data-folio="The Day">
      <header className="day__head">
        <p className="eyebrow" data-reveal>A single, continuous day</p>
        <h2 className="day__title" data-reveal><Rv>The Day</Rv></h2>
        <ol className="acts" data-reveal aria-label="The five acts of the day">
          {ACTS.map((a) => <li key={a} className={a === act ? 'is-now' : undefined}>{a}</li>)}
        </ol>
      </header>
      <div className="day__body">
        <div className="day__media" aria-hidden="true">
          <div className="day__frame">
            {MOMENTS.map((m, i) => (m.veil
              ? <div key={i} className={`day__veil day__veil--${m.veil}${i === active ? ' is-active' : ''}`} />
              : <Photo key={i} id={m.img} w={1400} sizes="(max-width: 860px) 100vw, 55vw" className={i === active ? 'is-active' : undefined} eager={i < 2} />))}
          </div>
          <p className="day__counter"><span className="day__now">{NUM[active]}</span><span>/ XI</span></p>
        </div>
        <ol className="day__list">
          {MOMENTS.map((m, i) => (
            <li key={i} ref={(el) => { items.current[i] = el; }} data-i={i}
              className={['moment', m.veil && 'moment--launch', m.veil === 'light' && 'moment--light', i === active && 'is-active'].filter(Boolean).join(' ')}>
              <span className="moment__num">{NUM[i]}</span>
              <div><p className="moment__time">{m.time}</p><h3>{m.title}</h3><p>{m.text}</p></div>
              {m.veil
                ? <div className={`moment__m moment__m--${m.veil}`} aria-hidden="true" />
                : <Photo className="moment__m" id={m.img} w={900} alt={m.alt} sizes="84vw" />}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
