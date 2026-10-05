import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { finePointer, reduceMotion } from '../hooks/env.js';

/* Buttons and links share one shape. Magnetic ones lean toward the cursor. */
export default function Btn({ to, href, variant = 'light', big, magnetic, icon = '→', children, className = '', ...rest }) {
  const ref = useRef(null);
  const cls = ['btn', `btn--${variant}`, big && 'btn--big', magnetic && 'magnetic', className].filter(Boolean).join(' ');
  const move = (e) => {
    if (!magnetic || !finePointer || reduceMotion) return;
    const el = ref.current, r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${(e.clientX - r.left - r.width / 2) * 0.28}px`);
    el.style.setProperty('--my', `${(e.clientY - r.top - r.height / 2) * 0.38}px`);
  };
  const leave = () => { ref.current?.style.setProperty('--mx', '0px'); ref.current?.style.setProperty('--my', '0px'); };
  const inner = <><span>{children}</span><i aria-hidden="true">{icon}</i></>;
  if (to) return <Link ref={ref} to={to} className={cls} onPointerMove={move} onPointerLeave={leave} {...rest}>{inner}</Link>;
  if (href) return <a ref={ref} href={href} className={cls} onPointerMove={move} onPointerLeave={leave} {...rest}>{inner}</a>;
  return <button ref={ref} type="button" className={cls} onPointerMove={move} onPointerLeave={leave} {...rest}>{inner}</button>;
}
