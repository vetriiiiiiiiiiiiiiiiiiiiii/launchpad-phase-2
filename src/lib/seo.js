import { useEffect } from 'react';

const BASE_DESCRIPTION = 'Join Launchpad on 26 October 2026 for expert talks, live pitching, hands-on problem solving and three product launches.';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&w=1200&h=630&q=75';

function setMeta(attribute, key, value) {
  let node = [...document.head.querySelectorAll(`meta[${attribute}]`)]
    .find((item) => item.getAttribute(attribute) === key);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  node.setAttribute('content', value);
}

function setCanonical(url) {
  let node = document.head.querySelector('link[rel="canonical"]');
  if (!node) {
    node = document.createElement('link');
    node.rel = 'canonical';
    document.head.appendChild(node);
  }
  node.href = url;
}

export function canonicalUrl(pathname) {
  const configured = document.querySelector('meta[name="site-url"]')?.content?.trim();
  const origin = configured ? new URL(configured).origin : window.location.origin;
  return new URL(pathname, `${origin}/`).href;
}

export function absoluteUrl(value) {
  if (/^https?:\/\//i.test(value)) return value;
  const configured = document.querySelector('meta[name="site-url"]')?.content?.trim();
  const origin = configured ? new URL(configured).origin : window.location.origin;
  return new URL(value, `${origin}/`).href;
}

export function setJsonLd(id, value) {
  let node = document.head.querySelector(`script[data-seo-schema="${id}"]`);
  if (!value) {
    node?.remove();
    return;
  }
  if (!node) {
    node = document.createElement('script');
    node.type = 'application/ld+json';
    node.dataset.seoSchema = id;
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(value).replace(/</g, '\\u003c');
}

export function usePageSeo({ title, description = BASE_DESCRIPTION, path = '/', image = DEFAULT_IMAGE, schema, type = 'website' }) {
  useEffect(() => {
    const url = canonicalUrl(path);
    const imageUrl = absoluteUrl(image);
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', 'Launchpad');
    setMeta('property', 'og:locale', 'en_IN');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', imageUrl);
    setMeta('property', 'og:image:alt', 'A full room gathered for a live event at Launchpad');
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', imageUrl);
    setMeta('name', 'twitter:image:alt', 'A full room gathered for a live event at Launchpad');
    setCanonical(url);
    setJsonLd('page', schema ? schema(url) : null);
  }, [title, description, path, image, schema, type]);
}

export const DEFAULT_SEO_DESCRIPTION = BASE_DESCRIPTION;
export const DEFAULT_SEO_IMAGE = DEFAULT_IMAGE;
