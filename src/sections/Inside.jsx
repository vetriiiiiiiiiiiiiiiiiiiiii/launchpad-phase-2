import { Link } from 'react-router-dom';
import Rv from '../components/Rv.jsx';
import { usePeekHandlers } from '../components/Peek.jsx';
import { P } from '../lib/images.js';

const ROWS = [
  { n: '01', t: 'The Talks', d: 'Expert voices, unfiltered.', href: '#the-talks', img: P.talksStage },
  { n: '02', t: 'The Workshop', d: 'Hands-on problem solving.', href: '#the-workshop', img: P.chalkTeacher },
  { n: '03', t: 'The Pitch', d: 'Ideas, said out loud.', href: '#the-pitch', img: P.podium },
  { n: '04', t: 'The Launches', d: 'Three reveals.', to: '/launches', img: P.emeraldGlass },
  { n: '05', t: 'The Exhibition', d: "What's being built.", href: '#the-exhibition', img: P.roundLibrary },
  { n: '06', t: 'The Room', d: 'The people you meet.', href: '#the-room', img: P.cafeTree },
];

function Row({ row }) {
  const peek = usePeekHandlers(row.img);
  const inner = <><span className="index__n">{row.n}</span><span className="index__t">{row.t}</span><span className="index__d">{row.d}</span><i aria-hidden="true">→</i></>;
  return (
    <li data-reveal>
      {row.to
        ? <Link to={row.to} data-cursor="Open" {...peek}>{inner}</Link>
        : <a href={row.href} data-cursor="View" {...peek}>{inner}</a>}
    </li>
  );
}

export default function Inside() {
  return (
    <section className="inside is-light" data-tone="light" id="the-experience" data-folio="Inside the day">
      <header className="inside__head">
        <p className="eyebrow" data-reveal>What happens in the room</p>
        <h2 className="inside__title" data-reveal><Rv>Everything,</Rv><Rv><em>in one day.</em></Rv></h2>
      </header>
      <ol className="index">{ROWS.map((r) => <Row key={r.n} row={r} />)}</ol>
    </section>
  );
}
