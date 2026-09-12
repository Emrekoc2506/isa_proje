import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://muhristan.com';
const API_URL = 'https://api.muhristan.com/api';

const escapeXml = (unsafe) => {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const formatDate = (dateStr) => {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

async function generateSitemap() {
  console.log('🚀 Generating sitemap for Muhristan...');
  const today = formatDate();

  const urls = [
    // ── Ana Sayfa & Statik Kurumsal Sayfalar ──────────────────
    { loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'daily', lastmod: today },
    { loc: `${BASE_URL}/urunler`, priority: '0.9', changefreq: 'daily', lastmod: today },
    { loc: `${BASE_URL}/blog`, priority: '0.8', changefreq: 'daily', lastmod: today },
    { loc: `${BASE_URL}/hakkimizda`, priority: '0.6', changefreq: 'monthly', lastmod: today },
    { loc: `${BASE_URL}/iletisim`, priority: '0.6', changefreq: 'monthly', lastmod: today },
    { loc: `${BASE_URL}/kargo-teslimat`, priority: '0.4', changefreq: 'monthly', lastmod: today },
    { loc: `${BASE_URL}/garanti-ve-iptal`, priority: '0.4', changefreq: 'monthly', lastmod: today },
    { loc: `${BASE_URL}/gizlilik-politikasi`, priority: '0.3', changefreq: 'monthly', lastmod: today },
    { loc: `${BASE_URL}/kullanim-kosullari`, priority: '0.3', changefreq: 'monthly', lastmod: today },
    { loc: `${BASE_URL}/mesafeli-satis-sozlesmesi`, priority: '0.3', changefreq: 'monthly', lastmod: today },
    { loc: `${BASE_URL}/kvkk-aydinlatma-metni`, priority: '0.3', changefreq: 'monthly', lastmod: today },
    { loc: `${BASE_URL}/cerez-politikasi`, priority: '0.3', changefreq: 'monthly', lastmod: today }
  ];

  // ── Kategoriler ve Alt Kategoriler ────────────────────────
  try {
    console.log('📦 Fetching categories...');
    const catRes = await fetch(`${API_URL}/categories`);
    if (catRes.ok) {
      const categories = await catRes.json();
      const catList = Array.isArray(categories) ? categories : categories?.items || [];
      
      catList.forEach(cat => {
        const slug = cat.slug || cat.id;
        if (slug) {
          urls.push({
            loc: `${BASE_URL}/urunler?kategori=${encodeURIComponent(slug)}`,
            priority: '0.85',
            changefreq: 'weekly',
            lastmod: formatDate(cat.updatedAt || cat.createdAt || today)
          });
        }

        // Alt kategoriler (children)
        if (Array.isArray(cat.children)) {
          cat.children.forEach(child => {
            const childSlug = child.slug || child.id;
            if (childSlug) {
              urls.push({
                loc: `${BASE_URL}/urunler?kategori=${encodeURIComponent(childSlug)}`,
                priority: '0.80',
                changefreq: 'weekly',
                lastmod: formatDate(child.updatedAt || child.createdAt || today)
              });
            }
          });
        }
      });
      console.log(`✅ Added ${catList.length} main categories and their subcategories.`);
    }
  } catch (err) {
    console.warn('⚠️ Could not fetch categories from API, adding default category list:', err.message);
    const defaultCategories = [
      'yuzukler', 'tilsimli-akik-tasli-yuzukler',
      'kolyeler', 'tilsimli-bakir-kolyeler', 'tilsimli-celik-kolyeler', 'tilsimli-dogal-tasli-kolyeler',
      't-ts-ler', 'buhurdanliklar', 'esanslar'
    ];
    defaultCategories.forEach(slug => {
      urls.push({
        loc: `${BASE_URL}/urunler?kategori=${encodeURIComponent(slug)}`,
        priority: '0.85',
        changefreq: 'weekly',
        lastmod: today
      });
    });
  }

  // ── Ürünler ───────────────────────────────────────────────
  try {
    console.log('💎 Fetching products...');
    const prodRes = await fetch(`${API_URL}/products?pageSize=500`);
    if (prodRes.ok) {
      const prodData = await prodRes.json();
      const products = Array.isArray(prodData) ? prodData : (prodData?.items || prodData?.data || []);
      
      let prodCount = 0;
      products.forEach(p => {
        if (p.isActive === false || p.isSecret || p.IsSecret || p.name?.endsWith(' [GİZLİ]')) return;
        const slug = p.slug || p.id;
        if (slug) {
          urls.push({
            loc: `${BASE_URL}/urun/${encodeURIComponent(slug)}`,
            priority: '0.75',
            changefreq: 'weekly',
            lastmod: formatDate(p.updatedAt || p.createdAt || today)
          });
          prodCount++;
        }
      });
      console.log(`✅ Added ${prodCount} individual products to sitemap.`);
    }
  } catch (err) {
    console.warn('⚠️ Could not fetch products from API:', err.message);
  }

  // ── Blog Makaleleri ───────────────────────────────────────
  try {
    console.log('📝 Fetching blog articles...');
    const blogRes = await fetch(`${API_URL}/blog?pageSize=100`);
    if (blogRes.ok) {
      const blogData = await blogRes.json();
      const articles = Array.isArray(blogData) ? blogData : (blogData?.items || []);
      
      let articleCount = 0;
      articles.forEach(a => {
        if (a.isActive === false) return;
        const slug = a.slug || a.id;
        if (slug) {
          urls.push({
            loc: `${BASE_URL}/blog/${encodeURIComponent(slug)}`,
            priority: '0.70',
            changefreq: 'monthly',
            lastmod: formatDate(a.publishedAt || a.updatedAt || a.createdAt || today)
          });
          articleCount++;
        }
      });
      console.log(`✅ Added ${articleCount} blog articles to sitemap.`);
    }
  } catch (err) {
    console.warn('⚠️ Could not fetch blog articles from API:', err.message);
  }

  // ── XML Çıktısını Oluştur ──────────────────────────────────
  const xmlContent = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`),
    '</urlset>',
    ''
  ].join('\n');

  const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(sitemapPath, xmlContent, 'utf-8');
  console.log(`🎉 Sitemap successfully written to ${sitemapPath} (Total ${urls.length} URLs).`);
}

generateSitemap();
