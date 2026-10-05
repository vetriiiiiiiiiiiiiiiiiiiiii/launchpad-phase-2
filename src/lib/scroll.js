/* One scroll engine for the whole site.
   Registered elements get --p (progress through a tall section), --e (entering),
   --x (exiting past the top) and --v (visibility pass) written as CSS variables,
   and an optional callback each frame. Global subscribers run every frame too. */
const items = new Set();
const subs = new Set();
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
let vh = typeof window !== 'undefined' ? innerHeight : 800;
let lastY = -1, ticking = false, started = false;

const measureOne = (it) => {
  const r = it.el.getBoundingClientRect();
  it.top = r.top + scrollY;
  it.h = it.el.offsetHeight;
};

const frame = () => {
  ticking = false;
  const y = scrollY;
  if (y === lastY) return;
  lastY = y;
  items.forEach((it) => {
    const { top, h, el } = it;
    if (y + vh < top - vh || y > top + h + vh) return;
    const v = {
      p: clamp((y - top) / Math.max(h - vh, 1)),
      e: clamp((y + vh - top) / vh),
      x: clamp((y - top) / vh),
      v: clamp((y + vh - top) / (h + vh)),
      y, vh, top, h,
    };
    if (it.vars) {
      el.style.setProperty('--p', v.p.toFixed(4));
      el.style.setProperty('--e', v.e.toFixed(4));
      el.style.setProperty('--x', v.x.toFixed(4));
      el.style.setProperty('--v', v.v.toFixed(4));
    }
    if (it.cb) it.cb(v);
  });
  subs.forEach((fn) => fn(y, vh));
};

export const requestFrame = (force = false) => {
  if (force) lastY = -1;
  if (!ticking) { ticking = true; requestAnimationFrame(frame); }
};

export const measureAll = () => {
  vh = innerHeight;
  items.forEach(measureOne);
  requestFrame(true);
};

const start = () => {
  if (started) return;
  started = true;
  addEventListener('scroll', () => requestFrame(), { passive: true });
  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(measureAll, 120); });
  addEventListener('load', measureAll);
  document.fonts?.ready.then(measureAll);
  // page height changes (images, fonts, JS-sized sections) move everything below
  let rt;
  new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(measureAll, 60); }).observe(document.body);
};

export const register = (el, cb, { vars = true } = {}) => {
  start();
  const it = { el, cb, vars, top: 0, h: 0 };
  items.add(it);
  measureOne(it);
  requestFrame(true);
  return () => items.delete(it);
};

export const subscribe = (fn) => {
  start();
  subs.add(fn);
  requestFrame(true);
  return () => subs.delete(fn);
};

export { clamp };
