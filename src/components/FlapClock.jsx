import { useEffect, useRef, useState } from 'react';
import { useCountdown } from '../hooks/useCountdown.js';
import { reduceMotion } from '../hooks/env.js';

/* A split-flap board, like a station's departures: each digit is a card
   that physically falls over when it changes. */
function Flap({ value }) {
  const [shown, setShown] = useState(value);   // what the static halves show
  const [prev, setPrev] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const t = useRef(0);
  useEffect(() => {
    if (value === shown) return undefined;
    if (reduceMotion) { setShown(value); setPrev(value); return undefined; }
    setPrev(shown);
    setShown(value);
    setFlipping(false);
    requestAnimationFrame(() => setFlipping(true));
    clearTimeout(t.current);
    t.current = setTimeout(() => setFlipping(false), 620);
    return () => clearTimeout(t.current);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span className={`flap${flipping ? ' is-flipping' : ''}`} aria-hidden="true">
      <span className="flap__half flap__top"><b>{shown}</b></span>
      <span className="flap__half flap__bottom"><b>{flipping ? prev : shown}</b></span>
      <span className="flap__half flap__fold-top"><b>{prev}</b></span>
      <span className="flap__half flap__fold-bottom"><b>{shown}</b></span>
    </span>
  );
}

export default function FlapClock() {
  const { d, h, m, s } = useCountdown();
  const groups = [[d, 'Days'], [h, 'Hours'], [m, 'Min'], [s, 'Sec']];
  return (
    <div className="flapclock" role="timer" aria-label={`Doors open in ${+d} days, ${+h} hours, ${+m} minutes`}>
      <p className="flapclock__label">Doors open in</p>
      <div className="flapclock__row">
        {groups.map(([v, l], gi) => (
          <div className="flapclock__group" key={l}>
            <div className="flapclock__digits">{String(v).split('').map((c, i) => <Flap key={i} value={c} />)}</div>
            <span className="flapclock__unit">{l}</span>
            {gi < 3 && <i className="flapclock__sep" aria-hidden="true" />}
          </div>
        ))}
      </div>
    </div>
  );
}
