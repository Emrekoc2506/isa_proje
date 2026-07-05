import styles from './ArticleCard.module.css';
import { motion } from 'framer-motion';
import { cardHover } from '../../animations/variants';

export default function ArticleCard({ article }) {
  const { title, date, description, image, readTime, category, slug } = article;
  const href = `#${slug}`;

  return (
    <motion.article
      className={styles.card}
      variants={cardHover}
      initial="rest"
      whileHover="hover"
    >
      {/* ── Görsel ─────────────────────────────────────────── */}
      <a href={href} className={styles.imgWrapper} tabIndex={-1} aria-hidden="true">
        <img
          src={image}
          alt={title}
          className={styles.img}
          loading="lazy"
          onError={(e) => {
            e.target.src = `https://picsum.photos/seed/${slug}/600/400`;
          }}
        />
        <div className={styles.imgOverlay} />
        {category && <span className={styles.category}>{category}</span>}
      </a>

      {/* ── İçerik ─────────────────────────────────────────── */}
      <div className={styles.content}>
        <div className={styles.meta}>
          <time className={styles.date} dateTime={date}>{date}</time>
          {readTime && <span className={styles.readTime}>· {readTime}</span>}
        </div>

        <a href={href} className={styles.titleLink}>
          <h3 className={styles.title}>{title}</h3>
        </a>

        <p className={styles.description}>{description}</p>

        <a href={href} className={styles.readMore}>
          Devamını oku
          <span className={styles.readMoreArrow}>→</span>
        </a>
      </div>
    </motion.article>
  );
}
