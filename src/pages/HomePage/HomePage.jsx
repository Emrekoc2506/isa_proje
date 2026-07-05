import styles from './HomePage.module.css';
import HeroSlider from '../../components/HeroSlider/HeroSlider';
import ProductSection from '../../components/ProductSection/ProductSection';
import BlogSection from '../../components/BlogSection/BlogSection';
import { useProducts } from '../../context/ProductContext';
import { blogArticles } from '../../data/index';

export default function HomePage() {
  const { products } = useProducts();

  const newsProducts = products.filter(p => p.isNew);
  const saleProducts = products.filter(p => p.isSale);
  const featuredProducts = products.filter(p => p.isFeatured);

  return (
    <main id="main-content" className={styles.main}>
      {/* ── Hero Slider ─────────────────────────────────── */}
      <HeroSlider />

      {/* ── Haberler (News) ──────────────────────────────── */}
      <ProductSection
        title="Yeni Gelenler"
        viewAllHref="/urunler"
        products={newsProducts}
      />

      {/* ── Satış (Sale) ─────────────────────────────────── */}
      <section className={styles.saleSection}>
        <ProductSection
          title="İndirimdekiler"
          viewAllHref="/urunler"
          products={saleProducts}
        />
      </section>

      {/* ── Öne Çıkan Ürünler (Featured) ─────────────────── */}
      <ProductSection
        title="Öne Çıkan Ürünler"
        viewAllHref="/urunler"
        products={featuredProducts}
      />

      {/* ── Blog ─────────────────────────────────────────── */}
      <BlogSection articles={blogArticles} />
    </main>
  );
}
