import { Helmet } from 'react-helmet-async';

export default function SEO({
  title = 'muhristan - Özel Takı & Aksesuar Koleksiyonu',
  description = 'Zarif ve benzersiz gümüş kolyeler, yüzükler, bileklikler ve özel tasarım aksesuarlar muhristan güvencesiyle sizleri bekliyor.',
  image = '/Logo-2.png',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website'
}) {
  const siteTitle = title.includes('muhristan') ? title : `${title} | muhristan`;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="muhristan" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
