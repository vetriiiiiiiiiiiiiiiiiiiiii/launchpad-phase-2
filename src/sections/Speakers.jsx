import { IMG } from '../lib/images.js';
import { S } from '../lib/content.js';

/* The lineup. Nothing shows until speakers are added in the admin panel;
   until then the Talks section simply says the lineup is coming. */
const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export default function Speakers() {
  const list = S.speakers;
  if (!list.length) {
    return (
      <div className="lineup" data-reveal>
        <p className="lineup__label">The lineup</p>
        <p className="lineup__status">Revealed <em>soon.</em></p>
      </div>
    );
  }
  return (
    <div className="speakers" id="speakers">
      <div className="speakers__head" data-reveal>
        <p className="lineup__label">The lineup</p>
        <p className="speakers__count">{list.length} {list.length === 1 ? 'voice' : 'voices'} <em>on stage</em></p>
      </div>
      <ul className="speakers__grid">
        {list.map((sp, i) => (
          <li className="speaker" key={`${sp.name}-${i}`} data-reveal style={{ '--i': i % 4 }}>
            <figure className="speaker__photo">
              {sp.photo
                ? <img src={IMG(sp.photo, 700)} alt={`Portrait of ${sp.name}`} loading="lazy" decoding="async" />
                : <span className="speaker__initials" aria-hidden="true">{initials(sp.name)}</span>}
            </figure>
            <div className="speaker__text">
              <h3 className="speaker__name">{sp.name}</h3>
              {(sp.role || sp.organisation) && (
                <p className="speaker__role">{[sp.role, sp.organisation].filter(Boolean).join(' · ')}</p>
              )}
              {sp.topic && <p className="speaker__topic">“{sp.topic}”</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
