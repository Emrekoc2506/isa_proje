import { useState, useEffect } from 'react';
import styles from './HomePage.module.css';
import HeroSlider from '../../components/HeroSlider/HeroSlider';
import ProductSection from '../../components/ProductSection/ProductSection';
import BlogSection from '../../components/BlogSection/BlogSection';
import VideoBannerItem from '../../components/HeroSlider/VideoBannerItem';
import { useProducts } from '../../context/ProductContext';
import { getBlogArticles } from '../../services/blogApi';
import { blogArticles as mockArticles } from '../../data/index';

export default function HomePage() {
  const { products, slides } = useProducts();
  const [articles, setArticles] = useState(mockArticles);

  useEffect(() => {
    getBlogArticles()
      .then(data => {
        if (data && data.length > 0) setArticles(data);
      })
      .catch(() => null);
  }, []);

  const newsProducts = products.filter(p => p.isNew);
  const saleProducts = products.filter(p => p.isSale);
  const featuredProducts = products.filter(p => p.isFeatured);

  const displayNews = newsProducts.length > 0 ? newsProducts : products.slice(0, 8);
  const displaySale = saleProducts.length > 0 ? saleProducts : (products.length > 4 ? products.slice(4, 12) : products.slice(0, 8));
  const displayFeatured = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 8);

  // 1. banner HeroSlider'da gösterilir. Sonraki bannerlar SortOrder sırasıyla sayfa altında gösterilir.
  const secondaryBanners = slides.slice(1);

  return (
    <main id="main-content" className={styles.main}>
      {/* ── Hero Slider (1. Banner / Hero) ──────────────── */}
      <HeroSlider />

      {/* ── Haberler (News) ──────────────────────────────── */}
      <ProductSection
        title="Yeni Gelenler"
        viewAllHref="/urunler"
        products={displayNews}
      />

      {/* ── 2. Banner (Aşağıdaki İkinci Geniş Video/Görsel Alanı) ── */}
      {secondaryBanners.length > 0 && (
        <section style={{ maxWidth: 1280, margin: '40px auto', padding: '0 20px' }}>
          {secondaryBanners.map((s) => (
            <div key={s.id} style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', minHeight: 320, maxHeight: 450, background: '#000', marginBottom: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <VideoBannerItem slide={s} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '32px', pointerEvents: 'none' }}>
                {s.subtitle && <span style={{ color: 'var(--gold-light)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{s.subtitle}</span>}
                {s.title && <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '6px 0 12px 0' }}>{s.title}</h2>}
                {s.href && (
                  <a href={s.href} style={{ pointerEvents: 'auto', display: 'inline-block', width: 'fit-content', background: 'linear-gradient(135deg, var(--gold-light, #c9a227), #d4891a)', color: 'rgb(56, 189, 248)', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none', boxShadow: '0 4px 15px rgba(201,162,39,0.3)' }}>
                    {s.cta || 'Keşfet'} →
                  </a>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

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

