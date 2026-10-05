import { useEffect, useRef } from 'react';
import { finePointer, reduceMotion } from '../hooks/env.js';

/* The Launchpad rocket. It steers along the direction you move, its flame grows
   with speed, and at rest it settles into a classic pointer tilt. */
export default function Cursor() {
  const cur = useRef(null), rocket = useRef(null), label = useRef(null);
  useEffect(() => {
    if (!finePointer || reduceMotion) return undefined;
    document.documentElement.classList.add('has-cursor');
    let mx = -100, my = -100, pmx = mx, pmy = my, ang = -28, speed = 0, boost = 0, raf = 0;
    const c = cur.current;
    const move = (e) => {
      mx = e.clientX; my = e.clientY;
      const t = e.target instanceof Element ? e.target : null;
      const stage = t && t.closest('.lp-stage');
      const lab = t && t.closest('[data-cursor]');
      const txt = stage ? 'Drag' : lab ? lab.dataset.cursor : '';
      if (label.current.textContent !== txt) label.current.textContent = txt;
      c.classList.toggle('has-label', !!txt);
      c.classList.toggle('is-link', !!(t && t.closest('a, button')));
      c.classList.toggle('on-light', !!(t && t.closest('[data-tone="light"]')) && !stage && !document.body.classList.contains('menu-open'));
    };
    const down = () => { c.classList.add('is-down'); boost = 1; };
    const up = () => c.classList.remove('is-down');
    const out = () => { c.style.opacity = 0; };
    const over = () => { c.style.opacity = 1; };
    const steer = () => {
      const vx = mx - pmx, vy = my - pmy; pmx = mx; pmy = my;
      speed += (Math.hypot(vx, vy) - speed) * 0.2;
      const want = speed > 1.2 ? Math.atan2(vy, vx) * 180 / Math.PI + 90 : -28;
      ang += (((want - ang + 540) % 360) - 180) * (speed > 1.2 ? 0.2 : 0.06);
      boost *= 0.9;
      rocket.current.style.transform = `translate(${mx}px, ${my}px) rotate(${ang.toFixed(2)}deg)`;
      rocket.current.style.setProperty('--flame', Math.min(1.5, 0.25 + speed / 22 + boost).toFixed(3));
      label.current.style.left = `${mx}px`; label.current.style.top = `${my}px`;
      raf = requestAnimationFrame(steer);
    };
    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerdown', down);
    addEventListener('pointerup', up);
    document.documentElement.addEventListener('pointerleave', out);
    document.documentElement.addEventListener('pointerenter', over);
    steer();
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', move); removeEventListener('pointerdown', down); removeEventListener('pointerup', up);
      document.documentElement.removeEventListener('pointerleave', out);
      document.documentElement.removeEventListener('pointerenter', over);
      document.documentElement.classList.remove('has-cursor');
    };
  }, []);
  return (
    <div className="cursor" ref={cur} aria-hidden="true">
      <div className="cursor__rocket" ref={rocket}>
        <svg viewBox="0 0 40 66" width="24" height="40">
          <g className="r-flame">
            <path d="M14.5 50 Q20 70 25.5 50 Q20 55 14.5 50Z" fill="#7fe0b5" />
            <path d="M17.5 50 Q20 61 22.5 50Z" fill="#fafbf8" />
          </g>
          <path className="r-fin" d="M11.5 31 L4 43 L4 50 L11.5 45.5Z" />
          <path className="r-fin" d="M28.5 31 L36 43 L36 50 L28.5 45.5Z" />
          <path className="r-body" d="M20 2 C28.5 11.5 30.5 26 28.8 45 L11.2 45 C9.5 26 11.5 11.5 20 2Z" />
          <circle className="r-window" cx="20" cy="20" r="4" />
          <path className="r-line" d="M15.5 33 h9 M16.5 37.5 h7" />
        </svg>
      </div>
      <span className="cursor__label" ref={label} />
    </div>
  );
}
