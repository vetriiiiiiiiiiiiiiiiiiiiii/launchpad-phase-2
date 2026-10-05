import { useRef } from 'react';
import Rv from '../components/Rv.jsx';
import Photo from '../components/Photo.jsx';
import { useScrollVars } from '../hooks/useScroll.js';
import { P } from '../lib/images.js';

/* Expert talks: the stage opens from a slit of light as you scroll. */
export default function Talks() {
  const ref = useRef(null);
  useScrollVars(ref);
  return (
    <>
      <section className="talks" id="the-talks" ref={ref} data-folio="The Talks">
        <div className="talks__sticky">
          <div className="talks__slit">
            <Photo id={P.talksStage} w={2200} sizes="100vw" alt="An audience facing a stage flooded with green light." />
          </div>
          <div className="talks__copy">
            <p className="eyebrow">Expert Talks</p>
            <h2 className="talks__title"><Rv>Learn from</Rv><Rv>those who've</Rv><Rv><em>done it.</em></Rv></h2>
          </div>
        </div>
      </section>
      <section className="talks-more is-light" data-tone="light" data-folio="The Talks">
        <div className="talks-more__grid">
          <p className="talks-more__body" data-reveal>Expert talks from people who have built, scaled, stumbled and started again — the lessons that rarely make it into a textbook, told by the people who learned them.</p>
          <figure className="ph talks-more__a" data-reveal><Photo id={P.speaker} w={1100} sizes="(max-width: 860px) 50vw, 35vw" alt="A speaker at the microphone, notes in hand." /><figcaption><b>i</b> On stage</figcaption></figure>
          <figure className="ph talks-more__b" data-reveal><Photo id={P.panel} w={900} alt="A panel in conversation on stage." /><figcaption><b>ii</b> The panel</figcaption></figure>
        </div>
        <div className="lineup" data-reveal>
          <p className="lineup__label">The lineup</p>
          <p className="lineup__status">Revealed <em>soon.</em></p>
        </div>
        <div className="roll" aria-hidden="true">
          <div className="roll__track">
            {[0, 1].map((k) => <span key={k}>Founders <i>·</i> Operators <i>·</i> Investors <i>·</i> Makers <i>·</i> Experts <i>·</i>&nbsp;</span>)}
          </div>
        </div>
      </section>
    </>
  );
}
