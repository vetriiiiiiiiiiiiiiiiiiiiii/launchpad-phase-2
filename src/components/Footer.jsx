import { Link, useLocation } from 'react-router-dom';
import { S, placeLine, registerHref, telHref } from '../lib/content.js';

export default function Footer() {
  const home = useLocation().pathname === '/';
  const A = ({ hash, children }) => (home ? <a href={hash}>{children}</a> : <Link to={`/${hash}`}>{children}</Link>);
  const reg = registerHref();
  return (
    <footer className="foot foot--full">
      <div className="foot__top">
        <div className="foot__brand">
          <p className="foot__word">Launchpad</p>
          <p className="foot__tag">{S.summitLabel}</p>
          <p className="foot__when">26 October 2026 · {placeLine()}</p>
        </div>
        <nav className="foot__col" aria-label="Footer">
          <p>The day</p>
          <A hash="#the-day">Programme</A>
          <A hash="#the-talks">Expert talks</A>
          <A hash="#the-workshop">Workshop</A>
          <A hash="#the-pitch">Pitching</A>
        </nav>
        <nav className="foot__col" aria-label="More">
          <p>Launchpad</p>
          <Link to="/launches">The launches</Link>
          <A hash="#invitation">Invitation</A>
          <A hash="#faq">Questions</A>
          {reg.startsWith('http') ? <a href={reg} target="_blank" rel="noopener">Register ↗</a> : <A hash="#be-in-the-room">Be in the room</A>}
        </nav>
        <div className="foot__col">
          <p>Contact</p>
          {S.contactEmail && <a href={`mailto:${S.contactEmail}`}>{S.contactEmail}</a>}
          {S.contacts.map((c, i) => (
            <div className="foot__person" key={i}>
              <b>{c.name}</b>
                {c.role && <span className="contact__role">{c.role}</span>}
              {c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}
              {c.phone && <a href={telHref(c.phone)}>{c.phone}</a>}
            </div>
          ))}
          {!S.contactEmail && !S.contacts.length && <span>Contact details coming soon</span>}
          {S.instagramUrl && <a href={S.instagramUrl} target="_blank" rel="noopener">Instagram ↗</a>}
          {S.linkedinUrl && <a href={S.linkedinUrl} target="_blank" rel="noopener">LinkedIn ↗</a>}
        </div>
      </div>
      <div className="foot__bottom">
        <span>© 2026 Launchpad · <Link to="/privacy">Privacy policy</Link></span>
        <span>One day · Three launches · Where ideas become real</span>
        {home ? <a href="#top">Back to the top ↑</a> : <Link to="/">Back to Launchpad ↑</Link>}
      </div>
    </footer>
  );
}
