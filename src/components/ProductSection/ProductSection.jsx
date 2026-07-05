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
          className={`${styles.scrollBtn} ${styles.scrollPrev}`}
          onClick={() => scroll(-1)}
          aria-label="Sola kaydır"
        >
          <FiChevronLeft />
        </button>

        {/* Kaydırılabilir Liste */}
        <motion.div
          className={styles.list}
          ref={scrollRef}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {products.map((product) => (
            <motion.div
              key={product.id}
              className={styles.cardWrapper}
              variants={staggerItem}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>

        {/* Sağ Ok */}
        <button
          className={`${styles.scrollBtn} ${styles.scrollNext}`}
          onClick={() => scroll(1)}
          aria-label="Sağa kaydır"
        >
          <FiChevronRight />
        </button>
      </div>
    </section>
  );
}
