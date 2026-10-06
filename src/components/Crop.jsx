import { useRef } from 'react';
import { useScrollVars } from '../hooks/useScroll.js';
import { clamp } from '../lib/scroll.js';

/* A photograph whose frame opens as it rises into view (scroll-based cropping). */
export default function Crop({ children }) {
  const ref = useRef(null);
  useScrollVars(ref, ({ y, vh, top }) => {
    const cv = clamp((vh - (top - y)) / (vh * 0.9)).toFixed(3);
    if (ref.current.__cv !== cv) { ref.current.__cv = cv; ref.current.style.setProperty('--cv', cv); }
  }, { vars: false });
  return <div className="crop" ref={ref}>{children}</div>;
}
