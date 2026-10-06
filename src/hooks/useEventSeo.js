import { useEffect } from 'react';
import { S } from '../lib/content.js';
import { IMG, P } from '../lib/images.js';

/* Tells search engines what this is: a schema.org Event, built from the
   admin's settings, so Google can show the date, place and a register link. */
export function useEventSeo() {
  useEffect(() => {
    const abs = (u) => (u.startsWith('/') ? location.origin + u : u);
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: 'Launchpad 2026',
      description: `${S.summitLabel}: one day of expert talks, live pitching, hands-on problem solving and three product launches.`,
      startDate: S.eventStart,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      image: [abs(IMG(P.heroTalk, 1600))],
      url: location.origin + '/',
      ...(S.venue || S.city ? {
        location: { '@type': 'Place', name: S.venue || S.city, address: { '@type': 'PostalAddress', addressLocality: S.city || undefined, addressCountry: 'IN' } },
      } : {}),
      ...(S.registerUrl ? { offers: { '@type': 'Offer', url: S.registerUrl, availability: 'https://schema.org/InStock' } } : {}),
    };
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.textContent = JSON.stringify(data);
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
}
