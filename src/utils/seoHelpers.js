const DOMAIN = 'https://muhristan.com';

// Decode HTML entities (browser & SSR / Node safe)
export function decodeHtmlEntities(str) {
  if (!str) return '';
  let text = String(str);

  // Tarayıcı ortamında DOM üzerinden eksiksiz çözümleme
  if (typeof document !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const decoded = doc.body.textContent;
      if (decoded !== null && decoded !== undefined) {
        text = decoded;
      }
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        text = textarea.value;
      } catch {
        // Fallback to regex mapping below
      }
    }
  }

  // Node, SSR, test ortamı ve kalan entity'ler için kapsamlı Türkçe & standart HTML entity eşleme
  const entityMap = {
    '&ccedil;': 'ç', '&Ccedil;': 'Ç',
    '&ouml;': 'ö', '&Ouml;': 'Ö',
    '&uuml;': 'ü', '&Uuml;': 'Ü',
    '&Idot;': 'İ', '&#304;': 'İ',
    '&inodot;': 'ı', '&#305;': 'ı',
    '&scedil;': 'ş', '&Scedil;': 'Ş', '&#351;': 'ş', '&#350;': 'Ş',
    '&gbreve;': 'ğ', '&Gbreve;': 'Ğ', '&#287;': 'ğ', '&#286;': 'Ğ',
    '&thorn;': 'ş', '&Thorn;': 'Ş',
    '&eth;': 'ğ', '&ETH;': 'Ğ',
    '&yacute;': 'ı', '&Yacute;': 'İ',
    '&amp;': '&',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&#039;': "'",
    '&nbsp;': ' ',
    '&hellip;': '...',
    '&ndash;': '-',
    '&mdash;': '—',
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&rdquo;': '"',
    '&ldquo;': '"',
    '&laquo;': '«',
    '&raquo;': '»',
    '&bull;': '•',
    '&lt;': '<',
    '&gt;': '>'
  };

  text = text.replace(/&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/g, (match) => {
    const lower = match.toLowerCase();
    if (entityMap[match]) return entityMap[match];
    if (entityMap[lower]) return entityMap[lower];

    if (match.startsWith('&#x') || match.startsWith('&#X')) {
      const code = parseInt(match.slice(3, -1), 16);
      if (!isNaN(code) && code > 0) {
        try {
          return String.fromCodePoint(code);
        } catch {
          return match;
        }
      }
    } else if (match.startsWith('&#')) {
      const code = parseInt(match.slice(2, -1), 10);
      if (!isNaN(code) && code > 0) {
        try {
          return String.fromCodePoint(code);
        } catch {
          return match;
        }
      }
    }
    return match;
  });

  return text;
}

export function stripHtml(html) {
  if (!html) return '';
  let text = String(html);
  // Decode HTML entities
  text = decodeHtmlEntities(text);
  // Blok elementlerin bitişlerine boşluk ekleyerek kelimelerin yapışmasını önle
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|table|blockquote|section|article)>/gi, ' ');
  text = text.replace(/<(br|hr)\s*\/?>/gi, ' ');
  // Tüm HTML tag'lerini temizle
  text = text.replace(/<[^>]*>?/gm, '');
  // Fazla boşlukları teke indir ve kırp
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Türkçe ve özel karakterleri güvenli URL slug formatına dönüştürür.
 * Örneğin: "Tılsımlı Tablolar Nedir? Kullanım Amaçları" -> "tilsimli-tablolar-nedir-kullanim-amaclari"
 */
export function slugify(text) {
  if (!text) return '';
  let str = String(text).trim();

  // HTML veya entity varsa önce temizle
  str = stripHtml(str);

  // Türkçe ve şapkalı karakterleri Latin karşılıklarına eşle
  const turkishMap = {
    'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'I': 'i', 'İ': 'i', 'i': 'i',
    'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u',
    'â': 'a', 'Â': 'a',
    'î': 'i', 'Î': 'i',
    'û': 'u', 'Û': 'u'
  };

  str = str.replace(/[çÇğĞıIİiöÖşŞüÜâÂîÎûÛ]/g, char => turkishMap[char] || char);

  // Küçük harfe çevir
  str = str.toLowerCase();

  // Alfanümerik olmayan tüm karakterleri tireye çevir
  str = str.replace(/[^a-z0-9]+/g, '-');

  // Baştaki ve sondaki ardışık tireleri temizle
  str = str.replace(/^-+|-+$/g, '');

  return str;
}

/**
 * SEO açıklaması için metni kelime ortasından bölmeden temizce kırpar (maks 160 karakter).
 */
export function truncateForSeoDescription(text, maxLength = 160) {
  if (!text) return '';
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;

  // 157 karakterden önceki son boşluktan kes ve ... ekle
  const targetLen = maxLength - 3;
  let truncated = clean.slice(0, targetLen);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > targetLen * 0.6) {
    truncated = truncated.slice(0, lastSpace);
  }

  // Kesilen yerdeki gereksiz noktalama işaretlerini temizle
  truncated = truncated.replace(/[,;:\-\.\s]+$/, '');
  return `${truncated}...`;
}

/**
 * RichText/TinyMCE veya ham içerikten kusursuz ve saçmalamayan SEO açıklaması üretir.
 * Eğer içerik başlıkla başlıyorsa başlık tekrarını temizler, kelimeleri düzgün böler.
 */
export function generateSeoDescription(rawContent, fallbackTitle = '', maxLength = 160) {
  let text = stripHtml(rawContent || '');

  // Başlık tekrarını temizle (TinyMCE başında başlık varsa "Başlık Başlık metin..." olmasın)
  if (fallbackTitle && text) {
    const cleanTitle = stripHtml(fallbackTitle).trim();
    if (cleanTitle && text.toLowerCase().startsWith(cleanTitle.toLowerCase())) {
      const rest = text.slice(cleanTitle.length).replace(/^[\s:\-\–\—\.]+/, '').trim();
      if (rest.length >= 25) {
        text = rest;
      }
    }
  }

  // Eğer hala metin yoksa fallback başlıktan anlamlı bir cümle üret
  if (!text) {
    const cleanTitle = stripHtml(fallbackTitle).trim();
    if (cleanTitle) {
      text = `${cleanTitle} - Muhristan güvencesiyle hemen keşfedin ve güvenle sipariş verin.`;
    } else {
      text = 'Muhristan özel tasarım ürünleri ve el yapımı özel koleksiyonlar.';
    }
  }

  return truncateForSeoDescription(text, maxLength);
}

/**
 * Başlık ve opsiyonel metinden temiz, noktalama işaretlerinden arındırılmış anahtar kelimeler üretir.
 */
export function generateSeoKeywords(title, additionalText = '') {
  if (!title && !additionalText) return '';

  const cleanTitle = stripHtml(title || '');
  // Noktalama işaretlerini kaldır
  const normalizedTitle = cleanTitle.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ' ');

  const stopWords = new Set([
    've', 'veya', 'ile', 'icin', 'için', 'bir', 'bu', 'da', 'de', 'en', 'cok', 'çok', 'her', 'mi', 'mu', 'mü', 'mı'
  ]);

  const words = normalizedTitle
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 2 && !stopWords.has(w));

  const keywordList = [];

  // Tam başlık (noktalamasız)
  const fullCleanTitle = normalizedTitle.replace(/\s+/g, ' ').trim().toLowerCase();
  if (fullCleanTitle) {
    keywordList.push(fullCleanTitle);
  }

  // Kelimeleri ekle
  words.forEach(w => keywordList.push(w));

  // Marka etiketleri
  keywordList.push('muhristan', 'özel tasarım');

  // Benzersiz yap
  return Array.from(new Set(keywordList)).join(', ');
}


export function toAbsoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return `${DOMAIN}/logo-2.png`;
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
