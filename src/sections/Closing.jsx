import { useRef } from 'react';
import Btn from '../components/Btn.jsx';
import { useScrollVars } from '../hooks/useScroll.js';
import { useCountdown } from '../hooks/useCountdown.js';

export function Marks() {
  return (
    <section className="marks" data-tone="light" data-folio="With purpose">
      <p className="marks__cap" data-reveal>An experience built with purpose.</p>
      <div className="marks__row">
        <figure className="mark mark--word" data-reveal>
          <p className="mark__name">Launchpad</p>
          <p className="mark__date">26 October 2026</p>
        </figure>
        <figure className="mark" data-reveal>
          <img src="/assets/logos/rs-foundation.png" alt="RS Foundation" width="252" height="116" loading="lazy" />
          <figcaption>RS Foundation</figcaption>
        </figure>
        <figure className="mark" data-reveal>
          <img src="/assets/logos/srm.png" alt="SRM Organization" width="264" height="102" loading="lazy" />
          <figcaption>SRM Organization</figcaption>
        </figure>
      </div>
    </section>
  );
}

/* Everything goes quiet. Two lines, a countdown, the name, one invitation. */
export function Finale() {
  const ref = useRef(null);
  const { d, h, m, s } = useCountdown();
  useScrollVars(ref);
  return (
    <section className="finale" id="be-in-the-room" ref={ref} data-folio="What's next" data-land="end">
      <div className="finale__sticky">
        <p className="finale__line finale__line--1">You came<br /><em>for the launch.</em></p>
        <p className="finale__line finale__line--2">You leave<br /><em>with what's next.</em></p>
        <div className="finale__end">
          <div className="count" role="timer" aria-label="Time until 26 October 2026">
            {[[d, 'Days'], [h, 'Hours'], [m, 'Minutes'], [s, 'Seconds']].map(([v, l]) => <div key={l}><b>{v}</b><span>{l}</span></div>)}
          </div>
          <p className="finale__date">26 October 2026</p>
          <p className="finale__word">Launchpad</p>
          {/* REPLACE href with the registration link */}
          <Btn href="#be-in-the-room" big magnetic>Be in the room</Btn>
        </div>
      </div>
    </section>
  );
}
