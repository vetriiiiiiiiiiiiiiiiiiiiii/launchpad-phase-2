import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { hasWebGL, idle, isMobile, reduceMotion } from '../hooks/env.js';

/* A WebGL stage (or the three-object lineup). three.js loads only when the
   stage comes within a few screens, the cloth settles off the main thread's
   critical path, and rendering pauses whenever the stage is off-screen. */
const StageCanvas = forwardRef(function StageCanvas({ stageKey, lineup = false, interactiveRef, idleMotion = false, initialProgress = 0, onReady, className = '' }, ref) {
  const host = useRef(null);
  const api = useRef(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useImperativeHandle(ref, () => ({
    setProgress: (p) => api.current?.setProgress?.(p),
    setPeek: (v) => api.current?.setPeek?.(v),
    topY: () => (api.current?.topY ? api.current.topY() : null),
  }), []);

  useEffect(() => {
    if (!hasWebGL || reduceMotion) return undefined;
    let cancelled = false, vio = null, st = null;
    const el = host.current;
    const near = new IntersectionObserver(async (en) => {
      if (!en[0].isIntersecting) return;
      near.disconnect();
      const mod = await import('../lib/launch3d.js');
      if (cancelled) return;
      st = lineup
        ? mod.mountLineup(el, { mobile: isMobile() })
        : mod.mountStage(el, stageKey, { mobile: isMobile(), interactive: interactiveRef?.current || null, idle: idleMotion });
      api.current = st;
      st.setProgress?.(initialProgress);
      const warm = () => {
        if (cancelled) return;
        if (!st.warm(24)) { idle(warm); return; }
        onReadyRef.current?.();
        vio = new IntersectionObserver((e) => (e[0].isIntersecting ? st.start() : st.stop()), { rootMargin: '10% 0px' });
        vio.observe(el);
      };
      warm();
    }, { rootMargin: '250% 0px' });
    near.observe(el);
    const onResize = () => st?.resize();
    addEventListener('resize', onResize);
    return () => {
      cancelled = true; near.disconnect(); vio?.disconnect();
      removeEventListener('resize', onResize);
      st?.dispose?.(); api.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div className={`stage-host ${className}`} ref={host} aria-hidden="true" />;
});

export default StageCanvas;
