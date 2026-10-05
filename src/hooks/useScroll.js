import { useEffect, useRef } from 'react';
import { register, subscribe } from '../lib/scroll.js';

/* Attach the scroll engine to an element. `onFrame` always sees the latest closure. */
export function useScrollVars(ref, onFrame, opts) {
  const cb = useRef(onFrame);
  cb.current = onFrame;
  useEffect(() => {
    if (!ref.current) return undefined;
    return register(ref.current, (v) => cb.current && cb.current(v), opts);
  }, [ref]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useScrollSubscribe(fn) {
  const cb = useRef(fn);
  cb.current = fn;
  useEffect(() => subscribe((y, vh) => cb.current(y, vh)), []);
}
