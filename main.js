/* LAUNCHPAD — 26 October 2026
   No libraries. One rAF loop writes scroll progress into CSS custom
   properties; CSS does the rest on the compositor. */
(() => {
  const doc = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => innerWidth <= 860;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- photographs: responsive sources + develop on load ---------- */
  const IMG = (id, w, q = 70) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;
  const photos = [...document.querySelectorAll('img[data-u]')];
  const develop = (img) => {
    if (img.dataset.ready) return;
    img.dataset.ready = 1;
    const id = img.dataset.u, max = +img.dataset.w || 1400;
    const widths = [480, 800, 1200, 1600, 2200].filter((w) => w <= max * 1.3);
    img.sizes = img.closest('.ph--a, .statement__plate, .talk__plate, .work--wide, .meet__ph--1') ? '(max-width: 860px) 100vw, 50vw' : '(max-width: 860px) 90vw, 40vw';
    if (img.closest('.l2__room, .day__frame')) img.sizes = '(max-width: 860px) 100vw, 60vw';
    img.srcset = widths.map((w) => `${IMG(id, w)} ${w}w`).join(', ');
    img.src = IMG(id, max);
    const done = () => img.classList.add('is-dev');
    if (img.complete && img.naturalWidth) done(); else img.addEventListener('load', done, { once: true });
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { develop(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '120% 0px 120% 0px' });
    photos.forEach((p) => io.observe(p));
  } else photos.forEach(develop);
  // Day frame images live in a sticky stack; load them together
  new IntersectionObserver((en, o) => {
    if (en[0].isIntersecting) { document.querySelectorAll('.day__frame img').forEach(develop); o.disconnect(); }
  }, { rootMargin: '100% 0px' }).observe(document.querySelector('.day'));

  /* ---------- reveal on view ---------- */
  const rio = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => rio.observe(el));

  /* ---------- hero: entering a physical room ---------- */
  const hero = document.querySelector('.hero');
  const body = document.body;
  const timers = [];
  const finishHero = () => {
    timers.forEach(clearTimeout);
    hero.classList.add('is-logo', 'is-develop', 'is-open', 'is-copy');
    body.classList.remove('is-loading');
  };
  if (reduce || sessionStorageGet('lp-seen')) {
    finishHero();
  } else {
    // the opening always begins in the dark, at the top
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    scrollTo(0, 0);
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    at(350, () => hero.classList.add('is-logo'));          // the mark, quietly
    at(2300, () => hero.classList.add('is-develop'));      // the curtain develops out of black
    at(3900, () => hero.classList.add('is-open'));         // the curtain parts, light enters
    at(5200, () => { hero.classList.add('is-copy'); body.classList.remove('is-loading'); sessionStorageSet('lp-seen', 1); });
  }
  hero.querySelector('.hero__skip').addEventListener('click', finishHero);
  const impatient = () => { if (body.classList.contains('is-loading') && hero.classList.contains('is-develop')) finishHero(); };
  ['wheel', 'touchstart', 'keydown'].forEach((t) => addEventListener(t, impatient, { passive: true }));

  function sessionStorageGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sessionStorageSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  /* ---------- scroll engine ---------- */
  const sections = [...document.querySelectorAll('[data-scroll]')];
  const nav = document.getElementById('nav');
  const fuse = document.querySelector('.fuse');
  const fuseNodes = [...document.querySelectorAll('.fuse__node')];
  const expo = document.querySelector('[data-hscroll]');
  const expoTrack = expo.querySelector('.expo__track');
  const lightZones = [...document.querySelectorAll('.statement, .launch--two, .expo, .marks')];
  const introThread = document.querySelector('.thread--intro');
  let vh = innerHeight, docH = 1, fuseStart = 0, fuseEnd = 1, expoSpan = 0;

  const measure = () => {
    vh = innerHeight;
    if (!mobile() && !reduce) {
      expoSpan = Math.max(0, expoTrack.scrollWidth - innerWidth);
      expo.style.height = `${expoSpan + vh}px`;
    } else {
      expoSpan = 0;
      expo.style.height = '';
    }
    sections.forEach((s) => { s._top = s.getBoundingClientRect().top + scrollY; s._h = s.offsetHeight; });
    lightZones.forEach((s) => { s._top = s.getBoundingClientRect().top + scrollY; s._h = s.offsetHeight; });
    docH = doc.scrollHeight;
    const l1 = document.getElementById('launch-1');
    const fin = document.getElementById('be-in-the-room');
    fuseStart = document.getElementById('the-launches').getBoundingClientRect().top + scrollY - vh * .5;
    fuseEnd = fin.getBoundingClientRect().top + scrollY + fin.offsetHeight - vh;
    fuseNodes.forEach((n) => {
      const t = document.getElementById(n.dataset.node);
      n._y = t.getBoundingClientRect().top + scrollY + t.offsetHeight * .3;
      n.style.setProperty('--at', clamp((n._y - fuseStart) / (fuseEnd - fuseStart)).toFixed(4));
    });
    introThread._top = introThread.getBoundingClientRect().top + scrollY;
    void l1;
  };

  let lastY = -1, ticking = false;
  const frame = () => {
    ticking = false;
    const y = scrollY;
    if (y === lastY) return;
    lastY = y;

    sections.forEach((s) => {
      const top = s._top, h = s._h;
      if (y + vh < top - vh || y > top + h + vh) return; // far away: skip
      const p = clamp((y - top) / Math.max(h - vh, 1));
      const e = clamp((y + vh - top) / vh);
      const x = clamp((y - top) / vh);
      const v = clamp((y + vh - top) / (h + vh));
      s.style.setProperty('--p', p.toFixed(4));
      s.style.setProperty('--e', e.toFixed(4));
      s.style.setProperty('--x', x.toFixed(4));
      s.style.setProperty('--v', v.toFixed(4));
    });

    // scroll-based cropping on featured plates
    document.querySelectorAll('.crop').forEach((c) => {
      const r = c.getBoundingClientRect();
      const cv = clamp((vh - r.top) / (vh * .9));
      c.style.setProperty('--cv', cv.toFixed(3));
    });

    // intro thread draws as you approach launch one
    const tp = clamp((y + vh * .85 - introThread._top) / (vh * .5));
    introThread.style.setProperty('--tp', tp.toFixed(3));

    // horizontal exhibition
    if (expoSpan) {
      const p = clamp((y - expo._top) / Math.max(expo._h - vh, 1));
      expoTrack.style.setProperty('--hx', (p * expoSpan).toFixed(1));
    }

    // fuse
    const fp = clamp((y - fuseStart) / (fuseEnd - fuseStart));
    fuse.style.setProperty('--fp', fp.toFixed(4));
    fuse.classList.toggle('is-on', y > fuseStart - vh * .2 && y < fuseEnd + vh * .3);
    fuseNodes.forEach((n) => n.classList.toggle('is-lit', y + vh * .5 > n._y));

    // nav: quiet once inside; inverts over light rooms
    nav.classList.toggle('is-quiet', y > vh * .6);
    const probe = y + 40;
    const onLight = lightZones.some((z) => probe >= z._top && probe < z._top + z._h);
    nav.classList.toggle('on-light', onLight);
    const fprobe = y + vh * .5;
    fuse.classList.toggle('on-light', lightZones.some((z) => fprobe >= z._top && fprobe < z._top + z._h));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };

  addEventListener('scroll', onScroll, { passive: true });
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { measure(); lastY = -1; frame(); }, 120); });
  addEventListener('load', () => { measure(); lastY = -1; frame(); });
  if (document.fonts) document.fonts.ready.then(() => { measure(); lastY = -1; frame(); });
  measure(); frame();

  /* ---------- The Day: sticky frame follows the moment in view ---------- */
  const frames = [...document.querySelectorAll('.day__frame > *')];
  const now = document.querySelector('.day__now');
  const acts = [...document.querySelectorAll('.acts li')];
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
  const actNames = acts.map((a) => a.textContent.trim());
  const moments = [...document.querySelectorAll('.moment')];
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
  const menuBtn = document.querySelector('.nav__menu');
  const sheet = document.getElementById('sheet');
  const setMenu = (open) => {
    body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    sheet.setAttribute('aria-hidden', !open);
    menuBtn.firstElementChild.textContent = open ? 'Close' : 'Menu';
  };
  menuBtn.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  sheet.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ---------- pointer details (fine pointers only) ---------- */
  if (matchMedia('(pointer: fine)').matches && !reduce) {
    // magnetic buttons
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (ev) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${(ev.clientX - r.left - r.width / 2) * .28}px`);
        el.style.setProperty('--my', `${(ev.clientY - r.top - r.height / 2) * .38}px`);
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); });
    });

    // cursor-sensitive photography
    document.querySelectorAll('[data-tiltzone]').forEach((zone) => {
      zone.querySelectorAll('[data-tilt]').forEach((f) => f.style.setProperty('--t', f.dataset.tilt));
      zone.addEventListener('pointermove', (ev) => {
        zone.style.setProperty('--mx', ((ev.clientX / innerWidth) * 2 - 1).toFixed(3));
        zone.style.setProperty('--my', ((ev.clientY / innerHeight) * 2 - 1).toFixed(3));
      });
    });

    // conversation inventory: an image follows the cursor
    const peek = document.querySelector('.peek');
    const peekImg = peek.querySelector('img');
    let px = 0, py = 0, tx = 0, ty = 0, raf = 0;
    const follow = () => {
      px += (tx - px) * .16; py += (ty - py) * .16;
      peek.style.left = `${px}px`; peek.style.top = `${py}px`;
      raf = Math.abs(tx - px) + Math.abs(ty - py) > .5 ? requestAnimationFrame(follow) : 0;
    };
    document.querySelectorAll('.inventory li').forEach((li) => {
      li.addEventListener('pointerenter', (ev) => {
        peekImg.src = IMG(li.dataset.img, 440);
        if (!peek.classList.contains('is-on')) { px = tx = ev.clientX + 140; py = ty = ev.clientY; }
        peek.classList.add('is-on');
      });
      li.addEventListener('pointermove', (ev) => { tx = ev.clientX + 140; ty = ev.clientY; if (!raf) raf = requestAnimationFrame(follow); });
      li.addEventListener('pointerleave', () => peek.classList.remove('is-on'));
    });
  }
})();
