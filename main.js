/* LAUNCHPAD — 26 October 2026
   One rAF loop writes scroll progress into CSS custom properties; CSS does
   the rest on the compositor. Lenis smooths the wheel. The three launch
   stages (WebGL cloth) load only when you get close to them. */
(() => {
  const doc = document.documentElement;
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const mobile = () => innerWidth <= 860;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- photographs: responsive sources + develop on load ---------- */
  const IMG = (id, w, q = 70) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;
  const develop = (img) => {
    if (img.dataset.ready) return;
    img.dataset.ready = 1;
    const id = img.dataset.u, max = +img.dataset.w || 1400;
    const widths = [480, 800, 1200, 1600, 2200].filter((w) => w <= max * 1.3);
    let sizes = '(max-width: 860px) 90vw, 40vw';
    if (img.closest('.ph--a, .statement__plate, .talk__plate, .work--wide, .meet__ph--1, .print--1, .talks-more__a')) sizes = '(max-width: 860px) 100vw, 50vw';
    if (img.closest('.l2__room, .day__frame, .talks__slit, .pitch__bg')) sizes = '100vw';
    img.sizes = sizes;
    img.srcset = widths.map((w) => `${IMG(id, w)} ${w}w`).join(', ');
    img.src = IMG(id, max);
    const done = () => img.classList.add('is-dev');
    if (img.complete && img.naturalWidth) done(); else img.addEventListener('load', done, { once: true });
  };
  const pio = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { develop(e.target); pio.unobserve(e.target); } });
  }, { rootMargin: '120% 0px 120% 0px' });
  $$('img[data-u]').forEach((p) => pio.observe(p));
  new IntersectionObserver((en, o) => {
    if (en[0].isIntersecting) { $$('.day__frame img').forEach(develop); o.disconnect(); }
  }, { rootMargin: '100% 0px' }).observe($('.day'));

  /* ---------- split the statement into letters ---------- */
  $$('[data-weight]').forEach((el) => {
    el.innerHTML = [...el.textContent].map((c) => (c === ' ' ? ' ' : `<span class="ch">${c}</span>`)).join('');
  });
  const letters = $$('.statement .ch');

  /* ---------- reveal on view ---------- */
  const rio = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' });
  $$('[data-reveal]').forEach((el) => rio.observe(el));

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce && fine && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
    window.lenis = lenis;
    const loop = (t) => { lenis.raf(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id.length > 1 && $(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ---------- hero: entering a physical room ---------- */
  const hero = $('.hero');
  const timers = [];
  const ssGet = (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } };
  const ssSet = (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } };
  const finishHero = () => {
    timers.forEach(clearTimeout);
    hero.classList.add('is-logo', 'is-develop', 'is-open', 'is-copy');
    body.classList.remove('is-loading');
    if (lenis) lenis.start();
    ssSet('lp-seen', 1);
  };
  if (reduce || ssGet('lp-seen')) {
    finishHero();
  } else {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    scrollTo(0, 0);
    if (lenis) lenis.stop();
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    at(350, () => hero.classList.add('is-logo'));
    at(2300, () => hero.classList.add('is-develop'));
    at(3900, () => hero.classList.add('is-open'));
    at(5200, finishHero);
  }
  $('.hero__skip').addEventListener('click', finishHero);
  const impatient = () => { if (body.classList.contains('is-loading') && hero.classList.contains('is-develop')) finishHero(); };
  ['wheel', 'touchstart', 'keydown'].forEach((t) => addEventListener(t, impatient, { passive: true }));

  /* ---------- countdown to the day ---------- */
  const target = new Date('2026-10-26T00:00:00+05:30').getTime();
  const cds = $$('[data-cd]');
  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    const ms = Math.max(0, target - Date.now());
    const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
    const val = { d: pad(d), h: pad(h), m: pad(m), s: pad(s) };
    cds.forEach((el) => { const v = val[el.dataset.cd]; if (el.textContent !== v) el.textContent = v; });
    if (ms === 0) $$('.tminus').forEach((t) => { t.textContent = Date.now() - target < 864e5 ? 'Today' : 'One day. Three launches.'; });
  };
  tick(); setInterval(tick, 1000);

  /* ---------- 3D stages (lazy) ---------- */
  const launches = $$('.launch');
  const stages = new Map();
  const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
  const canStage = !reduce && webgl && !launches.some((l) => $('[data-product-src]', l));
  let stageLoading = null;
  const loadStages = () => {
    if (stageLoading || !canStage) return;
    stageLoading = import('./launch3d.js').then(({ mountStage }) => {
      const keys = { 'launch-1': 'one', 'launch-2': 'two', 'launch-3': 'three' };
      launches.forEach((sec) => {
        try {
          const st = mountStage($('.stage-host', sec), keys[sec.id], { mobile: mobile() });
          stages.set(sec, st);
          // settle the cloth in small slices so the main thread stays free
          const warm = () => { if (!st.warm(24)) requestIdleCallbackish(warm); else { sec.classList.add('has-3d'); lastY = -1; onScroll(); } };
          warm();
        } catch (err) { console.warn('Stage unavailable', err); }
      });
      sio.disconnect();
      launches.forEach((l) => vio.observe(l));
    }).catch((err) => console.warn('3D stages unavailable', err));
  };
  const requestIdleCallbackish = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 60 }) : setTimeout(fn, 16));
  const sio = new IntersectionObserver((en) => { if (en.some((e) => e.isIntersecting)) loadStages(); }, { rootMargin: '250% 0px' });
  launches.forEach((l) => sio.observe(l));
  const vio = new IntersectionObserver((en) => {
    en.forEach((e) => { const st = stages.get(e.target); if (!st) return; e.isIntersecting ? st.start() : st.stop(); });
  }, { rootMargin: '10% 0px' });

  /* ---------- scroll engine ---------- */
  const sections = $$('[data-scroll]');
  const nav = $('#nav');
  const fuse = $('.fuse');
  const fuseNodes = $$('.fuse__node');
  const expo = $('[data-hscroll]');
  const expoTrack = $('.expo__track', expo);
  const lightZones = $$('.statement, .launch--two, .expo, .marks, .shop');
  const introThread = $('.thread--intro');
  const pitch = $('.pitch');
  const cards = $$('.card', pitch);
  const pitchCount = $('.pitch__count');
  const statement = $('.statement');
  const crops = $$('.crop');
  let vh = innerHeight, fuseStart = 0, fuseEnd = 1, expoSpan = 0;
  const abs = (el) => el.getBoundingClientRect().top + scrollY;

  const measure = () => {
    vh = innerHeight;
    if (!mobile() && !reduce) {
      expoSpan = Math.max(0, expoTrack.scrollWidth - innerWidth);
      expo.style.height = `${expoSpan + vh}px`;
    } else { expoSpan = 0; expo.style.height = ''; }
    sections.forEach((s) => { s._top = abs(s); s._h = s.offsetHeight; });
    lightZones.forEach((s) => { s._top = abs(s); s._h = s.offsetHeight; });
    const fin = $('#be-in-the-room');
    fuseStart = abs($('#the-launches')) - vh * 0.5;
    fuseEnd = abs(fin) + fin.offsetHeight - vh;
    fuseNodes.forEach((n) => {
      const t = $('#' + n.dataset.node);
      n._y = abs(t) + t.offsetHeight * 0.3;
      n.style.setProperty('--at', clamp((n._y - fuseStart) / (fuseEnd - fuseStart)).toFixed(4));
    });
    introThread._top = abs(introThread);
    statement._top = abs(statement); statement._h = statement.offsetHeight;
    stages.forEach((st) => st.resize());
  };

  let lastY = -1, ticking = false;
  const frame = () => {
    ticking = false;
    const y = scrollY;
    if (y === lastY) return;
    lastY = y;

    sections.forEach((s) => {
      const top = s._top, h = s._h;
      if (y + vh < top - vh || y > top + h + vh) return;
      const p = clamp((y - top) / Math.max(h - vh, 1));
      s._p = p;
      s.style.setProperty('--p', p.toFixed(4));
      s.style.setProperty('--e', clamp((y + vh - top) / vh).toFixed(4));
      s.style.setProperty('--x', clamp((y - top) / vh).toFixed(4));
      s.style.setProperty('--v', clamp((y + vh - top) / (h + vh)).toFixed(4));
      const st = stages.get(s);
      if (st) {
        st.setProgress(p);
        if (s.classList.contains('has-3d')) s.style.setProperty('--drop3d', `${Math.max(0, st.topY() - 3).toFixed(1)}px`);
      }
    });

    crops.forEach((c) => {
      const r = c.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      c.style.setProperty('--cv', clamp((vh - r.top) / (vh * 0.9)).toFixed(3));
    });

    introThread.style.setProperty('--tp', clamp((y + vh * 0.85 - introThread._top) / (vh * 0.5)).toFixed(3));

    if (expoSpan) {
      const p = clamp((y - expo._top) / Math.max(expo._h - vh, 1));
      expoTrack.style.setProperty('--hx', (p * expoSpan).toFixed(1));
    }

    // the pitch deck: one card leaves at a time
    if (pitch._p !== undefined) {
      const n = cards.length;
      const s = clamp((pitch._p - 0.1) / 0.8) * (n - 1);
      cards.forEach((c, i) => {
        const t = i === n - 1 ? 0 : clamp(s - i);
        const d = Math.max(0, i - s);
        c.style.setProperty('--t', t.toFixed(3));
        c.style.setProperty('--d', Math.min(d, 4).toFixed(3));
        c.style.zIndex = n - i;
      });
      pitchCount.textContent = pad(Math.min(n, Math.floor(s + 0.5) + 1));
    }

    // touch screens: the statement's letters breathe with scroll instead of the cursor
    if (!fine && letters.length) {
      const v = clamp((y + vh - statement._top) / (vh * 1.4));
      letters.forEach((l, i) => {
        const f = i / letters.length;
        l.style.setProperty('--w', Math.round(400 + 480 * Math.max(0, 1 - Math.abs(f - (v * 1.5 - 0.25)) * 3.2)));
      });
    }

    const fp = clamp((y - fuseStart) / (fuseEnd - fuseStart));
    fuse.style.setProperty('--fp', fp.toFixed(4));
    fuse.classList.toggle('is-on', y > fuseStart - vh * 0.2 && y < fuseEnd + vh * 0.3);
    fuseNodes.forEach((n) => n.classList.toggle('is-lit', y + vh * 0.5 > n._y));

    nav.classList.toggle('is-quiet', y > vh * 0.6);
    const inZone = (py) => lightZones.some((z) => py >= z._top && py < z._top + z._h);
    nav.classList.toggle('on-light', inZone(y + 40));
    fuse.classList.toggle('on-light', inZone(y + vh * 0.5));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true });
  let rT;
  const remeasure = () => { measure(); lastY = -1; frame(); };
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(remeasure, 120); });
  addEventListener('load', remeasure);
  if (document.fonts) document.fonts.ready.then(remeasure);
  measure(); frame();

  /* ---------- folio: the running head follows the chapter ---------- */
  const folioNow = $('.folio__now');
  const fio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const next = e.target.dataset.folio;
      if (folioNow.textContent === next) return;
      folioNow.classList.add('is-swap');
      setTimeout(() => { folioNow.textContent = next; folioNow.classList.remove('is-swap'); }, 300);
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  $$('[data-folio]').forEach((s) => fio.observe(s));

  /* ---------- The Day: sticky frame follows the moment in view ---------- */
  const frames = $$('.day__frame > *');
  const now = $('.day__now');
  const acts = $$('.acts li');
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  const actNames = acts.map((a) => a.textContent.trim());
  const moments = $$('.moment');
  const dio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting || mobile()) return;
      const i = +e.target.dataset.i;
      moments.forEach((m) => m.classList.toggle('is-active', m === e.target));
      frames.forEach((f, k) => f.classList.toggle('is-active', k === i));
      now.textContent = numerals[i];
      acts.forEach((a, k) => a.classList.toggle('is-now', actNames[k] === e.target.dataset.act));
    });
  }, { rootMargin: '-48% 0px -48% 0px' });
  moments.forEach((m) => dio.observe(m));

  /* ---------- mobile menu ---------- */
  const menuBtn = $('.nav__menu');
  const sheet = $('#sheet');
  const setMenu = (open) => {
    body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    sheet.setAttribute('aria-hidden', !open);
    menuBtn.firstElementChild.textContent = open ? 'Close' : 'Menu';
  };
  menuBtn.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  $$('a', sheet).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ---------- pointer craft (fine pointers only) ---------- */
  if (!fine || reduce) return;

  // cursor: the Launchpad rocket steers in the direction you move
  doc.classList.add('has-cursor');
  const cur = $('.cursor'), rocket = $('.cursor__rocket', cur), label = $('.cursor__label', cur);
  const lightSel = '.statement, .launch--two, .expo, .marks, .shop';
  let mx = -100, my = -100, pmx = mx, pmy = my, ang = -28, speed = 0, boost = 0;
  addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    const t = e.target.closest ? e.target : null;
    const lab = t && t.closest('[data-cursor]');
    const link = t && t.closest('a, button');
    const txt = lab ? lab.dataset.cursor : '';
    if (label.textContent !== txt) label.textContent = txt;
    cur.classList.toggle('has-label', !!txt);
    cur.classList.toggle('is-link', !!link);
    cur.classList.toggle('on-light', !!(t && t.closest(lightSel)) && !body.classList.contains('menu-open'));
  }, { passive: true });
  addEventListener('pointerdown', () => { cur.classList.add('is-down'); boost = 1; });
  addEventListener('pointerup', () => cur.classList.remove('is-down'));
  const steer = () => {
    const vx = mx - pmx, vy = my - pmy;
    pmx = mx; pmy = my;
    const v = Math.hypot(vx, vy);
    speed += (v - speed) * 0.2;
    // point along the motion; at rest, settle into a classic pointer tilt
    const want = speed > 1.2 ? Math.atan2(vy, vx) * 180 / Math.PI + 90 : -28;
    let d = ((want - ang + 540) % 360) - 180;
    ang += d * (speed > 1.2 ? 0.2 : 0.06);
    boost *= 0.9;
    rocket.style.transform = `translate(${mx}px, ${my}px) rotate(${ang.toFixed(2)}deg)`;
    rocket.style.setProperty('--flame', Math.min(1.5, 0.25 + speed / 22 + boost).toFixed(3));
    label.style.left = `${mx}px`; label.style.top = `${my}px`;
    requestAnimationFrame(steer);
  };
  steer();
  doc.addEventListener('pointerleave', () => { cur.style.opacity = 0; });
  doc.addEventListener('pointerenter', () => { cur.style.opacity = 1; });

  // magnetic buttons
  $$('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (ev) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${(ev.clientX - r.left - r.width / 2) * 0.28}px`);
      el.style.setProperty('--my', `${(ev.clientY - r.top - r.height / 2) * 0.38}px`);
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); });
  });

  // cursor-sensitive photography
  $$('[data-tiltzone]').forEach((zone) => {
    $$('[data-tilt]', zone).forEach((f) => f.style.setProperty('--t', f.dataset.tilt));
    zone.addEventListener('pointermove', (ev) => {
      zone.style.setProperty('--mx', ((ev.clientX / innerWidth) * 2 - 1).toFixed(3));
      zone.style.setProperty('--my', ((ev.clientY / innerHeight) * 2 - 1).toFixed(3));
    });
  });

  // the statement: letters thicken as the cursor passes
  const big = $('.statement__big');
  big.addEventListener('pointermove', (e) => {
    letters.forEach((l) => {
      const r = l.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      l.style.setProperty('--w', Math.round(400 + 500 * Math.max(0, 1 - d / 260)));
    });
  });
  big.addEventListener('pointerleave', () => letters.forEach((l) => l.style.setProperty('--w', 400)));

  // an image follows the cursor over lists
  const peek = $('.peek');
  body.appendChild(peek);
  const peekImg = $('img', peek);
  let px = 0, py = 0, tx = 0, ty = 0, praf = 0;
  const glide = () => {
    px += (tx - px) * 0.16; py += (ty - py) * 0.16;
    peek.style.left = `${px}px`; peek.style.top = `${py}px`;
    praf = Math.abs(tx - px) + Math.abs(ty - py) > 0.5 ? requestAnimationFrame(glide) : 0;
  };
  $$('.inventory li, .index a').forEach((li) => {
    li.addEventListener('pointerenter', (ev) => {
      peekImg.src = IMG(li.dataset.img, 480);
      if (!peek.classList.contains('is-on')) { px = tx = ev.clientX + 150; py = ty = ev.clientY; }
      peek.classList.add('is-on');
    });
    li.addEventListener('pointermove', (ev) => { tx = ev.clientX + 150; ty = ev.clientY; if (!praf) praf = requestAnimationFrame(glide); });
    li.addEventListener('pointerleave', () => peek.classList.remove('is-on'));
  });

  // the workshop: graphite on graph paper
  const shop = $('.shop');
  const cv = $('.shop__pencil', shop);
  const ctx = cv.getContext('2d');
  const sizeCanvas = () => { cv.width = shop.clientWidth; cv.height = shop.clientHeight; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; };
  sizeCanvas();
  addEventListener('resize', sizeCanvas);
  let lx = null, ly = null, lastDraw = 0, fading = false;
  const fade = () => {
    const idle = performance.now() - lastDraw;
    if (idle > 900) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(251,248,242,0.03)'; // only alpha matters when erasing
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (idle < 9000) requestAnimationFrame(fade); else fading = false;
  };
  shop.addEventListener('pointermove', (e) => {
    const r = shop.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (lx !== null) {
      const speed = Math.hypot(x - lx, y - ly);
      ctx.strokeStyle = 'rgba(11,74,58,0.6)';
      ctx.lineWidth = Math.max(0.6, 1.8 - speed * 0.02);
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(x, y); ctx.stroke();
      // graphite grain: a second, broken stroke
      ctx.strokeStyle = 'rgba(47,93,154,0.22)';
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(lx + (Math.random() - 0.5) * 1.6, ly + (Math.random() - 0.5) * 1.6); ctx.lineTo(x + (Math.random() - 0.5) * 1.6, y + (Math.random() - 0.5) * 1.6); ctx.stroke();
    }
    lx = x; ly = y; lastDraw = performance.now();
    if (!fading) { fading = true; requestAnimationFrame(fade); }
  });
  shop.addEventListener('pointerleave', () => { lx = ly = null; });
})();
