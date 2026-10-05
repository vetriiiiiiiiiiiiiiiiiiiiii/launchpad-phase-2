import { useEffect, useRef, useState } from 'react';
import Rv from '../components/Rv.jsx';
import Btn from '../components/Btn.jsx';
import { useScrollVars } from '../hooks/useScroll.js';
import { useCountdown } from '../hooks/useCountdown.js';
import { reduceMotion } from '../hooks/env.js';
import { IMG, P } from '../lib/images.js';

const PHASES = ['', 'is-logo', 'is-develop', 'is-open', 'is-copy'];
// arriving via a link to a section skips the intro
const seen = () => {
  if (location.hash) return '1'; try { return sessionStorage.getItem('lp-seen'); } catch (e) { return null; } };
const markSeen = () => { try { sessionStorage.setItem('lp-seen', 1); } catch (e) { /* private mode */ } };

/* Entering a physical room: darkness, the name, an emerald velvet curtain
   appears out of the black and parts, and light enters the hall. */
export default function Hero() {
  const ref = useRef(null);
  const skipNow = reduceMotion || !!seen();
  const [phase, setPhase] = useState(skipNow ? 4 : 0);
  const { d } = useCountdown();
  useScrollVars(ref);

  useEffect(() => {
    if (phase >= 4) {
      document.body.classList.remove('is-loading');
      window.lenis?.start();
      markSeen();
      return undefined;
    }
    document.body.classList.add('is-loading');
    window.lenis?.stop();
    const delays = [350, 1950, 1600, 1300];
    const t = setTimeout(() => setPhase((p) => p + 1), delays[phase]);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    const impatient = () => setPhase((p) => (p >= 2 ? 4 : p));
    ['wheel', 'touchstart', 'keydown'].forEach((t) => addEventListener(t, impatient, { passive: true }));
    return () => ['wheel', 'touchstart', 'keydown'].forEach((t) => removeEventListener(t, impatient));
  }, []);

  const cls = ['hero', ...PHASES.slice(1, phase + 1)].join(' ');
  const set = [900, 1800, 2600].map((w) => `${IMG(P.heroRoom, w)} ${w}w`).join(', ');

  return (
    <section className={cls} id="top" ref={ref}>
      <div className="hero__stage">
        <div className="hero__room">
          <img src={IMG(P.heroRoom, 1800)} srcSet={set} sizes="100vw" fetchpriority="high"
            alt="A hall of empty chairs under green light, moments before the doors open." />
        </div>
        <div className="hero__beam" aria-hidden="true" />
        <div className="hero__curtain hero__curtain--l" aria-hidden="true" />
        <div className="hero__curtain hero__curtain--r" aria-hidden="true" />
        <div className="hero__shade" aria-hidden="true" />
      </div>

      <div className="hero__mark" aria-hidden="true">
        <span className="wordmark">Launchpad</span>
        <small>26 · 10 · 2026</small>
      </div>

      <div className="hero__copy">
        <p className="hero__meta">
          <Rv>Launchpad</Rv>
          <span className="hero__rule" aria-hidden="true" />
          <Rv>26 October 2026</Rv>
          <span className="hero__rule" aria-hidden="true" />
          <Rv className="tminus">T–<b>{d}</b> days</Rv>
        </p>
        <p className="hero__count"><Rv>One day.</Rv><Rv>Three launches.</Rv></p>
        <h1 className="hero__title"><Rv>Where ideas</Rv><Rv><em>become real.</em></Rv></h1>
        <div className="hero__actions">
          <Btn href="#be-in-the-room" magnetic>Enter Launchpad</Btn>
          <Btn href="#the-day" variant="ghost" icon="↓">Explore the day</Btn>
        </div>
      </div>

      <button className="hero__skip" type="button" onClick={() => setPhase(4)}>Skip intro</button>
    </section>
  );
}
