import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { measureAll } from '../lib/scroll.js';
import { landingY } from '../lib/landing.js';

/* When a page mounts (after the page-turn), land at the top — or at the
   section named in the URL hash, once its layout has settled. */
export function useArrive() {
  const { hash } = useLocation();
  useEffect(() => {
    const to = (target) => (window.lenis ? window.lenis.scrollTo(target, { immediate: true, force: true }) : (typeof target === 'number' ? scrollTo(0, target) : target.scrollIntoView()));
    to(0);
    if (!hash) return undefined;
    const t = setTimeout(() => {
      measureAll();
      const el = document.querySelector(hash);
      if (el) to(landingY(el));
    }, 500);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
