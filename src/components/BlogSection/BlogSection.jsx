import styles from './BlogSection.module.css';
import { motion } from 'framer-motion';
import ArticleCard from '../ArticleCard/ArticleCard';
import { staggerContainer, staggerItem } from '../../animations/variants';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export default function BlogSection({ articles = [] }) {
  const sectionRef = useScrollReveal();

  return (
    <section className={styles.section} ref={sectionRef}>
      <div className={styles.inner}>
        {/* ── Başlık ─────────────────────────────────────── */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.titleDecor} aria-hidden="true" />
            <h2 className={styles.title}>Blog</h2>
            <div className={styles.titleDecor} aria-hidden="true" />
          </div>
          <a href="#blog" className={styles.viewAll}>
            Tüm Makaleleri Gör
            <span>›</span>
          </a>
        </div>

        {/* ── Makale Grid ─────────────────────────────────── */}
        <motion.div
          className={styles.grid}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
        >
          {articles.map((article) => (
            <motion.div key={article.id} variants={staggerItem}>
              <ArticleCard article={article} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
