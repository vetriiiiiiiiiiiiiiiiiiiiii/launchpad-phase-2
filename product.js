/* LAUNCHPAD — The Launches (product page) */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const doc = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const mobile = innerWidth <= 860;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const pad = (n) => String(n).padStart(2, '0');

/* ---------- smooth scroll ---------- */
const startLenis = () => {
  if (reduce || !fine || !window.Lenis) return;
  const lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
  window.lenis = lenis;
  const loop = (t) => { lenis.raf(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
};
if (window.Lenis) startLenis(); else addEventListener('load', startLenis);

/* ---------- reveal ---------- */
const rio = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); } });
}, { rootMargin: '0px 0px -10% 0px' });
$$('[data-reveal], .lp-hero').forEach((el) => rio.observe(el));

/* ---------- countdown ---------- */
const target = new Date('2026-10-26T00:00:00+05:30').getTime();
const cds = $$('[data-cd]');
const tick = () => {
  const ms = Math.max(0, target - Date.now());
  const v = { d: pad(Math.floor(ms / 864e5)), h: pad(Math.floor(ms / 36e5) % 24), m: pad(Math.floor(ms / 6e4) % 60), s: pad(Math.floor(ms / 1e3) % 60) };
  cds.forEach((el) => { const x = v[el.dataset.cd]; if (el.textContent !== x) el.textContent = x; });
};
tick(); setInterval(tick, 1000);

/* ---------- nav: quiet once inside, ink on paper rooms ---------- */
const nav = $('#nav');
const lightRooms = $$('[data-tone="light"]');
const onScroll = () => {
  const y = scrollY;
  nav.classList.toggle('is-quiet', y > innerHeight * .5);
  const probe = 40;
  nav.classList.toggle('on-light', lightRooms.some((r) => { const b = r.getBoundingClientRect(); return b.top <= probe && b.bottom > probe; }));
};
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ---------- classified fields: hover (or scroll into view) to watch them refuse ---------- */
const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&/';
$$('.redact').forEach((r) => {
  const len = +r.dataset.len || 10;
  r.style.setProperty('--len', len);
  r.setAttribute('aria-label', 'Classified until 26 October 2026');
  r.setAttribute('role', 'img');
  let timer = 0;
  const scramble = () => {
    if (timer) return;
    r.classList.add('is-scrambling');
    let n = 0;
    timer = setInterval(() => {
      r.textContent = Array.from({ length: len }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join('');
      if (++n > 14) { clearInterval(timer); timer = 0; r.textContent = ''; r.classList.remove('is-scrambling'); }
    }, 55);
  };
  r.addEventListener('pointerenter', scramble);
  new IntersectionObserver((en, o) => { if (en[0].isIntersecting) { setTimeout(scramble, 300 + Math.random() * 900); o.disconnect(); } }, { rootMargin: '-20% 0px' }).observe(r);
});

/* ---------- 3D: the lineup and three interactive stages ---------- */
const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 60 }) : setTimeout(fn, 16));
const visible = new IntersectionObserver((en) => en.forEach((e) => { const st = e.target._stage; if (st) e.isIntersecting ? st.start() : st.stop(); }), { rootMargin: '10% 0px' });

if (!webgl || reduce) {
  $$('.lp-stage, .lp-hero').forEach((s) => s.classList.add('no-3d'));
} else {
  import('./launch3d.js').then(({ mountStage, mountLineup }) => {
    const hero = $('.lp-hero');
    const lineup = mountLineup($('.lp-hero__stage'), { mobile });
    hero._stage = lineup;
    const warmL = () => { if (!lineup.warm(30)) idle(warmL); else { hero.classList.add('has-3d'); visible.observe(hero); } };
    warmL();

    $$('.lp-product').forEach((sec) => {
      const stageEl = $('.lp-stage', sec);
      const key = sec.dataset.key;
      const st = mountStage($('.stage-host', stageEl), key, { mobile, interactive: stageEl, idle: true });
      st.setProgress(key === 'three' ? .7 : .78);
      stageEl._stage = st;
      const warm = () => { if (!st.warm(24)) idle(warm); else { stageEl.classList.add('has-3d'); visible.observe(stageEl); } };
      // stagger the settling so the page stays responsive
      setTimeout(warm, 400);

      // hold to peek: from the button, or by pressing on the stage itself
      const hold = (on) => { st.setPeek(on ? 1 : 0); $('.lp-peek', sec).classList.toggle('is-held', on); };
      const btn = $('.lp-peek', sec);
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); hold(true); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => btn.addEventListener(t, () => hold(false)));
      btn.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); hold(true); } });
      btn.addEventListener('keyup', () => hold(false));
      let pressT = 0;
      stageEl.addEventListener('pointerdown', () => { pressT = setTimeout(() => hold(true), 380); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => stageEl.addEventListener(t, () => { clearTimeout(pressT); hold(false); }));
    });
    addEventListener('resize', () => { lineup.resize(); $$('.lp-stage').forEach((s) => s._stage && s._stage.resize()); });
  }).catch((err) => { console.warn('3D unavailable', err); $$('.lp-stage, .lp-hero').forEach((s) => s.classList.add('no-3d')); });
}

/* ---------- the rocket cursor ---------- */
if (fine && !reduce) {
  doc.classList.add('has-cursor');
  const cur = $('.cursor'), rocket = $('.cursor__rocket', cur), label = $('.cursor__label', cur);
  let mx = -100, my = -100, pmx = mx, pmy = my, ang = -28, speed = 0, boost = 0;
  addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    const t = e.target.closest ? e.target : null;
    const onStage = t && t.closest('.lp-stage');
    const txt = onStage ? 'Drag' : '';
    if (label.textContent !== txt) label.textContent = txt;
    cur.classList.toggle('has-label', !!txt);
    cur.classList.toggle('is-link', !!(t && t.closest('a, button')));
    cur.classList.toggle('on-light', !!(t && t.closest('[data-tone="light"]')) && !onStage);
  }, { passive: true });
  addEventListener('pointerdown', () => { cur.classList.add('is-down'); boost = 1; });
  addEventListener('pointerup', () => cur.classList.remove('is-down'));
  const steer = () => {
    const vx = mx - pmx, vy = my - pmy; pmx = mx; pmy = my;
    speed += (Math.hypot(vx, vy) - speed) * 0.2;
    const want = speed > 1.2 ? Math.atan2(vy, vx) * 180 / Math.PI + 90 : -28;
    ang += (((want - ang + 540) % 360) - 180) * (speed > 1.2 ? 0.2 : 0.06);
    boost *= 0.9;
    rocket.style.transform = `translate(${mx}px, ${my}px) rotate(${ang.toFixed(2)}deg)`;
    rocket.style.setProperty('--flame', Math.min(1.5, 0.25 + speed / 22 + boost).toFixed(3));
    label.style.left = `${mx}px`; label.style.top = `${my}px`;
    requestAnimationFrame(steer);
  };
  steer();

  $$('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (ev) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${(ev.clientX - r.left - r.width / 2) * 0.28}px`);
      el.style.setProperty('--my', `${(ev.clientY - r.top - r.height / 2) * 0.38}px`);
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); });
  });
}
