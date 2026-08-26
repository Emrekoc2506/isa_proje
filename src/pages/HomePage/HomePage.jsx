import { useState, useEffect } from 'react';
import styles from './HomePage.module.css';
import HeroSlider from '../../components/HeroSlider/HeroSlider';
import ProductSection from '../../components/ProductSection/ProductSection';
import BlogSection from '../../components/BlogSection/BlogSection';
import CategoryNav from '../../components/CategoryNav/CategoryNav';
import SEO from '../../components/SEO/SEO';
import { MdOutlineLocalShipping } from 'react-icons/md';
import { getFeaturedProducts, getNewProducts, getSaleProducts } from '../../services/productApi';
import { getBlogArticles } from '../../services/blogApi';
import { blogArticles as mockArticles } from '../../data/index';

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'Muhristan',
  'url': 'https://muhristan.com/',
  'logo': 'https://muhristan.com/logo.png'
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  'name': 'Muhristan',
  'url': 'https://muhristan.com/',
  'potentialAction': {
    '@type': 'SearchAction',
    'target': 'https://muhristan.com/urunler?search={search_term_string}',
    'query-input': 'required name=search_term_string'
  }
};

export default function HomePage() {
  const [products, setProducts] = useState({ news: [], sale: [], featured: [] });
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      getNewProducts({ page: 1, pageSize: 8 }),
      getSaleProducts({ page: 1, pageSize: 8 }),
      getFeaturedProducts({ page: 1, pageSize: 8 }),
    ]).then(([news, sale, featured]) => {
      if (!active) return;
      const items = (result) => result.status === 'fulfilled' ? result.value : { items: [] };
      setProducts({ news: items(news), sale: items(sale), featured: items(featured) });
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const loadBlog = () => getBlogArticles()
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.items || []);
        setArticles(list.length > 0 ? list : mockArticles);
      })
      .catch(() => setArticles(mockArticles));
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(loadBlog, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(loadBlog, 0);
    return () => clearTimeout(id);
  }, []);

  const items = (value) => Array.isArray(value) ? value : (value?.items || value?.data || []);
  const displayNews = items(products.news);
  const displaySale = items(products.sale);
  const displayFeatured = items(products.featured);

  return (
    <main id="main-content" className={styles.main}>
      <SEO 
        title="Muhristan | Takı Esans Dünyası"
        description="Muhristan'da en kaliteli takı ve esansları bulun, ruhunuzu keşfedin."
        canonical="https://muhristan.com/"
        jsonLd={[orgSchema, websiteSchema]}
      />
      {/* ── Hero Slider (1. Banner / Billboard) ──────────────── */}
      <HeroSlider />

      {/* ── Billboard Altı: Ücretsiz Teslimat Bandı (Üstte) ve Kategoriler (Altta) ── */}
      <div className={styles.belowBillboardSection}>
        {/* 1. Üst Sıra: Yurtiçi Kargo Bandı */}
        <div className={styles.announcementBar}>
          <MdOutlineLocalShipping className={styles.announcementIcon} />
          <span>
            Siparişleriniz <strong>Yurtiçi Kargo</strong> ile hızlı ve güvenli teslim edilir — Kargo Ücreti: <strong>170 ₺</strong>
          </span>
        </div>

        {/* 2. Alt Sıra: Kategoriler */}
        <div className={styles.categoryNavWrapper}>
          <CategoryNav />
        </div>
      </div>

      {/* ── Haberler / Yeni Gelenler ─────────────────────────── */}
      <ProductSection
        title="Yeni Gelenler"
        viewAllHref="/urunler"
        products={displayNews}
      />

      {/* ── Satış (Sale) ─────────────────────────────────── */}
      <section className={styles.saleSection}>
        <ProductSection
          title="İndirimdekiler"
          viewAllHref="/urunler"
          products={displaySale}
        />
      </section>

      {/* ── Öne Çıkan Ürünler (Featured) ─────────────────── */}
      <ProductSection
        title="Öne Çıkan Ürünler"
        viewAllHref="/urunler"
        products={displayFeatured}
      />

      {/* ── Blog ─────────────────────────────────────────── */}
      <BlogSection articles={articles} />
    </main>
  );
}

