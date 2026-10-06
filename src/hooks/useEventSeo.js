import { useCallback } from 'react';
import { S } from '../lib/content.js';
import { IMG, P } from '../lib/images.js';
import { absoluteUrl, DEFAULT_SEO_IMAGE, usePageSeo } from '../lib/seo.js';

const title = `Launchpad 2026 | ${S.summitLabel}`;
const description = `${S.summitLabel} on 26 October 2026: expert talks, live pitching, hands-on problem solving and three product launches.`;

/* Event and FAQ structured data follow the editable event details. */
export function useEventSeo() {
  const schema = useCallback((url) => {
    const graph = [{ '@type': 'WebSite', '@id': `${url}#website`, name: 'Launchpad', url, inLanguage: 'en' }];
    if (S.venue || S.city) {
      graph.push({
        '@type': 'Event',
        '@id': `${url}#event`,
        name: 'Launchpad 2026',
        description: `${S.summitLabel}: one day of expert talks, live pitching, hands-on problem solving and three product launches.`,
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

const launchesTitle = 'Three Product Launches Revealed Live | Launchpad 2026';
const launchesDescription = 'Discover the three products launching live at Launchpad on 26 October 2026, alongside expert talks, pitching and hands-on problem solving.';

export function useLaunchesSeo() {
  const schema = useCallback((url) => {
    const home = new URL('/', url).href;
    return {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', '@id': `${home}#website`, name: 'Launchpad', url: home, inLanguage: 'en' },
        {
          '@type': 'CollectionPage',
          name: launchesTitle,
          description: launchesDescription,
          url,
          inLanguage: 'en',
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: ['The First Reveal', 'The Second Reveal', 'The Final Reveal'].map((name, index) => ({
              '@type': 'ListItem', position: index + 1, name, url: `${url}#product-0${index + 1}`,
            })),
          },
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Launchpad', item: home },
              { '@type': 'ListItem', position: 2, name: 'The Launches', item: url },
            ],
          },
        },
      ],
    };
  }, []);
  usePageSeo({ title: launchesTitle, description: launchesDescription, path: '/launches', image: DEFAULT_SEO_IMAGE, schema });
}
