import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/* Anything marked data-reveal fades/rises in once, as it enters the viewport. */
export function useReveal() {
  const { pathname } = useLocation();
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    const t = setTimeout(() => document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el)), 0);
    return () => { clearTimeout(t); io.disconnect(); };
  }, [pathname]);
}
