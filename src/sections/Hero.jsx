import { useEffect, useRef, useState } from 'react';
import Rv from '../components/Rv.jsx';
import Btn from '../components/Btn.jsx';
import { useScrollVars } from '../hooks/useScroll.js';
import { useCountdown } from '../hooks/useCountdown.js';
import { hasWebGL, isMobile, reduceMotion } from '../hooks/env.js';
import { loaderDone, onLoaderDone } from '../lib/loader.js';
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
  // the loading screen hands over its wordmark: the hero picks it up already in place
  const [handoff, setHandoff] = useState(false);
  const [ready, setReady] = useState(loaderDone());
  useEffect(() => onLoaderDone(() => setReady(true)), []);
  const { d } = useCountdown();
  useScrollVars(ref, ({ x }) => hall.current?.setScroll(x));

  /* the velvet curtain: a real cloth simulation when WebGL is available */
  const curtainHost = useRef(null), curtain = useRef(null);
  const [curtain3d, setCurtain3d] = useState(false);
  const hallHost = useRef(null), hall = useRef(null);
  const [hall3d, setHall3d] = useState(false);
  useEffect(() => {
    const announce = () => { window.__curtainReady = true; window.dispatchEvent(new Event('lp:curtain')); };
    if (!hasWebGL || reduceMotion) { announce(); return undefined; }
    let cancelled = false, io = null;
    const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 60 }) : setTimeout(fn, 16));
    Promise.all([import('../lib/curtain3d.js'), import('../lib/hall3d.js')]).then(([{ mountCurtain }, { mountHall }]) => {
      if (cancelled || !curtainHost.current) return;
      // the hall behind the curtain: built, its veiled objects settled, before the doors open
      let h = null;
      try { h = mountHall(hallHost.current, { mobile: isMobile() }); } catch (e) { h = null; }
      hall.current = h;
      if (h && skipNow) h.setOpen(1);
      const c = mountCurtain(curtainHost.current, { mobile: isMobile(), startOpen: skipNow });
      curtain.current = c;
      setCurtain3d(true);
      io = new IntersectionObserver((e) => {
        if (e[0].isIntersecting) { c.start(); h?.start(); } else { c.stop(); h?.stop(); }
      });
      const warm = () => {
        if (cancelled) return;
        if (h && !h.warm(30)) { idle(warm); return; }
        if (h) { h.renderOnce(); setHall3d(true); }
        io.observe(ref.current);
        announce();
      };
      warm();
    }).catch(announce);
    return () => {
      cancelled = true; io?.disconnect();
      curtain.current?.dispose(); curtain.current = null;
      hall.current?.dispose(); hall.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (phase >= 3) { curtain.current?.open(2.6); if (!skipNow) hall.current?.animateOpen(3000); } }, [phase, curtain3d]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase >= 4) {
      document.body.classList.remove('is-loading');
      window.lenis?.start();
      markSeen();
      return undefined;
    }
    document.body.classList.add('is-loading');
    window.lenis?.stop();
    if (!ready) return undefined;            // wait in the dark until the loader is done
    if (phase === 0) { setHandoff(true); setPhase(1); return undefined; }
    const delays = [0, 1500, 1600, 1300];
    const t = setTimeout(() => setPhase((p) => p + 1), delays[phase]);
    return () => clearTimeout(t);
  }, [phase, ready]);

  useEffect(() => {
    const impatient = () => { if (loaderDone()) setPhase((p) => (p >= 2 ? 4 : p)); };
    ['wheel', 'touchstart', 'keydown'].forEach((t) => addEventListener(t, impatient, { passive: true }));
    return () => ['wheel', 'touchstart', 'keydown'].forEach((t) => removeEventListener(t, impatient));
  }, []);

  const cls = ['hero', handoff && phase < 2 && 'from-loader', curtain3d && 'has-curtain3d', hall3d && 'has-hall3d', ...PHASES.slice(1, phase + 1)].filter(Boolean).join(' ');
  const set = [900, 1800, 2600].map((w) => `${IMG(P.heroRoom, w)} ${w}w`).join(', ');

  return (
    <section className={cls} id="top" ref={ref}>
      <div className="hero__stage">
        <div className="hero__hall" ref={hallHost} aria-hidden="true" />
        <div className="hero__room">
          <img src={IMG(P.heroRoom, 1800)} srcSet={set} sizes="100vw" fetchpriority="high"
            alt="A hall of empty chairs under green light, moments before the doors open." />
        </div>
        <div className="hero__beam" aria-hidden="true" />
        <div className="hero__curtain3d" ref={curtainHost} aria-hidden="true" />
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
