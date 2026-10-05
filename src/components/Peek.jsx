import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { IMG } from '../lib/images.js';
import { finePointer, reduceMotion } from '../hooks/env.js';

/* A small photograph that follows the cursor over lists. */
const PeekCtx = createContext(null);

export function PeekProvider({ children }) {
  const box = useRef(null), img = useRef(null);
  const s = useRef({ px: 0, py: 0, tx: 0, ty: 0, raf: 0, on: false });
  const glide = useCallback(() => {
    const st = s.current;
    st.px += (st.tx - st.px) * 0.16; st.py += (st.ty - st.py) * 0.16;
    box.current.style.left = `${st.px}px`; box.current.style.top = `${st.py}px`;
    st.raf = Math.abs(st.tx - st.px) + Math.abs(st.ty - st.py) > 0.5 ? requestAnimationFrame(glide) : 0;
  }, []);
  const api = useRef({
    show(id, e) {
      if (!finePointer || reduceMotion) return;
      const st = s.current;
      img.current.src = IMG(id, 480);
      if (!st.on) { st.px = st.tx = e.clientX + 150; st.py = st.ty = e.clientY; }
      st.on = true; box.current.classList.add('is-on');
    },
    move(e) { const st = s.current; st.tx = e.clientX + 150; st.ty = e.clientY; if (!st.raf) st.raf = requestAnimationFrame(glide); },
    hide() { s.current.on = false; box.current.classList.remove('is-on'); },
  });
  useEffect(() => () => cancelAnimationFrame(s.current.raf), []);
  return (
    <PeekCtx.Provider value={api.current}>
      {children}
      <div className="peek" ref={box} aria-hidden="true"><img ref={img} alt="" /></div>
    </PeekCtx.Provider>
  );
}

/* Spread onto any element: {...usePeekHandlers(photoId)} */
export function usePeekHandlers(id) {
  const peek = useContext(PeekCtx);
  return {
    onPointerEnter: (e) => peek.show(id, e),
    onPointerMove: (e) => peek.move(e),
    onPointerLeave: () => peek.hide(),
  };
}
