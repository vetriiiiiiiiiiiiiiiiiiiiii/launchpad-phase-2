import { useEffect, useState } from 'react';

export const EVENT_START = new Date('2026-10-26T00:00:00+05:30').getTime();
const pad = (n) => String(n).padStart(2, '0');

export function useCountdown() {
  const calc = () => {
    const ms = Math.max(0, EVENT_START - Date.now());
    return {
      ms,
      d: pad(Math.floor(ms / 864e5)),
      h: pad(Math.floor(ms / 36e5) % 24),
      m: pad(Math.floor(ms / 6e4) % 60),
      s: pad(Math.floor(ms / 1e3) % 60),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id); }, []);
  return t;
}
