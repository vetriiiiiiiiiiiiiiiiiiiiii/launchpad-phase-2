import { useCallback } from 'react';
import { S } from '../lib/content.js';
import { IMG, P } from '../lib/images.js';
import { absoluteUrl, DEFAULT_SEO_IMAGE, usePageSeo } from '../lib/seo.js';

const title = `Launchpad 2026 | ${S.summitLabel}`;
const description = `LaunchPad 2026 – Phase 2, an Entrepreneurs & Startup Summit in Trichy on 28 October 2026: speaker sessions, a panel discussion and three product launches, presented by the R. Shivakumar Foundation and EDC, SRM IST Tiruchirappalli.`;

/* Event and FAQ structured data follow the editable event details. */
export function useEventSeo() {
  const schema = useCallback((url) => {
    const graph = [{ '@type': 'WebSite', '@id': `${url}#website`, name: 'Launchpad', url, inLanguage: 'en' }];
    if (S.venue || S.city) {
      graph.push({
        '@type': 'Event',
        '@id': `${url}#event`,
        name: 'Launchpad 2026',
        description: `LaunchPad 2026 – Phase 2, an Entrepreneurs & Startup Summit in Trichy on 28 October 2026: speaker sessions, a panel discussion and three product launches, presented by the R. Shivakumar Foundation and EDC, SRM IST Tiruchirappalli.`,
        startDate: S.eventStart,
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        image: [absoluteUrl(IMG(P.heroTalk, 1200))],
        url,
        inLanguage: 'en',
        location: {
          '@type': 'Place',
          name: [S.venue, S.city].filter(Boolean).join(', '),
          address: { '@type': 'PostalAddress', ...(S.city ? { addressLocality: S.city } : {}), addressCountry: 'IN' },
        },
        ...(S.registerUrl ? {
          offers: { '@type': 'Offer', url: S.registerUrl, availability: 'https://schema.org/InStock' },
        } : {}),
        ...(S.speakers.length ? {
          performer: S.speakers.map((sp) => ({
            '@type': 'Person', name: sp.name,
            ...(sp.role ? { jobTitle: sp.role } : {}),
            ...(sp.organisation ? { worksFor: { '@type': 'Organization', name: sp.organisation } } : {}),
          })),
        } : {}),
      });
    }
    if (Array.isArray(S.faq) && S.faq.length) {
      graph.push({
        '@type': 'FAQPage',
        mainEntity: S.faq.filter((item) => item.q && item.a).map((item) => ({
          '@type': 'Question', name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      });
    }
    return { '@context': 'https://schema.org', '@graph': graph };
  }, []);

  usePageSeo({ title, description, path: '/', image: IMG(P.heroTalk, 1200), schema });
}
