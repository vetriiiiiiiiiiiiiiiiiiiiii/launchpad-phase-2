import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/* A magazine running head: the chapter you're in, bottom-left. */
export default function Folio() {
  const { pathname } = useLocation();
  const [now, setNow] = useState('26.10.2026');
  const [swap, setSwap] = useState(false);
  useEffect(() => {
    let t;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const next = e.target.dataset.folio;
        setSwap(true);
        clearTimeout(t);
        t = setTimeout(() => { setNow(next); setSwap(false); }, 300);
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    const s = setTimeout(() => document.querySelectorAll('[data-folio]').forEach((el) => io.observe(el)), 0);
    return () => { clearTimeout(s); clearTimeout(t); io.disconnect(); };
  }, [pathname]);
  return (
    <div className="folio" aria-hidden="true">
      <span>Launchpad</span><i /><span className={`folio__now${swap ? ' is-swap' : ''}`}>{now}</span>
    </div>
  );
}
