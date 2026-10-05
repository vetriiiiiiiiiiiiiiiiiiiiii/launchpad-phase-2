export const reduceMotion = typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = typeof window !== 'undefined' && matchMedia('(pointer: fine)').matches;
export const isMobile = () => innerWidth <= 860;
export const hasWebGL = (() => {
  if (typeof window === 'undefined') return false;
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
})();
export const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 60 }) : setTimeout(fn, 16));
