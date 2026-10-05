import { useEffect } from 'react';
import Lenis from 'lenis';
import { finePointer, reduceMotion } from '../hooks/env.js';
import { landingY } from '../lib/landing.js';

/* Lenis on desktop; in-page anchors glide. */
export default function SmoothScroll() {
  useEffect(() => {
    let lenis = null, raf = 0;
    if (finePointer && !reduceMotion) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
      window.lenis = lenis;
      if (document.body.classList.contains('is-loading')) lenis.stop();
      const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }
    const onClick = (e) => {
      const a = e.target instanceof Element && e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      const el = id.length > 1 && document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const y = landingY(el);
      if (lenis) lenis.scrollTo(y, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    document.addEventListener('click', onClick);
    return () => { document.removeEventListener('click', onClick); cancelAnimationFrame(raf); lenis?.destroy(); window.lenis = null; };
  }, []);

  return null;
}
