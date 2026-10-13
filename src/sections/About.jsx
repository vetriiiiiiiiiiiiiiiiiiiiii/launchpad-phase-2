import Rv from '../components/Rv.jsx';
import { S, timeStart, timeEnd } from '../lib/content.js';

/* ---------- About: LaunchPad 2026 – Phase 2, and the vision behind it ---------- */
export function About() {
  return (
    <section className="about is-light" data-tone="light" id="about" data-folio="About">
      <div className="about__grid">
        <header className="about__head">
          <p className="eyebrow" data-reveal>About the summit</p>
          <h2 className="about__title" data-reveal><Rv>LaunchPad 2026</Rv><Rv><em>Phase 2.</em></Rv></h2>
          <p className="about__label" data-reveal>{S.summitLabel}</p>
          <dl className="about__meta" data-reveal>
            <div><dt>Presented by</dt><dd>R. Shivakumar Foundation</dd><dd>Entrepreneurship Development Cell, SRM IST Tiruchirappalli</dd></div>
            <div><dt>When &amp; where</dt><dd>28 October 2026</dd><dd>Trichy, Tamil Nadu</dd></div>
          </dl>
        </header>
        <div className="about__text">
          <p className="about__lead" data-reveal>
            LaunchPad is more than a summit — it is a step towards reshaping the future of entrepreneurship in Trichy.
          </p>
          <p data-reveal>
            By bringing together startup founders, innovators, investors, industry leaders and aspiring entrepreneurs, the summit aims to bridge the gap between ideas and opportunities, talent and mentorship, and innovation and investment.
          </p>
          <p data-reveal>
            At a time when emerging cities need stronger entrepreneurial networks and access to the right resources, LaunchPad seeks to create a lasting impact on Trichy’s startup landscape. With the ambition to become one of the first large-scale startup-focused summits in the region, it aspires to put Trichy on the map as a growing centre for innovation, enterprise and venture creation in Tamil Nadu.
          </p>
          <p data-reveal>
            More than a gathering, LaunchPad is a call to action — to inspire founders, empower aspiring entrepreneurs, encourage meaningful collaborations, and build the foundations for ventures that can grow beyond regional boundaries. <strong>The goal is not simply to discuss the future of startups, but to help create it.</strong>
          </p>
        </div>
      </div>
      <figure className="vision" data-reveal>
        <p className="vision__k">Vision</p>
        <blockquote className="vision__q">
          To transform Trichy’s startup ecosystem by building a strong, sustainable entrepreneurial network at SRM IST Tiruchirappalli — connecting <em>ideas, talent, mentorship and capital</em> to turn local potential into lasting impact.
        </blockquote>
      </figure>
    </section>
  );
}

/* ---------- Programme: the day, hour by hour (editable in the admin) ---------- */
export function Programme() {
  const rows = S.programme;
  const span = rows.length ? `${timeStart(rows[0].time)} – ${timeEnd(rows[rows.length - 1].time)}` : '';
  return (
    <section className="prog is-light" data-tone="light" id="programme" data-folio="Programme">
      <div className="prog__inner">
        <header className="prog__head">
          <p className="eyebrow" data-reveal>Programme</p>
          <h2 className="prog__title" data-reveal><Rv>The day,</Rv><Rv><em>hour by hour.</em></Rv></h2>
          <p className="prog__when" data-reveal>28 October 2026{span ? <> · <b>{span}</b></> : null}</p>
        </header>
        <ol className="prog__list">
          {rows.map((r, i) => (
            <li key={i} className="prog__row" data-reveal>
              <span className="prog__n">{String(i + 1).padStart(2, '0')}</span>
              <time className="prog__time">{r.time}</time>
              <span className="prog__name">{r.title}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Who will benefit ---------- */
const AUDIENCE = [
  ['Investors, Angels & VCs', 'Discover a curated pipeline of promising startups, identify emerging investment opportunities, and build strategic networks while gaining insights into evolving markets and innovations.'],
  ['Startups', 'Access potential investors, secure funding opportunities, gain visibility, and accelerate growth through mentorship, strategic connections and market validation.'],
  ['Innovators', 'Turn promising ideas into viable ventures through expert guidance, idea validation, access to resources, and collaboration with founders, mentors and industry professionals.'],
  ['Students', 'Gain firsthand exposure to the startup ecosystem, interact with founders and investors, explore career and internship opportunities, and develop entrepreneurial skills beyond the classroom.'],
  ['Aspiring Entrepreneurs', 'Find the right people, resources and guidance to take the first step towards building a startup — transforming ambition into action.'],
];
export function Audience() {
  return (
    <section className="aud is-light" data-tone="light" id="who-its-for" data-folio="Who will benefit">
      <header className="aud__head">
        <p className="eyebrow" data-reveal>Who will benefit</p>
        <h2 className="aud__title" data-reveal><Rv>Something here</Rv><Rv><em>for everyone in the room.</em></Rv></h2>
      </header>
      <ul className="aud__grid">
        {AUDIENCE.map(([t, d], i) => (
          <li key={t} className="aud__card" data-reveal>
            <span className="aud__n">{String(i + 1).padStart(2, '0')}</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
