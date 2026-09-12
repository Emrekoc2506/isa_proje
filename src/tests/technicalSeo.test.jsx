import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import SEO from '../components/SEO/SEO';
import {
  stripHtml,
  decodeHtmlEntities,
  slugify,
  truncateForSeoDescription,
  generateSeoDescription,
  generateSeoKeywords,
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

  it('decodeHtmlEntities decodes Turkish HTML entities correctly', () => {
    const entityText = 'Ama&ccedil;lar ve ge&ccedil;mi&thorn;ten g&uuml;n&uuml;m&uuml;ze f&ouml;n &nbsp; &amp; &quot;test&quot;';
    const decoded = decodeHtmlEntities(entityText);
    expect(decoded).toContain('Amaçlar');
    expect(decoded).toContain('günümüze');
    expect(decoded).toContain('&');
    expect(decoded).toContain('"test"');
  });

  it('slugify converts Turkish characters to Latin characters properly without losing letters', () => {
    const title = 'Tılsımlı Tablolar Nedir? Kullanım Amaçları ve Geleneksel Hazırlama Usulleri';
    const expected = 'tilsimli-tablolar-nedir-kullanim-amaclari-ve-geleneksel-hazirlama-usulleri';
    expect(slugify(title)).toBe(expected);

    expect(slugify('Şampiyon Öğretmenler ve Çiçekler')).toBe('sampiyon-ogretmenler-ve-cicekler');
    expect(slugify('İSA & MÜHRİSTAN / DOĞAL TAŞLAR')).toBe('isa-muhristan-dogal-taslar');
  });

  it('generateSeoDescription cleans HTML entities, removes duplicate title header, and avoids cutting words in half', () => {
    const title = 'Tılsımlı Tablolar Nedir? Kullanım Amaçları ve Geleneksel Hazırlama Usulleri';
    const rawContent = '<p><strong>Tılsımlı Tablolar Nedir? Kullanım Ama&ccedil;ları ve Geleneksel Hazırlama Usulleri</strong></p><p>Tılsımlı tablolar, ge&ccedil;mişten g&uuml;n&uuml;m&uuml;ze farklı k&uuml;lt&uuml;rlerde manevi ve koruyucu ama&ccedil;larla hazırlanmış geleneksel eserlerdir.</p>';
    
    const desc = generateSeoDescription(rawContent, title, 160);
    expect(desc).not.toContain('&ccedil;');
    expect(desc).not.toContain('&uuml;');
    expect(desc).toContain('geçmişten günümüze');
    expect(desc).not.toContain('k&uuml;lt&');
    expect(desc.length).toBeLessThanOrEqual(160);
  });

  it('generateSeoKeywords extracts clean keywords without trailing punctuation', () => {
    const title = 'Tılsımlı Tablolar Nedir? Kullanım Amaçları!';
    const keywords = generateSeoKeywords(title);
    expect(keywords).not.toContain('?');
    expect(keywords).not.toContain('!');
    expect(keywords).toContain('tılsımlı');
    expect(keywords).toContain('tablolar');
    expect(keywords).toContain('nedir');
    expect(keywords).toContain('kullanım');
    expect(keywords).toContain('muhristan');
  });


  it('toAbsoluteUrl converts relative paths to https://muhristan.com domain', () => {
    expect(toAbsoluteUrl('/images/logo.png')).toBe('https://muhristan.com/images/logo.png');
    expect(toAbsoluteUrl('images/logo.png')).toBe('https://muhristan.com/images/logo.png');
    expect(toAbsoluteUrl('https://othercdn.com/pic.jpg')).toBe('https://othercdn.com/pic.jpg');
    expect(toAbsoluteUrl('')).toBe('https://muhristan.com/logo-2.png');
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
