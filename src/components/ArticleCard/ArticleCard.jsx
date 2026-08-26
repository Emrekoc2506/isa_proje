import styles from './ArticleCard.module.css';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cardHover } from '../../animations/variants';

export default function ArticleCard({ article, onClick }) {
  const navigate = useNavigate();
  if (!article) return null;

  const { title, date, description, summary, image, readTime, category, slug, id } = article;
  const targetSlug = slug || id;

  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) {
      onClick(article);
    } else if (targetSlug) {
      navigate(`/blog?article=${encodeURIComponent(targetSlug)}`, { state: { article } });
    } else {
      navigate('/blog');
    }
  };

  return (
    <motion.article
      className={styles.card}
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      {/* ── Görsel ─────────────────────────────────────────── */}
      <div className={styles.imgWrapper}>
        <img
          src={image || '/placeholder.png'}
          alt={title || 'Blog görseli'}
          className={styles.img}
          loading="lazy"
          decoding="async"
          width="600"
          height="400"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith('/placeholder.png')) e.currentTarget.src = '/placeholder.png';
          }}
        />
        <div className={styles.imgOverlay} />
        {category && <span className={styles.category}>{category}</span>}
      </div>

      {/* ── İçerik ─────────────────────────────────────────── */}
      <div className={styles.content}>
        <div className={styles.meta}>
          {date && <time className={styles.date} dateTime={date}>{date}</time>}
          {readTime && <span className={styles.readTime}>· {readTime}</span>}
        </div>

        <h3 className={styles.title}>{title}</h3>

        <p className={styles.description}>{description || summary}</p>

        <span className={styles.readMore}>
          Devamını oku
          <span className={styles.readMoreArrow}>→</span>
        </span>
      </div>
    </motion.article>
  );
}
