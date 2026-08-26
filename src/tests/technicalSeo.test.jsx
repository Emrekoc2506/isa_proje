import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import SEO from '../components/SEO/SEO';
import {
  stripHtml,
  toAbsoluteUrl,
  cleanCanonicalUrl,
  isTestEnv,
  safeJsonLdStringify,
} from '../utils/seoHelpers';

describe('Technical SEO Helper Functions', () => {
  it('stripHtml removes all HTML tags and trims whitespace', () => {
    const raw = '<p>Hello <strong>World</strong>!</p><script>alert("xss")</script>';
    expect(stripHtml(raw)).toBe('Hello World!alert("xss")');
  });

  it('toAbsoluteUrl converts relative paths to https://muhristan.com domain', () => {
    expect(toAbsoluteUrl('/images/logo.png')).toBe('https://muhristan.com/images/logo.png');
    expect(toAbsoluteUrl('images/logo.png')).toBe('https://muhristan.com/images/logo.png');
    expect(toAbsoluteUrl('https://othercdn.com/pic.jpg')).toBe('https://othercdn.com/pic.jpg');
    expect(toAbsoluteUrl('')).toBe('https://muhristan.com/logo.png');
  });

  it('cleanCanonicalUrl removes tracking query params and trailing slashes', () => {
    const dirty = 'https://muhristan.com/urun/123?utm_source=google&gclid=xyz&ref=1#top/';
    expect(cleanCanonicalUrl(dirty)).toBe('https://muhristan.com/urun/123');
  });

  it('isTestEnv detects test.muhristan.com domain', () => {
    expect(isTestEnv('test.muhristan.com')).toBe(true);
    expect(isTestEnv('muhristan.com')).toBe(false);
    expect(isTestEnv('localhost')).toBe(false);
  });

  it('safeJsonLdStringify escapes dangerous HTML tags like </script>', () => {
    const maliciousObj = { title: '</script><script>alert(1)</script>' };
    const stringified = safeJsonLdStringify(maliciousObj);
    expect(stringified).not.toContain('</script>');
    expect(stringified).toContain('\\u003c');
  });
});

describe('SEO Component Integration', () => {
  it('renders Helmet metadata without errors', () => {
    const { container } = render(
      <HelmetProvider>
        <SEO
          title="Test Title | Muhristan"
          description="Test description"
          canonical="https://muhristan.com/test"
          jsonLd={{ '@context': 'https://schema.org', '@type': 'WebPage' }}
        />
      </HelmetProvider>
    );

    expect(container).toBeDefined();
  });
});
