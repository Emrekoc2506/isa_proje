import { useState, useEffect, useRef } from 'react';
import styles from './HomePage.module.css';
import HeroSlider from '../../components/HeroSlider/HeroSlider';
import ProductSection from '../../components/ProductSection/ProductSection';
import BlogSection from '../../components/BlogSection/BlogSection';
import CategoryNav from '../../components/CategoryNav/CategoryNav';
import SEO from '../../components/SEO/SEO';
import { MdOutlineLocalShipping } from 'react-icons/md';
import { normalizeProducts } from '../../context/ProductContext';
import { getBlogArticles } from '../../services/blogApi';
import { getHomeBootstrap } from '../../services/homeApi';
import { useProducts } from '../../context/ProductContext';

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
  const { hydrateHomeData } = useProducts();
  const [articles, setArticles] = useState([]);
  const [newsProducts, setNewsProducts] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const blogSectionRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    // Ana sayfa vitrinlerini tek bootstrap isteğiyle yükle.
    getHomeBootstrap().then(response => {
      if (!isMounted) return;
      if (typeof hydrateHomeData === 'function') hydrateHomeData(response);
      const visible = products => normalizeProducts(products || [])
        .filter(p => p.isActive !== false && !p.isSecret && !p.IsSecret && !p.name?.endsWith(' [GİZLİ]'));
      setNewsProducts(visible(response?.newProducts));
      setSaleProducts(visible(response?.saleProducts));
      setFeaturedProducts(visible(response?.featuredProducts));
    }).catch(err => console.error('Home vitrin yükleme hatası:', err));

    // Blog, viewport'a yaklaşınca yüklenir; ilk LCP ile yarışmaz (ana sayfa için tam 3 makale çekilir).
    let blogTimer;
    let observer;
    let blogLoaded = false;
    const loadBlog = () => {
      if (blogLoaded) return;
      blogLoaded = true;
      getBlogArticles({ page: 1, pageSize: 3 })
        .then(res => {
          if (!isMounted) return;
          const list = Array.isArray(res) ? res : (res?.items || []);
          setArticles(list.slice(0, 3));
        })
        .catch(() => {});
    };

    if (typeof IntersectionObserver !== 'undefined' && blogSectionRef.current) {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          loadBlog();
          observer.disconnect();
        }
      }, { rootMargin: '250px 0px' });
      observer.observe(blogSectionRef.current);
    } else {
      blogTimer = setTimeout(loadBlog, 2500);
    }

    return () => {
      isMounted = false;
      clearTimeout(blogTimer);
      observer?.disconnect();
    };
  }, [hydrateHomeData]);

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
      <div ref={blogSectionRef}>
        <BlogSection articles={articles} />
      </div>
    </main>
  );
}

