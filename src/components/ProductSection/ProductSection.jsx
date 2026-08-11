import styles from './ProductSection.module.css';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import ProductCard from '../ProductCard/ProductCard';
import { staggerContainer, staggerItem } from '../../animations/variants';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export default function ProductSection({ title, viewAllHref = '#', products = [] }) {
  const scrollRef = useRef(null);
  const sectionRef = useScrollReveal();

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  return (
    <section className={styles.section} ref={sectionRef}>
      {/* ── Başlık ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.titleDecor} aria-hidden="true" />
          <h3 className={styles.title}>{title}</h3>
          <div className={styles.titleDecor} aria-hidden="true" />
        </div>

        <a href={viewAllHref} className={styles.viewAll}>
          Tümünü Gör
          <span className={styles.viewAllArrow}>›</span>
        </a>
      </div>

      {/* ── Ürün Listesi ───────────────────────────────────── */}
      <div className={styles.track}>
        {/* Sol Ok */}
        <button
          type="button"
          className={`${styles.scrollBtn} ${styles.scrollPrev}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); scroll(-1); }}
          aria-label="Sola kaydır"
        >
          <FiChevronLeft />
        </button>

        {/* Kaydırılabilir Liste */}
        <div
          className={styles.list}
          ref={scrollRef}
        >
          {products.map((product) => (
            <div
              key={product.id || product.databaseId || product.name}
              className={styles.cardWrapper}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Sağ Ok */}
        <button
          type="button"
          className={`${styles.scrollBtn} ${styles.scrollNext}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); scroll(1); }}
          aria-label="Sağa kaydır"
        >
          <FiChevronRight />
        </button>
      </div>
    </section>
  );
}
