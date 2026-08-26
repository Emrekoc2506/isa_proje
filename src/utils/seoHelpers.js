const DOMAIN = 'https://muhristan.com';

export function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toAbsoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return `${DOMAIN}/logo.png`;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${DOMAIN}${cleanPath}`;
}

export function cleanCanonicalUrl(urlStr, keepQueryParams = false) {
  if (!urlStr) {
    if (typeof window !== 'undefined') {
      const loc = window.location;
      urlStr = `${loc.pathname}${loc.search}`;
    } else {
      urlStr = '/';
    }
  }

  try {
    const fullUrl = urlStr.startsWith('http') ? urlStr : `${DOMAIN}${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;
    const u = new URL(fullUrl);
    
    // Always strip tracking params
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'ref'];
    trackingParams.forEach(p => u.searchParams.delete(p));

    let pathname = u.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    let search = u.search;
    if (!keepQueryParams) {
      search = '';
    }

    return `${DOMAIN}${pathname}${search}`;
  } catch {
    return DOMAIN;
  }
}

export function isTestEnv(customHost) {
  const host = customHost || (typeof window !== 'undefined' ? window.location.hostname : '');
  return host.toLowerCase().includes('test.muhristan.com');
}

export function safeJsonLdStringify(jsonLd) {
  if (!jsonLd) return null;
  return JSON.stringify(jsonLd).replace(/</g, '\\u003c');
}
