import { S, TBA, placeLine } from '../lib/content.js';

/* The essentials at a glance, right after the hero. */
export default function Facts() {
  const facts = [
    ['Date', '26 October 2026', 'Monday · one day'],
    ['Doors open', S.doorsTime || TBA, 'Full day programme'],
    ['Venue', placeLine(), S.venue ? 'In person' : 'Announced soon'],
    ['Format', 'In person', 'Talks · Pitching · Workshop · Launches'],
  ];
  return (
    <section className="facts" data-tone="light" aria-label="Key facts">
      <dl className="facts__row">
        {facts.map(([k, v, sub]) => (
          <div className="facts__cell" key={k} data-reveal>
            <dt>{k}</dt>
            <dd className={v === TBA ? 'is-tba' : undefined}>{v}</dd>
            <dd className="facts__sub">{sub}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
