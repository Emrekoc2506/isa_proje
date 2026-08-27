import { Helmet } from 'react-helmet-async';
import { 
  stripHtml, 
  toAbsoluteUrl, 
  cleanCanonicalUrl, 
  isTestEnv, 
  safeJsonLdStringify
} from '../../utils/seoHelpers';

const DEFAULT_TITLE = 'Muhristan | Takı Esans Dünyası';
const DEFAULT_DESCRIPTION = "Muhristan'da en kaliteli takı ve esansları bulun, ruhunuzu keşfedin.";
const DEFAULT_IMAGE = 'https://muhristan.com/logo-2.png';

export default function SEO({
  title,
  description,
  keywords,
  canonical,
  robots,
  noindex = false,
  type = 'website',
  image,
  jsonLd = null,
  keepQueryParams = false,
  is404 = false
}) {
  // Title Format
  let siteTitle = DEFAULT_TITLE;
  if (title) {
    siteTitle = title.includes('Muhristan') || title.includes('muhristan') 
      ? title 
      : `${title} | Muhristan`;
  }

  // Description Format
  const cleanDescription = description 
    ? stripHtml(description).slice(0, 160) 
    : DEFAULT_DESCRIPTION;

  // Absolute Image URL
  const absoluteImage = toAbsoluteUrl(image || DEFAULT_IMAGE);

  // Canonical URL
  const canonicalUrl = cleanCanonicalUrl(canonical, keepQueryParams);

  // Robots logic: Test environment or noindex prop or 404 forces noindex, nofollow
  let effectiveRobots = 'index, follow';
  if (isTestEnv() || noindex || is404) {
    effectiveRobots = 'noindex, nofollow';
  } else if (robots) {
    effectiveRobots = robots;
  }

  // Keywords string format
  let keywordsStr = null;
  if (Array.isArray(keywords)) {
    keywordsStr = keywords.filter(Boolean).join(', ');
  } else if (typeof keywords === 'string' && keywords.trim()) {
    keywordsStr = keywords.trim();
  }

  // JSON-LD processing
  const jsonLdItems = Array.isArray(jsonLd) 
    ? jsonLd.filter(Boolean) 
    : (jsonLd ? [jsonLd] : []);

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{siteTitle}</title>
      <meta name="description" content={cleanDescription} />
      {keywordsStr && <meta name="keywords" content={keywordsStr} />}
      <meta name="robots" content={effectiveRobots} />

      {/* Canonical Link */}
      {!is404 && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={cleanDescription} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Muhristan" />
      <meta property="og:locale" content="tr_TR" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={cleanDescription} />
      <meta name="twitter:image" content={absoluteImage} />

      {/* Structured Data (JSON-LD) */}
      {jsonLdItems.map((item, index) => (
        <script key={index} type="application/ld+json">
          {safeJsonLdStringify(item)}
        </script>
      ))}
    </Helmet>
  );
}
