import Rv from '../components/Rv.jsx';

/* The three launches, mentioned — what they are stays under wraps until the day. */
export function LaunchesIntro() {
  return (
    <section className="launches-intro is-light" data-tone="light" id="the-launches" data-folio="The Launches">
      <div className="launches-intro__inner">
        <p className="eyebrow" data-reveal>The centrepiece</p>
        <h2 className="launches-intro__title" data-reveal><Rv>One day.</Rv><Rv><em>Three launches.</em></Rv></h2>
        <p className="launches-intro__body" data-reveal>Three products. Three reveals. Each kept under wraps until its moment on stage — and each moment shared by everyone in the room.</p>
        <p className="launches-intro__seq" data-reveal aria-label="Idea, creation, launch"><span>Idea</span><i /><span>Creation</span><i /><span>Launch</span></p>
      </div>
    </section>
  );
}
