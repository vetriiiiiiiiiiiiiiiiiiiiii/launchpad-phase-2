import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IMG, P } from '../lib/images.js';
import { markLoaderDone } from '../lib/loader.js';
import { reduceMotion } from '../hooks/env.js';

const STAGES = [
  [0, 'Setting the stage'],
  [25, 'Placing the chairs'],
  [50, 'Covering the objects'],
  [75, 'Dimming the lights'],
  [100, 'Doors open'],
];
const MIN_MS = reduceMotion ? 300 : 1700;   // long enough to be a moment, never a wait
const MAX_MS = 7000;                          // a slow network never holds the door shut

/* Real progress: fonts, the hero photograph, and the page's own load.
   A gentle trickle keeps the line moving while they arrive. */
function useLoadProgress() {
  const [target, setTarget] = useState(0);
  useEffect(() => {
    const parts = { fonts: 0, hero: 0, page: 0, stage: 0 };
    const weights = { fonts: 25, hero: 35, page: 10, stage: 30 };
    const update = () => setTarget(Object.keys(parts).reduce((s, k) => s + parts[k] * weights[k], 0));
    const finish = (k) => { parts[k] = 1; update(); };

    (document.fonts?.ready || Promise.resolve()).then(() => finish('fonts'));
    if (location.pathname === '/') {
      const img = new Image();
      img.onload = img.onerror = () => finish('hero');
      img.src = IMG(P.heroTalk, 1800);
    } else finish('hero');
    // on the home page, the velvet curtain has to be hung before the doors open
    if (location.pathname === '/' && !window.__curtainReady) addEventListener('lp:curtain', () => finish('stage'), { once: true });
    else finish('stage');
    if (document.readyState === 'complete') finish('page');
    else addEventListener('load', () => finish('page'), { once: true });
    const cap = setTimeout(() => { Object.keys(parts).forEach((k) => { parts[k] = 1; }); update(); }, MAX_MS);
    return () => clearTimeout(cap);
  }, []);
  return target;
}

export default function Loader() {
  const target = useLoadProgress();
  const [shown, setShown] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const started = useRef(performance.now());
  const raf = useRef(0);

  // ease the visible number toward the real one, with a slow trickle so it never stalls
  useEffect(() => {
    const tick = () => {
      setShown((s) => {
        const ceiling = target >= 100 ? 100 : Math.min(92, target + 18);
        const goal = Math.max(target, Math.min(ceiling, s + 0.18));
        const next = reduceMotion ? goal : s + (goal - s) * (target >= 100 ? 0.12 : 0.06);
        return Math.abs(goal - next) < 0.05 ? goal : next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);

  useEffect(() => {
    if (shown < 99.9 || leaving) return undefined;
    const wait = Math.max(0, MIN_MS - (performance.now() - started.current));
    const t = setTimeout(() => {
      setLeaving(true);
      markLoaderDone();
      setTimeout(() => setGone(true), reduceMotion ? 100 : 650);
    }, wait + 250);
    return () => clearTimeout(t);
  }, [shown, leaving]);

  const pct = Math.round(shown);
  const stage = [...STAGES].reverse().find(([at]) => pct >= at)[1];

  return (
    <AnimatePresence>
      {!gone && (
        <motion.div
          className={`loader${leaving ? ' is-leaving' : ''}`}
          role="status"
          aria-live="polite"
          aria-label={leaving ? 'Launchpad is ready' : `Loading Launchpad, ${pct} percent`}
          exit={{ opacity: 0, transition: { duration: reduceMotion ? 0.2 : 0.9, ease: [0.7, 0, 0.2, 1] } }}
        >
          <div className="loader__mark" aria-hidden="true">
            <span className="wordmark" style={{ '--track': `${0.9 - 0.48 * (shown / 100)}em` }}>Launchpad</span>
            <small>26 · 10 · 2026</small>
          </div>

          <div className="loader__foot" aria-hidden="true">
            <div className="loader__row">
              <span className="loader__stage" key={stage}>{stage}</span>
              <span className="loader__pct"><b>{String(pct).padStart(3, '0')}</b></span>
            </div>
            <div className="loader__fuse">
              <div className="loader__burn" style={{ transform: `scaleX(${shown / 100})` }} />
              <span className="loader__spark" style={{ left: `${shown}%` }} />
            </div>
            <div className="loader__row loader__row--meta">
              <span>One day. Three launches.</span>
              <span>Where ideas become real.</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
