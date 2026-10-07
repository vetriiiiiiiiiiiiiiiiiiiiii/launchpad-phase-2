import { useEffect, useRef } from 'react';
import { useScrollVars } from '../hooks/useScroll.js';
import { useCountdown } from '../hooks/useCountdown.js';
import { RegistrationButton } from '../components/RegistrationLink.jsx';
import { S } from '../lib/content.js';
import { IMG } from '../lib/images.js';
import { hasWebGL, isMobile, reduceMotion } from '../hooks/env.js';

export function Marks() {
  return (
    <section className="marks" data-tone="light" data-folio="With purpose">
      {S.marksCaption && <p className="marks__cap" data-reveal>{S.marksCaption}</p>}
      <div className="marks__row" style={{ '--marks': S.logos.length }}>
        <figure className="mark mark--word" data-reveal>
          <p className="mark__name">Launchpad</p>
          <p className="mark__date">26 October 2026</p>
        </figure>
        {S.logos.map((l, i) => (
          <figure className="mark" data-reveal key={i}>
            <img src={IMG(l.image, 600)} alt={l.name || 'Partner logo'} loading="lazy" />
            {l.name && <figcaption>{l.name}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}

/* Everything goes quiet. Two lines, a countdown, the name, one invitation. */
export function Finale() {
  const ref = useRef(null);
  const { d, h, m, s } = useCountdown();
  /* the curtain call: the same velvet that opened the site closes it */
  const host = useRef(null), curtain = useRef(null);
  useScrollVars(ref, ({ p }) => {
    // open while the first line plays; draws closed through "you leave with what's next"
    curtain.current?.setTarget(1 - Math.min(1, Math.max(0, (p - 0.36) / 0.26)));
  });
  useEffect(() => {
    if (!hasWebGL || reduceMotion) return undefined;
    let c = null, vio = null, cancelled = false;
    const near = new IntersectionObserver(async (en) => {
      if (!en[0].isIntersecting) return;
      near.disconnect();
      const { mountCurtain } = await import('../lib/curtain3d.js');
      if (cancelled) return;
      c = mountCurtain(host.current, { mobile: isMobile(), startOpen: true });
      curtain.current = c;
      ref.current.classList.add('has-curtain');
      vio = new IntersectionObserver((e) => (e[0].isIntersecting ? c.start() : c.stop()));
      vio.observe(ref.current);
    }, { rootMargin: '150% 0px' });
    near.observe(ref.current);
    return () => { cancelled = true; near.disconnect(); vio?.disconnect(); c?.dispose(); curtain.current = null; };
  }, []);
  return (
    <section className="finale" id="be-in-the-room" ref={ref} data-folio="What's next" data-land="end">
      <div className="finale__sticky">
        <div className="finale__curtain" ref={host} aria-hidden="true" />
        <p className="finale__line finale__line--1">You came<br /><em>for the launch.</em></p>
        <p className="finale__line finale__line--2">You leave<br /><em>with what's next.</em></p>
        <div className="finale__end">
          <div className="count" role="timer" aria-label="Time until 26 October 2026">
            {[[d, 'Days'], [h, 'Hours'], [m, 'Minutes'], [s, 'Seconds']].map(([v, l]) => <div key={l}><b>{v}</b><span>{l}</span></div>)}
          </div>
          <p className="finale__date">26 October 2026</p>
          <p className="finale__word">Launchpad</p>
          <RegistrationButton big magnetic>Be in the room</RegistrationButton>
        </div>
      </div>
    </section>
  );
}
