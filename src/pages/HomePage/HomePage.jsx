import { useState, useEffect } from 'react';
import styles from './HomePage.module.css';
import HeroSlider from '../../components/HeroSlider/HeroSlider';
import ProductSection from '../../components/ProductSection/ProductSection';
import BlogSection from '../../components/BlogSection/BlogSection';
import CategoryNav from '../../components/CategoryNav/CategoryNav';
import SEO from '../../components/SEO/SEO';
import { MdOutlineLocalShipping } from 'react-icons/md';
import { useProducts } from '../../context/ProductContext';
import { getBlogArticles } from '../../services/blogApi';
import { blogArticles as mockArticles } from '../../data/index';

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'Muhristan',
  'url': 'https://muhristan.com/',
  'logo': 'https://muhristan.com/logo-2.png'
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
  const { products } = useProducts();
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    getBlogArticles()
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.items || []);
        if (list.length > 0) {
          setArticles(list);
        } else {
          setArticles(mockArticles);
        }
      })
      .catch(() => setArticles(mockArticles));
  }, []);

  const newsProducts = products.filter(p => p.isNew);
  const saleProducts = products.filter(p => p.isSale);
  const featuredProducts = products.filter(p => p.isFeatured);

  const displayNews = newsProducts.length > 0 ? newsProducts : products.slice(0, 8);
  const displaySale = saleProducts.length > 0 ? saleProducts : products.slice(0, 8);
  const displayFeatured = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 8);

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

