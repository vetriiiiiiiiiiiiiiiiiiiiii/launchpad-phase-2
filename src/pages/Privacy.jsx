import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_PRIVACY, S } from '../lib/content.js';
import { usePageSeo } from '../lib/seo.js';
import { useArrive } from '../hooks/useArrive.js';

/* Turns the admin's plain text into headings, paragraphs and lists —
   as React elements, so no markup in the text is ever executed. */
function render(text) {
  const contact = S.contactEmail;
  const withContact = (line, key) => {
    const parts = line.split('{contact}');
    return parts.flatMap((part, i) => (i === 0 ? [part] : [
      contact ? <a key={`${key}-c${i}`} href={`mailto:${contact}`}>{contact}</a> : 'the contact email listed on this site',
      part,
    ]));
  };
  return text.split(/\n{2,}/).map((block, bi) => {
    const lines = block.split('\n').filter((l) => l.trim());
    if (!lines.length) return null;
    const out = [];
    let list = [];
    const flush = () => { if (list.length) { out.push(<ul key={`${bi}-ul${out.length}`}>{list}</ul>); list = []; } };
    lines.forEach((line, li) => {
      const key = `${bi}-${li}`;
      if (line.startsWith('## ')) { flush(); out.push(<h2 key={key}>{withContact(line.slice(3), key)}</h2>); }
      else if (/^[-•]\s/.test(line)) list.push(<li key={key}>{withContact(line.replace(/^[-•]\s/, ''), key)}</li>);
      else { flush(); out.push(<p key={key}>{withContact(line, key)}</p>); }
    });
    flush();
    return out;
  });
}

export default function Privacy() {
  useArrive();
  useEffect(() => { document.body.classList.remove('is-loading'); }, []);
  usePageSeo({
    title: 'Privacy Policy | Launchpad 2026',
    description: 'How the Launchpad website handles information: what it collects, browser storage, third-party services and how to contact us.',
    path: '/privacy',
  });
  const text = (S.privacyPolicy || '').trim() || DEFAULT_PRIVACY;
  return (
    <main className="privacy" data-tone="light">
      <article className="privacy__doc">
        <p className="eyebrow">Launchpad · 26 October 2026</p>
        <h1>Privacy policy</h1>
        <div className="privacy__body">{render(text)}</div>
        <p className="privacy__back"><Link to="/">← Back to Launchpad</Link></p>
      </article>
    </main>
  );
}
