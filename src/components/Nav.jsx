import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useScrollSubscribe } from '../hooks/useScroll.js';

/* Minimal floating navigation. It goes quiet once you're inside, and inks
   itself dark over paper-coloured rooms. */
export default function Nav() {
  const { pathname } = useLocation();
  const home = pathname === '/';
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  // on the home page, sections are anchors; elsewhere they lead back home
  const A = ({ hash, children, ...rest }) => (home
    ? <a href={hash} {...rest}>{children}</a>
    : <Link to={`/${hash}`} {...rest}>{children}</Link>);

  useScrollSubscribe((y, vh) => {
    const el = ref.current;
    if (!el) return;
    el.classList.toggle('is-quiet', y > vh * 0.6);
    const light = [...document.querySelectorAll('[data-tone="light"]')].some((s) => {
      const b = s.getBoundingClientRect(); return b.top <= 40 && b.bottom > 40;
    });
    el.classList.toggle('on-light', light);
  });

  useEffect(() => { document.body.classList.toggle('menu-open', open); }, [open]);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header className="nav" id="nav" ref={ref}>
        {home
          ? <a className="nav__mark" href="#top" aria-label="Launchpad — back to the beginning"><span className="wordmark">Launchpad</span></a>
          : <Link className="nav__mark" to="/" aria-label="Launchpad — home"><span className="wordmark">Launchpad</span></Link>}
        <nav className="nav__links" aria-label="Primary">
          <A hash="#the-day">The Day</A>
          <Link to="/launches" aria-current={pathname === '/launches' ? 'page' : undefined}>The Launches</Link>
          <A hash="#the-experience">The Experience</A>
          <A hash="#about">About</A>
        </nav>
        <A hash="#be-in-the-room" className="nav__cta magnetic"><span>Be in the room</span><i aria-hidden="true">→</i></A>
        <button className="nav__menu" aria-expanded={open} aria-controls="sheet" onClick={() => setOpen((o) => !o)}>
          <span>{open ? 'Close' : 'Menu'}</span>
        </button>
      </header>

      <div className="sheet" id="sheet" aria-hidden={!open}>
        <nav aria-label="Mobile" onClick={() => setOpen(false)}>
          <A hash="#the-day"><em>i.</em> The Day</A>
          <Link to="/launches"><em>ii.</em> The Launches</Link>
          <A hash="#the-experience"><em>iii.</em> The Experience</A>
          <A hash="#about"><em>iv.</em> About</A>
        </nav>
        <div className="sheet__foot">
          <span>26 October 2026</span>
          <A hash="#be-in-the-room" onClick={() => setOpen(false)}>Be in the room →</A>
        </div>
      </div>
    </>
  );
}
