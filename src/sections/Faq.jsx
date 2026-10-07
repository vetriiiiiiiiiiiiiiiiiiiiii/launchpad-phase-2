import { useState } from 'react';
import Rv from '../components/Rv.jsx';
import { S, telHref } from '../lib/content.js';

/* Questions people ask before they register. Editable in the admin panel. */
export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="faq" data-tone="light" id="faq" data-folio="Questions">
      <header className="faq__head">
        <p className="eyebrow" data-reveal>Good to know</p>
        <h2 className="faq__title" data-reveal><Rv>Questions,</Rv><Rv><em>answered.</em></Rv></h2>
        {S.contactEmail && (
          <p className="faq__contact" data-reveal>Something else? <a href={`mailto:${S.contactEmail}`}>{S.contactEmail}</a></p>
        )}
        {S.contacts.length > 0 && (
          <ul className="faq__people" data-reveal aria-label="Contacts">
            {!S.contactEmail && <li className="faq__people-cap">Something else? Ask us.</li>}
            {S.contacts.map((c, i) => (
              <li key={i}>
                <b>{c.name}</b>
                {c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}
                {c.phone && <a href={telHref(c.phone)}>{c.phone}</a>}
              </li>
            ))}
          </ul>
        )}
      </header>
      <ul className="faq__list">
        {S.faq.map((f, i) => {
          const isOpen = open === i;
          return (
            <li key={i} className={isOpen ? 'is-open' : undefined} data-reveal>
              <h3>
                <button type="button" aria-expanded={isOpen} aria-controls={`faq-${i}`} id={`faq-q-${i}`}
                  onClick={() => setOpen(isOpen ? -1 : i)}>
                  <span className="faq__n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="faq__q">{f.q}</span>
                  <i aria-hidden="true" />
                </button>
              </h3>
              <div className="faq__a" id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
                <div><p>{f.a}</p></div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
