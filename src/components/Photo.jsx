import { useEffect, useRef, useState } from 'react';
import { IMG, srcSet } from '../lib/images.js';

/* A photograph that loads when it's near, then "develops" into view. */
export default function Photo({ id, w = 1400, alt = '', sizes = '(max-width: 860px) 90vw, 40vw', className, eager = false, ...rest }) {
  const ref = useRef(null);
  const [near, setNear] = useState(eager);
  const [dev, setDev] = useState(false);
  useEffect(() => {
    if (near || !ref.current) return undefined;
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: '120% 0px 120% 0px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [near]);
  return (
    <img
      ref={ref}
      data-u={id}
      className={[className, dev && 'is-dev'].filter(Boolean).join(' ') || undefined}
      src={near ? IMG(id, w) : undefined}
      srcSet={near ? srcSet(id, w) : undefined}
      sizes={sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setDev(true)}
      {...rest}
    />
  );
}
