import styles from './BlogSection.module.css';
import { motion } from 'framer-motion';
import ArticleCard from '../ArticleCard/ArticleCard';
import { staggerContainer, staggerItem } from '../../animations/variants';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export default function BlogSection({ articles = [] }) {
  const sectionRef = useScrollReveal();

  if (!articles || articles.length === 0) return null;

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
          <a href="/blog" className={styles.viewAll}>
            Tüm Makaleleri Gör
            <span>›</span>
          </a>
        </div>

        {/* ── Makale Grid ─────────────────────────────────── */}
        <div className={styles.grid}>
          {articles.map((article) => (
            <div key={article.id}>
              <ArticleCard article={article} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
