import { useEffect, useRef } from 'react';
import { useScrollSubscribe } from '../hooks/useScroll.js';
import { clamp } from '../lib/scroll.js';

/* The fuse: a thread that burns down the page through the three launches. */
export default function Fuse() {
  const ref = useRef(null);
  const m = useRef({ start: 0, end: 1, nodes: [] });
  const measure = () => {
    const abs = (el) => el.getBoundingClientRect().top + scrollY;
    const launches = document.getElementById('the-launches');
    const fin = document.getElementById('launch-3');
    if (!launches || !fin || !ref.current) return;
    const vh = innerHeight;
    m.current.start = abs(launches) - vh * 0.5;
    m.current.end = abs(fin) + fin.offsetHeight - vh * 0.6;
    m.current.nodes = [...ref.current.querySelectorAll('.fuse__node')].map((n) => {
      const t = document.getElementById(n.dataset.node);
      const y = abs(t) + t.offsetHeight * 0.3;
      n.style.setProperty('--at', clamp((y - m.current.start) / (m.current.end - m.current.start)).toFixed(4));
      return { n, y };
    });
  };
  useEffect(() => {
    const t = setTimeout(measure, 300);
    addEventListener('resize', measure); addEventListener('load', measure);
    const ro = new ResizeObserver(() => measure()); ro.observe(document.body);
    return () => { clearTimeout(t); removeEventListener('resize', measure); removeEventListener('load', measure); ro.disconnect(); };
  }, []);
  useScrollSubscribe((y, vh) => {
    const el = ref.current; if (!el) return;
    const { start, end, nodes } = m.current;
    el.style.setProperty('--fp', clamp((y - start) / (end - start)).toFixed(4));
    el.classList.toggle('is-on', y > start - vh * 0.2 && y < end + vh * 0.3);
    nodes.forEach(({ n, y: ny }) => n.classList.toggle('is-lit', y + vh * 0.5 > ny));
    el.classList.toggle('on-light', [...document.querySelectorAll('[data-tone="light"]')].some((s) => {
      const b = s.getBoundingClientRect(); return b.top <= vh * 0.5 && b.bottom > vh * 0.5;
    }));
  });
  return (
    <div className="fuse" ref={ref} aria-hidden="true">
      <div className="fuse__line"><div className="fuse__burn" /></div>
      <span className="fuse__node" data-node="launch-1"><b>01</b></span>
      <span className="fuse__node" data-node="launch-2"><b>02</b></span>
      <span className="fuse__node" data-node="launch-3"><b>03</b></span>
    </div>
  );
}
