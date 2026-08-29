import { useState, useEffect } from 'react';
import styles from './HomePage.module.css';
import HeroSlider from '../../components/HeroSlider/HeroSlider';
import ProductSection from '../../components/ProductSection/ProductSection';
import BlogSection from '../../components/BlogSection/BlogSection';
import CategoryNav from '../../components/CategoryNav/CategoryNav';
import SEO from '../../components/SEO/SEO';
import { MdOutlineLocalShipping } from 'react-icons/md';
import { getNewProducts, getSaleProducts, getFeaturedProducts } from '../../services/productApi';
import { normalizeProducts } from '../../context/ProductContext';
import { getBlogArticles } from '../../services/blogApi';

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
  const [articles, setArticles] = useState([]);
  const [newsProducts, setNewsProducts] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    let isMounted = true;

    // Ana sayfa için sadece 8'er adet hafif ürün verisini paralel çek (1000 ürün indirilmez)
    Promise.allSettled([
      getNewProducts({ page: 1, pageSize: 8 }),
      getSaleProducts({ page: 1, pageSize: 8 }),
      getFeaturedProducts({ page: 1, pageSize: 8 })
    ]).then(([newRes, saleRes, featRes]) => {
      if (!isMounted) return;
      if (newRes.status === 'fulfilled') {
        setNewsProducts(normalizeProducts(newRes.value).filter(p => p.isActive !== false && !p.isSecret && !p.IsSecret && !p.name?.endsWith(' [GİZLİ]')));
      }
      if (saleRes.status === 'fulfilled') {
        setSaleProducts(normalizeProducts(saleRes.value).filter(p => p.isActive !== false && !p.isSecret && !p.IsSecret && !p.name?.endsWith(' [GİZLİ]')));
      }
      if (featRes.status === 'fulfilled') {
        setFeaturedProducts(normalizeProducts(featRes.value).filter(p => p.isActive !== false && !p.isSecret && !p.IsSecret && !p.name?.endsWith(' [GİZLİ]')));
      }
    }).catch(err => console.error("Home vitrin yükleme hatası:", err));

    // Blog içeriklerini defer ederek arka planda çek
    const timer = setTimeout(() => {
      getBlogArticles()
        .then(res => {
          if (!isMounted) return;
          const list = Array.isArray(res) ? res : (res?.items || []);
          setArticles(list);
        })
        .catch(() => {});
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

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
            Siparişleriniz <strong>Yurtiçi Kargo</strong> ile hızlı ve güvenli teslim edilir.
          </span>
        </div>

        {/* 2. Alt Sıra: Kategoriler */}
        <div className={styles.categoryNavWrapper}>
          <CategoryNav />
        </div>
      </div>

      {/* ── Haberler / Yeni Gelenler ─────────────────────────── */}
      {newsProducts.length > 0 && (
        <ProductSection
          title="Yeni Gelenler"
          viewAllHref="/urunler"
          products={newsProducts}
        />
      )}

      {/* ── Satış (Sale) ─────────────────────────────────── */}
      {saleProducts.length > 0 && (
        <section className={styles.saleSection}>
          <ProductSection
            title="İndirimdekiler"
            viewAllHref="/urunler"
            products={saleProducts}
          />
        </section>
      )}

      {/* ── Öne Çıkan Ürünler (Featured) ─────────────────── */}
      {featuredProducts.length > 0 && (
        <ProductSection
          title="Öne Çıkan Ürünler"
          viewAllHref="/urunler"
          products={featuredProducts}
        />
      )}

      {/* ── Blog ─────────────────────────────────────────── */}
      <BlogSection articles={articles} />
    </main>
  );
}

