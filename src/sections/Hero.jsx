import { useEffect, useRef, useState } from 'react';
import Rv from '../components/Rv.jsx';
import Btn from '../components/Btn.jsx';
import FlapClock from '../components/FlapClock.jsx';
import { useScrollVars } from '../hooks/useScroll.js';
import { hasWebGL, isMobile, reduceMotion } from '../hooks/env.js';
import { loaderDone, onLoaderDone } from '../lib/loader.js';
import { IMG, P, srcSet } from '../lib/images.js';
import { S, registerHref } from '../lib/content.js';

const ext = () => (registerHref().startsWith('http') ? { target: '_blank', rel: 'noopener' } : {});

/* headline letters, each lit by the follow spot */
function Lit({ text }) {
  return [...text].map((c, i) => (c === ' ' ? ' ' : <span key={i} className="lch" aria-hidden="true">{c}</span>));
}

/* what's behind the curtain: the day itself, one moment at a time */
const SLIDES = [
  { id: P.heroTalk, label: 'Expert talks', alt: 'A speaker addressing a full hall.' },
  { id: P.heroPitch, label: 'Pitching', alt: 'A founder presenting a product to the room on a big screen.' },
  { id: P.heroWork, label: 'Hands-on problem solving', alt: 'A team working through a problem at a whiteboard.' },
  { id: P.talksStage, label: 'Three product launches', alt: 'Stage lights bursting over an audience.' },
];

const PHASES = ['', 'is-logo', 'is-develop', 'is-open', 'is-copy'];
// arriving via a link to a section skips the intro
const seen = () => {
  if (new URLSearchParams(location.search).has('intro')) return null;   // ?intro always plays it
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
  useScrollVars(ref);

  /* the velvet curtain: a real cloth simulation when WebGL is available */
  const curtainHost = useRef(null), curtain = useRef(null);
  const [curtain3d, setCurtain3d] = useState(false);
  useEffect(() => {
    const announce = () => { window.__curtainReady = true; window.dispatchEvent(new Event('lp:curtain')); };
    if (!hasWebGL || reduceMotion) { announce(); return undefined; }
    let cancelled = false, io = null;
    import('../lib/curtain3d.js').then(({ mountCurtain }) => {
      if (cancelled || !curtainHost.current) return;
      const c = mountCurtain(curtainHost.current, { mobile: isMobile(), startOpen: skipNow });
      curtain.current = c;
      setCurtain3d(true);
      io = new IntersectionObserver((e) => (e[0].isIntersecting ? c.start() : c.stop()));
      io.observe(ref.current);
      announce();
    }).catch(announce);
    return () => {
      cancelled = true; io?.disconnect();
      curtain.current?.dispose(); curtain.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (phase >= 3) curtain.current?.open(3.0); }, [phase, curtain3d]);

  /* close the curtain and play the opening again */
  const replay = () => {
    window.lenis ? window.lenis.scrollTo(0, { immediate: true, force: true }) : scrollTo(0, 0);
    curtain.current?.close(1.4);   // draw it closed, rings sliding back along the rail
    setHandoff(false);
    setPhase(1);
  };

  /* the room leans with you (a few pixels of parallax, like a camera on a slider),
     and the cursor is a follow spot: it lights the dark hall wherever it points.
     Without a cursor, the spot drifts slowly on its own. */
  const roomRef = useRef(null), titleRef = useRef(null);
  useEffect(() => {
    if (reduceMotion) return undefined;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    let sx = innerWidth * 0.62, sy = innerHeight * 0.48, stx = sx, sty = sy, lastMove = -1e9;
    let letters = [], frameN = 0;
    const move = (e) => {
      tx = (e.clientX / innerWidth - 0.5) * -22; ty = (e.clientY / innerHeight - 0.5) * -12;
      stx = e.clientX; sty = e.clientY; lastMove = performance.now();
    };
    const loop = (now = 0) => {
      x += (tx - x) * 0.05; y += (ty - y) * 0.05;
      if (now - lastMove > 2500) {          // nobody steering: the operator drifts it slowly
        const t = now / 1000;
        stx = innerWidth * (0.5 + 0.26 * Math.sin(t * 0.23)); sty = innerHeight * (0.5 + 0.12 * Math.sin(t * 0.31 + 1));
      }
      sx += (stx - sx) * 0.07; sy += (sty - sy) * 0.07;   // a heavy lamp: it lags, then lands
      const el = ref.current;
      if (el) {
        el.style.setProperty('--sx', `${sx.toFixed(1)}px`);
        el.style.setProperty('--sy', `${sy.toFixed(1)}px`);
      }
      // the type is lit by the lamp: letters near it brighten, and the
      // headline's shadow falls away from the light
      const tl = titleRef.current;
      if (tl) {
        if (!letters.length || frameN++ % 30 === 0) letters = [...tl.querySelectorAll('.lch')].map((n) => ({ n, r: n.getBoundingClientRect() }));
        letters.forEach(({ n, r }) => {
          const dx = r.left + r.width / 2 - sx, dy = r.top + r.height / 2 - sy;
          const lit = Math.max(0, 1 - Math.hypot(dx, dy * 1.4) / (innerWidth * 0.32));
          n.style.setProperty('--lit', lit.toFixed(3));
        });
        const tr = tl.getBoundingClientRect();
        const cx = tr.left + tr.width / 2, cy = tr.top + tr.height / 2;
        const vx = cx - sx, vy = cy - sy, dist = Math.hypot(vx, vy) || 1;
        const len = Math.min(34, 8 + dist / 40);
        tl.style.setProperty('--shx', `${(vx / dist * len).toFixed(1)}px`);
        tl.style.setProperty('--shy', `${(vy / dist * len * 0.6 + 6).toFixed(1)}px`);
      }
      roomRef.current?.style.setProperty('--px', `${x.toFixed(2)}px`);
      roomRef.current?.style.setProperty('--py', `${y.toFixed(2)}px`);
      raf = requestAnimationFrame(loop);
    };
    addEventListener('pointermove', move, { passive: true });
    loop();
    return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', move); };
  }, []);

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
    // one movement: the curtain is already hung and closed as the loader lifts,
    // starts parting at once, and the hall and headline rise in while it opens
    const delays = curtain3d ? [0, 0, 450, 1300] : [0, 600, 900, 1300];
    const t = setTimeout(() => setPhase((p) => p + 1), delays[phase]);
    return () => clearTimeout(t);
  }, [phase, ready, curtain3d]);

  useEffect(() => {
    const impatient = () => { if (loaderDone()) setPhase((p) => (p >= 2 ? 4 : p)); };
    ['wheel', 'touchstart', 'keydown'].forEach((t) => addEventListener(t, impatient, { passive: true }));
    return () => ['wheel', 'touchstart', 'keydown'].forEach((t) => removeEventListener(t, impatient));
  }, []);

  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (phase < 4 || reduceMotion) return undefined;
    const t = setInterval(() => setSlide((i) => (i + 1) % SLIDES.length), 4800);
    return () => clearInterval(t);
  }, [phase]);

  const cls = ['hero', handoff && phase < 2 && 'from-loader', curtain3d && 'has-curtain3d', ...PHASES.slice(1, phase + 1)].filter(Boolean).join(' ');
  const set = (id) => srcSet(id, 2200);

  return (
    <section className={cls} id="top" ref={ref}>
      <div className="hero__stage">
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
          {/* a print grade: shadows fall to deep emerald (never black), highlights to mint-white */}
          <filter id="hero-grade" colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.008 0.012 0.05 0.30 0.86" />
              <feFuncG type="table" tableValues="0.18 0.2 0.29 0.58 0.95" />
              <feFuncB type="table" tableValues="0.135 0.15 0.22 0.46 0.9" />
            </feComponentTransfer>
          </filter>
          <filter id="hero-grade-people" colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.008 0.02 0.12 0.46 0.86" />
              <feFuncG type="table" tableValues="0.18 0.22 0.36 0.68 0.94" />
              <feFuncB type="table" tableValues="0.135 0.17 0.27 0.54 0.88" />
            </feComponentTransfer>
          </filter>
        </svg>
        <div className="hero__room" ref={roomRef}>
          {SLIDES.map((sl, i) => (
            <div key={sl.id} className={`hero__slide${i === slide ? ' is-active' : ''}`}>
              <img src={IMG(sl.id, 1800)} srcSet={set(sl.id)} sizes="100vw" alt={sl.alt}
                fetchpriority={i === 0 ? 'high' : undefined} loading={i === 0 ? 'eager' : 'lazy'} />
            </div>
          ))}
        </div>
        <div className="hero__spot" aria-hidden="true"><i /></div>
        <div className="hero__light" aria-hidden="true">
          <div className="hero__cone" />
          <div className="hero__haze" />
          <div className="hero__pool" />
        </div>
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
          <Rv>{S.summitLabel}</Rv>
          <span className="hero__rule" aria-hidden="true" />
          <Rv>26 October 2026</Rv>
        </p>
        <div className="hero__count"><FlapClock /></div>
        <h1 className="hero__title" ref={titleRef} aria-label="Where ideas become real.">
          <Rv><Lit text="Where ideas" /></Rv>
          <Rv><em><Lit text="become real." /></em></Rv>
        </h1>
        <ul className="hero__programme" aria-label="The programme">
          {SLIDES.map((sl, i) => (
            <li key={sl.label} className={i === slide ? 'is-now' : undefined}>
              <button type="button" onClick={() => setSlide(i)}>{sl.label}</button>
            </li>
          ))}
        </ul>
        <div className="hero__actions">
          <Btn href={registerHref()} magnetic {...ext()}>Enter Launchpad</Btn>
          <Btn href="#the-day" variant="ghost" icon="↓">Explore the day</Btn>
        </div>
      </div>

      <button className="hero__skip" type="button" onClick={() => setPhase(4)}>Skip intro</button>
      <button className="hero__replay" type="button" onClick={replay} aria-label="Replay the opening">
        <i aria-hidden="true">↺</i><span>Replay the opening</span>
      </button>
    </section>
  );
}
