import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://muhristan.com';
const API_URL = 'https://api.muhristan.com/api';
const BRAND = 'Muhristan';

// XML karakter kaçırma
function escapeXml(unsafe) {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// HTML Entity Decode
function decodeHtmlEntities(str) {
  if (!str) return '';
  let text = String(str);

  // Çift encode edilmiş durumları düzelt: &amp;ccedil; -> &ccedil;
  text = text.replace(/&amp;([a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/g, '&$1;');

  const entityMap = {
    '&ccedil;': 'ç', '&Ccedil;': 'Ç',
    '&ouml;': 'ö', '&Ouml;': 'Ö',
    '&uuml;': 'ü', '&Uuml;': 'Ü',
    '&Idot;': 'İ', '&#304;': 'İ',
    '&inodot;': 'ı', '&#305;': 'ı',
    '&scedil;': 'ş', '&Scedil;': 'Ş', '&#351;': 'ş', '&#350;': 'Ş',
    '&gbreve;': 'ğ', '&Gbreve;': 'Ğ', '&#287;': 'ğ', '&#286;': 'Ğ',
    '&acirc;': 'â', '&Acirc;': 'Â',
    '&icirc;': 'î', '&Icirc;': 'Î',
    '&ucirc;': 'û', '&Ucirc;': 'Û',
    '&amp;': '&', '&quot;': '"', '&apos;': "'", '&#39;': "'",
    '&nbsp;': ' ', '&hellip;': '...', '&ndash;': '-', '&mdash;': '—',
    '&bull;': '•', '&copy;': '©', '&reg;': '®'
  };

  text = text.replace(/&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/g, (match) => {
    const lower = match.toLowerCase();
    if (entityMap[match]) return entityMap[match];
    if (entityMap[lower]) return entityMap[lower];

    if (match.startsWith('&#x') || match.startsWith('&#X')) {
      const code = parseInt(match.slice(3, -1), 16);
      if (!isNaN(code) && code > 0) {
        try { return String.fromCodePoint(code); } catch {}
      }
    } else if (match.startsWith('&#')) {
      const code = parseInt(match.slice(2, -1), 10);
      if (!isNaN(code) && code > 0) {
        try { return String.fromCodePoint(code); } catch {}
      }
    }
    return match;
  });

  return text;
}

// HTML temizleme
function stripHtml(html) {
  if (!html) return '';
  return decodeHtmlEntities(String(html))
    .replace(/<\/(p|div|h[1-6]|li|tr|table|blockquote|section|article)>/gi, ' ')
    .replace(/<(br|hr)\s*\/?>/gi, ' ')
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Fiyat temizleme (örn: "6700 ₺" veya 6700 -> 6700.00)
function parsePriceNumber(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return raw > 0 ? raw : null;
  const cleaned = String(raw)
    .replace(/[₺TLtl,\s]/g, '')
    .trim();
  const num = parseFloat(cleaned);
  return !isNaN(num) && num > 0 ? num : null;
}

// Google Product Category Eşleme (Google Merchant Taxonomy)
function getGoogleCategory(catSlug, catName) {
  const text = `${catSlug || ''} ${catName || ''}`.toLowerCase();
  if (text.includes('yuzuk') || text.includes('yüzük') || text.includes('kolye') || text.includes('bileklik') || text.includes('taki') || text.includes('takı')) {
    return '188'; // Apparel & Accessories > Jewelry
  }
  if (text.includes('tutsu') || text.includes('tütsü') || text.includes('buhur') || text.includes('esans')) {
    return '607'; // Home & Garden > Decor > Home Fragrances
  }
  if (text.includes('tablo') || text.includes('sanat')) {
    return '500044'; // Arts & Entertainment > Hobbies & Creative Arts > Artwork
  }
  return '188'; // Varsayılan: Takı / Özel Aksesuar
}

// Görsel URL normalizasyonu
function toAbsoluteImageUrl(imgUrl) {
  if (!imgUrl) return 'https://muhristan.com/logo-2.png';
  if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) return imgUrl;
  const clean = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
  return `https://api.muhristan.com${clean}`;
}

async function generateGoogleMerchantXml() {
  console.log('🚀 Generating Google Merchant XML Catalog for Muhristan...');
  const startTime = Date.now();

  try {
    // 1. Ürün listesini çek
    const listRes = await fetch(`${API_URL}/products?pageSize=500`);
    if (!listRes.ok) {
      throw new Error(`API returned status ${listRes.status}`);
    }
    const listData = await listRes.json();
    const rawItems = Array.isArray(listData) ? listData : (listData?.items || listData?.data || []);

    // Aktif ve gizli olmayan ürünleri filtrele
    const validProducts = rawItems.filter(p => {
      if (p.isActive === false) return false;
      if (p.isSecret || p.IsSecret) return false;
      if (p.name && (p.name.includes('[GİZLİ]') || p.name.includes('(GİZLİ)'))) return false;
      return true;
    });

    console.log(`📦 Found ${validProducts.length} active products. Fetching detailed info...`);

    // 2. Ürün detaylarını 10'arlı batch'ler halinde çek
    const detailedProducts = [];
    const BATCH_SIZE = 10;
    for (let i = 0; i < validProducts.length; i += BATCH_SIZE) {
      const batch = validProducts.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (p) => {
          try {
            const dRes = await fetch(`${API_URL}/products/${p.id}`);
            if (dRes.ok) {
              const detail = await dRes.json();
              return { ...p, ...detail };
            }
          } catch {
            // Detay çekilemezse liste verisiyle devam et
          }
          return p;
        })
      );
      detailedProducts.push(...results);
    }

    // 3. XML Öğelerini (<item>) oluştur
    const itemsXml = detailedProducts.map(p => {
      const id = escapeXml(p.sku || p.id);
      const title = escapeXml(p.name?.trim()?.slice(0, 150) || 'Muhristan Özel Tasarım Ürün');
      
      // Açıklama: description -> seoDescription -> shortDescription -> fallback
      let rawDesc = p.description || p.seoDescription || p.shortDescription || '';
      let cleanDesc = stripHtml(rawDesc);
      if (!cleanDesc || cleanDesc.length < 20) {
        cleanDesc = `${p.name} - Muhristan özel tasarım ${p.categoryName || 'özel'} koleksiyonu. El işçiliği, kaliteli malzeme ve güvenli teslimat ile hemen sipariş verin.`;
      }
      const description = escapeXml(cleanDesc.slice(0, 5000));

      // Link
      const slug = p.slug || p.id;
      const link = escapeXml(`${BASE_URL}/urun/${slug}`);

      // Görseller
      const mainImage = toAbsoluteImageUrl(p.image || p.imageUrl || (p.images && p.images[0]?.url) || (p.images && p.images[0]));
      const mainImageXml = `<g:image_link>${escapeXml(mainImage)}</g:image_link>`;

      let additionalImagesXml = '';
      if (Array.isArray(p.images) && p.images.length > 1) {
        const extraImages = p.images.slice(1, 10); // En fazla 10 ek görsel
        additionalImagesXml = extraImages
          .map(img => {
            const url = toAbsoluteImageUrl(typeof img === 'string' ? img : (img.url || img.imageUrl));
            return url && url !== mainImage ? `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>` : '';
          })
          .filter(Boolean)
          .join('\n');
      }

      // Stok Durumu
      const stock = (p.stockQuantity !== undefined && p.stockQuantity !== null) ? Number(p.stockQuantity) : 1;
      const isAvailable = p.isActive !== false && stock > 0;
      const availability = isAvailable ? 'in_stock' : 'out_of_stock';

      // Fiyatlar
      const currentPriceNum = parsePriceNumber(p.price);
      const oldPriceNum = parsePriceNumber(p.oldPrice);

      let priceXml = '';
      if (oldPriceNum && currentPriceNum && oldPriceNum > currentPriceNum) {
        // İndirimli ürün
        priceXml = `      <g:price>${oldPriceNum.toFixed(2)} TRY</g:price>\n      <g:sale_price>${currentPriceNum.toFixed(2)} TRY</g:sale_price>`;
      } else if (currentPriceNum) {
        // Normal fiyat
        priceXml = `      <g:price>${currentPriceNum.toFixed(2)} TRY</g:price>`;
      } else {
        // Fallback
        priceXml = `      <g:price>100.00 TRY</g:price>`;
      }

      // Kategori
      const googleCatId = getGoogleCategory(p.categorySlug || p.categoryId, p.categoryName);
      const productType = escapeXml(p.parentCategoryName ? `${p.parentCategoryName} > ${p.categoryName}` : (p.categoryName || 'Özel Tasarım'));

      // Kargo Bilgisi
      const isFreeShip = Boolean(p.isFreeShipping);
      const feeNum = parsePriceNumber(p.shippingFee);
      const shippingCost = isFreeShip || !feeNum ? '0.00 TRY' : `${feeNum.toFixed(2)} TRY`;

      return `    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      ${mainImageXml}
${additionalImagesXml ? additionalImagesXml + '\n' : ''}      <g:availability>${availability}</g:availability>
${priceXml}
      <g:brand>${escapeXml(p.brand || BRAND)}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>${googleCatId}</g:google_product_category>
      <g:product_type>${productType}</g:product_type>
      <g:shipping>
        <g:country>TR</g:country>
        <g:service>Standart Kargo</g:service>
        <g:price>${shippingCost}</g:price>
      </g:shipping>
    </item>`;
    });

    // 4. RSS 2.0 XML çıktısını oluştur
    const xmlContent = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">',
      '  <channel>',
      `    <title>${BRAND} Google Merchant Ürün Kataloğu</title>`,
      `    <link>${BASE_URL}</link>`,
      `    <description>${BRAND} özel tasarım gümüş yüzükler, tılsımlı kolyeler, doğal taşlar ve manevi sanat eserleri ürün kataloğu.</description>`,
      itemsXml.join('\n'),
      '  </channel>',
      '</rss>',
      ''
    ].join('\n');

    // 5. Dosyaları public klasörüne kaydet
    const publicDir = path.resolve(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const filesToWrite = [
      path.join(publicDir, 'google-merchant.xml'),
      path.join(publicDir, 'google-catalog.xml'),
      path.join(publicDir, 'facebook-catalog.xml')
    ];

    filesToWrite.forEach(fPath => {
      fs.writeFileSync(fPath, xmlContent, 'utf-8');
      console.log(`✅ Written feed to: ${fPath}`);
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`🎉 Successfully generated Google Merchant Feed with ${detailedProducts.length} products in ${elapsed}s.`);
    return true;
  } catch (err) {
    console.error('❌ Error generating Google Merchant XML:', err);
    return false;
  }
}

generateGoogleMerchantXml();
