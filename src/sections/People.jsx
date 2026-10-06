import { useEffect, useRef } from 'react';
import Rv from '../components/Rv.jsx';
import Photo from '../components/Photo.jsx';
import Crop from '../components/Crop.jsx';
import { usePeekHandlers } from '../components/Peek.jsx';
import { useScrollVars } from '../hooks/useScroll.js';
import { finePointer, isMobile, reduceMotion } from '../hooks/env.js';
import { measureAll } from '../lib/scroll.js';
import { P } from '../lib/images.js';

/* ---------- For the ones who build ---------- */
const SPREAD = [
  ['a', P.founderLeaves, 1200, '01', 'Founders', 'Portrait of a young founder in front of a wall of leaves.', 1],
  ['b', P.greenhouseDuo, 900, '02', 'Reviewing', 'Two people reviewing work together in a greenhouse.', -1.4],
  ['c', P.teamOffice, 1200, '03', 'Teams', 'A team working through an idea together.', 0.8],
  ['d', P.chalkHand, 900, '04', 'Working it out', 'A hand writing formulas on a chalkboard.', -0.8],
  ['e', P.planningTable, 1200, '05', 'Planning', 'A group gathered around a table, planning.', 1.2],
  ['f', P.greenFabric, 900, '06', 'Imagining', 'A builder sitting against a sweep of green fabric, looking ahead.', -1],
  ['g', P.glasshouseWalk, 900, '07', 'Exploring', 'Someone exploring a lush glasshouse.', 0.6],
];

export function Builders() {
  const zone = useRef(null);
  const onMove = (e) => {
    if (!finePointer || reduceMotion) return;
    zone.current.style.setProperty('--mx', ((e.clientX / innerWidth) * 2 - 1).toFixed(3));
    zone.current.style.setProperty('--my', ((e.clientY / innerHeight) * 2 - 1).toFixed(3));
  };
  const fig = ([k, id, w, n, cap, alt, t]) => (
    <figure key={k} className={`ph ph--${k}`} style={{ '--t': t }}>
      <Photo id={id} w={w} sizes={k === 'a' ? '(max-width: 860px) 100vw, 45vw' : '(max-width: 860px) 50vw, 30vw'} alt={alt} />
      <figcaption><b>{n}</b> {cap}</figcaption>
    </figure>
  );
  return (
    <section className="builders is-light" data-tone="light" data-folio="For the ones who build">
      <header className="builders__head">
        <p className="eyebrow" data-reveal>The protagonist</p>
        <h2 className="builders__title" data-reveal><Rv>For the ones</Rv><Rv><em>who build.</em></Rv></h2>
        <p className="builders__who" data-reveal>Founders. <span>Students.</span> Creators. <span>Innovators.</span></p>
      </header>
      <div className="spread" ref={zone} onPointerMove={onMove}>
        {SPREAD.slice(0, 3).map(fig)}
        <blockquote className="spread__quote" data-reveal><p>Every room has a stage. This one is built around the people <em>in the seats</em>, too.</p></blockquote>
        {SPREAD.slice(3).map(fig)}
      </div>
    </section>
  );
}

/* ---------- The Conversation ---------- */
const INVENTORY = [
  ['i.', 'Two chairs', P.velvetSofa], ['ii.', 'A table', P.invTable], ['iii.', 'A notebook', P.invNotebook],
  ['iv.', 'A prototype', P.invPrototype], ['v.', 'Coffee', P.cafeTree], ['vi.', 'A microphone', P.speaker], ['vii.', 'Stage light', P.invStageLight],
];
function Item({ n, label, img }) {
  const peek = usePeekHandlers(img);
  return <li {...peek}><em>{n}</em> {label}</li>;
}
export function Conversation() {
  return (
    <section className="talk is-light" data-tone="light" data-folio="The Conversation">
      <div className="talk__grid">
        <figure className="talk__plate">
          <Crop><Photo id={P.greenhouseTalk} w={1600} sizes="(max-width: 860px) 86vw, 50vw" alt="Two people mid-conversation in a greenhouse, a plant between them." /></Crop>
        </figure>
        <div className="talk__text">
          <p className="eyebrow" data-reveal>The Conversation</p>
          <h2 className="talk__title" data-reveal><Rv>Good ideas</Rv><Rv>need good</Rv><Rv><em>conversations.</em></Rv></h2>
          <p className="talk__body" data-reveal>Intimate, unscripted founder conversations. Close enough to hear the hesitation before the honest answer.</p>
          <ul className="inventory" data-reveal aria-label="In the room">
            {INVENTORY.map(([n, l, img]) => <Item key={n} n={n} label={l} img={img} />)}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- The Exhibition: a gallery walked sideways ---------- */
const WORKS = [
  ['tall', P.roundLibrary, 1100, 'Hall', 'Visitors moving through the space.', 'A circular library, shelves rising on every side.'],
  ['sq', P.glassBlocks, 1100, 'Object', 'Products displayed like art.', 'A wall of green glass blocks.'],
  ['wide', P.expoBooth, 1400, 'Booth', 'Minimal. Considered. Room to look.', 'Inside a glasshouse full of green.'],
  ['tall', P.greenTiles, 1100, 'Light', 'Every object, properly lit.', 'Green tiles laid in a herringbone pattern.'],
  ['wide', P.expoFloor, 1400, 'Floor', 'Ideas, products and people meet.', 'A reading room opening onto a forest.'],
];
export function Exhibition() {
  const ref = useRef(null), track = useRef(null), span = useRef(0);
  useEffect(() => {
    const size = () => {
      if (isMobile() || reduceMotion) { span.current = 0; ref.current.style.height = ''; }
      else { span.current = Math.max(0, track.current.scrollWidth - innerWidth); ref.current.style.height = `${span.current + innerHeight}px`; }
      measureAll();
    };
    size();
    addEventListener('resize', size); addEventListener('load', size);
    return () => { removeEventListener('resize', size); removeEventListener('load', size); };
  }, []);
  useScrollVars(ref, ({ p }) => { if (span.current) track.current.style.setProperty('--hx', (p * span.current).toFixed(1)); });
  return (
    <section className="expo" data-tone="light" id="the-exhibition" ref={ref} data-folio="The Exhibition">
      <div className="expo__sticky">
        <header className="expo__head">
          <p className="eyebrow">The Exhibition</p>
          <h2 className="expo__title"><span>See what's</span> <em>being built.</em></h2>
        </header>
        <div className="expo__track" ref={track}>
          {WORKS.map(([k, id, w, tag, cap, alt], i) => (
            <figure key={i} className={`work work--${k}`}>
              <Photo id={id} w={w} sizes="(max-width: 860px) 78vw, 45vw" alt={alt} /><figcaption><span>{tag}</span> {cap}</figcaption>
            </figure>
          ))}
          <div className="work work--end"><p>Not an expo.<br /><em>An exhibition of what's next.</em></p></div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Connection ---------- */
export function Connection() {
  const ref = useRef(null);
  useScrollVars(ref);
  return (
    <section className="meet is-light" data-tone="light" id="the-room" ref={ref} data-folio="The Room">
      <div className="meet__inner">
        <h2 className="meet__title" data-reveal><Rv>The people</Rv><Rv>you meet</Rv><Rv><em>matter.</em></Rv></h2>
        <figure className="meet__ph meet__ph--1"><Photo id={P.cafeMonstera} w={1400} sizes="(max-width: 860px) 100vw, 45vw" alt="A crowded café under hanging lights, everyone mid-conversation." /></figure>
        <figure className="meet__ph meet__ph--2"><Photo id={P.cafePlants} w={900} alt="People gathered in a café full of plants." /></figure>
        <figure className="meet__ph meet__ph--3"><Photo id={P.cafeChairs} w={900} alt="People meeting over coffee among green chairs." /></figure>
        <p className="meet__body" data-reveal>Founders and investors. Students and operators. Builders who've done it and builders about to. The conversations that start here rarely end here.</p>
      </div>
    </section>
  );
}
