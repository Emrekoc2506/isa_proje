import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { getBlogArticles } from '../../services/blogApi';
import styles from './BlogPage.module.css';
import {
  FiSearch, FiClock, FiCalendar, FiArrowRight, FiX, FiBookOpen, FiGrid, FiList
} from 'react-icons/fi';

const CATEGORIES = ['Tümü', 'Doğal Taşlar', 'Kristaller & Meditasyon', 'Kristaller & Ritüeller', 'Bakım & Arınma', 'Rehber', 'Genel'];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  })
};

const heroVariants = {
  hidden: { opacity: 0, y: -30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
};

function ArticleSkeleton() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonImg} />
      <div className={styles.skeletonBody}>
        <div className={styles.skeletonBadge} />
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonLine} />
        <div className={styles.skeletonLine} style={{ width: '70%' }} />
      </div>
    </div>
  );
}

function ArticleModal({ article, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  if (!article) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.modalBackdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.92, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 40 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className={styles.modalClose} onClick={onClose} aria-label="Kapat">
            <FiX />
          </button>

          {article.image && (
            <div className={styles.modalHero}>
              <img src={article.image} alt={article.title} className={styles.modalHeroImg} />
              <div className={styles.modalHeroOverlay} />
              {article.category && (
                <span className={styles.modalCategoryBadge}>{article.category}</span>
              )}
            </div>
          )}

          <div className={styles.modalContent}>
            <div className={styles.modalMeta}>
              {article.date && (
                <span className={styles.modalMetaItem}>
                  <FiCalendar size={13} /> {article.date}
                </span>
              )}
              {article.readTime && (
                <span className={styles.modalMetaItem}>
                  <FiClock size={13} /> {article.readTime}
                </span>
              )}
            </div>

            <h1 className={styles.modalTitle}>{article.title}</h1>

            {article.summary && (
              <p className={styles.modalSummary}>{article.summary}</p>
            )}

            {article.content && (
              <div
                className={styles.modalBody}
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ArticleCard({ article, index, view, onClick }) {
  const isGrid = view === 'grid';
  return (
    <motion.article
      className={isGrid ? styles.card : styles.cardList}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: isGrid ? -6 : -2, transition: { duration: 0.25 } }}
      onClick={() => onClick(article)}
    >
      <div className={isGrid ? styles.cardImgWrapper : styles.cardListImgWrapper}>
        <img
          src={article.image || `https://picsum.photos/seed/${article.slug || article.id}/700/400`}
          alt={article.title}
          className={styles.cardImg}
          loading="lazy"
          onError={(e) => {
            e.target.src = `https://picsum.photos/seed/${article.id || 'blog'}/700/400`;
          }}
        />
        <div className={styles.cardImgOverlay} />
        {article.category && (
          <span className={styles.cardCategory}>{article.category}</span>
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          {article.date && (
            <span className={styles.cardMetaItem}>
              <FiCalendar size={12} /> {article.date}
            </span>
          )}
          {article.readTime && (
            <span className={styles.cardMetaItem}>
              <FiClock size={12} /> {article.readTime}
            </span>
          )}
        </div>

        <h2 className={styles.cardTitle}>{article.title}</h2>
        <p className={styles.cardDesc}>{article.summary || article.description}</p>

        <button className={styles.cardReadMore} aria-label={`${article.title} - Devamını oku`}>
          <span>Devamını oku</span>
          <FiArrowRight className={styles.cardArrow} />
        </button>
      </div>
    </motion.article>
  );
}

export default function BlogPage() {
  const [articles, setArticles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [view, setView] = useState('grid');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getBlogArticles({ page: 1, pageSize: 50 });
        // getBlogArticles artık { items, totalCount, page, pageSize } döndürüyor
        const list = Array.isArray(res) ? res : (res?.items || []);
        setArticles(list);
        setTotalCount(res?.totalCount || list.length);
      } catch {
        setArticles([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = articles.filter((a) => {
    const matchCat = activeCategory === 'Tümü' || a.category === activeCategory;
    const matchSearch = !search || (
      (a.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.summary || a.description || '').toLowerCase().includes(search.toLowerCase())
    );
    return matchCat && matchSearch;
  });

  const featuredArticle = filtered[0] || null;
  const restArticles = filtered.slice(1);

  return (
    <>
      <Helmet>
        <title>Blog — MysticVelora</title>
        <meta name="description" content="Doğal taşlar, kristaller, meditasyon ve enerji ritüelleri hakkında uzman makaleler ve rehberler." />
      </Helmet>

      <div className={styles.page}>

        {/* ── Hero Banner ────────────────────────────────── */}
        <motion.section
          className={styles.hero}
          variants={heroVariants}
          initial="hidden"
          animate="visible"
        >
          <div className={styles.heroParticles} aria-hidden="true">
            {[...Array(20)].map((_, i) => (
              <span key={i} className={styles.particle} style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${4 + Math.random() * 6}s`,
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
              }} />
            ))}
          </div>

          <div className={styles.heroContent}>
            <motion.div
              className={styles.heroIconWrapper}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <FiBookOpen className={styles.heroIcon} />
            </motion.div>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleGold}>Mistik</span> Blog
            </h1>
            <p className={styles.heroSubtitle}>
              Doğal taşlar, kristaller ve enerji ritüelleri dünyasını keşfedin
            </p>

            {/* Arama Kutusu */}
            <div className={styles.searchWrapper}>
              <FiSearch className={styles.searchIcon} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Makale ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
                id="blog-search"
                aria-label="Blog makalesi ara"
              />
              {search && (
                <button
                  className={styles.searchClear}
                  onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                  aria-label="Aramayı temizle"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
          </div>
        </motion.section>

        <div className={styles.container}>

          {/* ── Filtreler ──────────────────────────────────── */}
          <div className={styles.toolbar}>
            <div className={styles.categories} role="list" aria-label="Blog kategorileri">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  role="listitem"
                  className={`${styles.catBtn} ${activeCategory === cat ? styles.catBtnActive : ''}`}
                  onClick={() => setActiveCategory(cat)}
                  aria-pressed={activeCategory === cat}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className={styles.viewToggle} aria-label="Görünüm seçimi">
              <button
                className={`${styles.viewBtn} ${view === 'grid' ? styles.viewBtnActive : ''}`}
                onClick={() => setView('grid')}
                aria-label="Izgara görünüm"
              >
                <FiGrid size={16} />
              </button>
              <button
                className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`}
                onClick={() => setView('list')}
                aria-label="Liste görünüm"
              >
                <FiList size={16} />
              </button>
            </div>
          </div>

          {/* ── Yükleniyor ────────────────────────────────── */}
          {loading && (
            <div className={styles.skeletonGrid}>
              {[...Array(6)].map((_, i) => <ArticleSkeleton key={i} />)}
            </div>
          )}

          {/* ── Makale Yok ────────────────────────────────── */}
          {!loading && filtered.length === 0 && (
            <motion.div
              className={styles.empty}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <span className={styles.emptyIcon}>✦</span>
              <h3 className={styles.emptyTitle}>Makale bulunamadı</h3>
              <p className={styles.emptyDesc}>
                {search ? `"${search}" için sonuç yok.` : 'Bu kategoride henüz makale eklenmemiş.'}
              </p>
              <button className={styles.emptyReset} onClick={() => { setSearch(''); setActiveCategory('Tümü'); }}>
                Filtreleri Temizle
              </button>
            </motion.div>
          )}

          {/* ── Öne Çıkan Makale ──────────────────────────── */}
          {!loading && featuredArticle && view === 'grid' && (
            <motion.article
              className={styles.featured}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              onClick={() => setSelectedArticle(featuredArticle)}
              whileHover={{ y: -4, transition: { duration: 0.25 } }}
            >
              <div className={styles.featuredImgWrapper}>
                <img
                  src={featuredArticle.image || `https://picsum.photos/seed/${featuredArticle.id}/1200/600`}
                  alt={featuredArticle.title}
                  className={styles.featuredImg}
                  onError={(e) => { e.target.src = `https://picsum.photos/seed/${featuredArticle.id}/1200/600`; }}
                />
                <div className={styles.featuredImgOverlay} />
                <div className={styles.featuredBadge}>✦ Öne Çıkan</div>
              </div>

              <div className={styles.featuredContent}>
                {featuredArticle.category && (
                  <span className={styles.featuredCategory}>{featuredArticle.category}</span>
                )}
                <div className={styles.featuredMeta}>
                  {featuredArticle.date && (
                    <span><FiCalendar size={13} /> {featuredArticle.date}</span>
                  )}
                  {featuredArticle.readTime && (
                    <span><FiClock size={13} /> {featuredArticle.readTime}</span>
                  )}
                </div>
                <h2 className={styles.featuredTitle}>{featuredArticle.title}</h2>
                <p className={styles.featuredDesc}>{featuredArticle.summary || featuredArticle.description}</p>
                <button className={styles.featuredBtn}>
                  Makaleyi Oku <FiArrowRight />
                </button>
              </div>
            </motion.article>
          )}

          {/* ── Makale Grid / Liste ───────────────────────── */}
          {!loading && filtered.length > 0 && (
            <div className={view === 'grid' ? styles.grid : styles.listView}>
              {(view === 'grid' ? restArticles : filtered).map((article, i) => (
                <ArticleCard
                  key={article.id || article.slug || i}
                  article={article}
                  index={i}
                  view={view}
                  onClick={setSelectedArticle}
                />
              ))}
            </div>
          )}

          {/* ── Makale Sayısı ────────────────────────────── */}
          {!loading && filtered.length > 0 && (
            <motion.p
              className={styles.count}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {filtered.length} makale gösteriliyor
            </motion.p>
          )}
        </div>
      </div>

      {/* ── Makale Modal ─────────────────────────────────── */}
      {selectedArticle && (
        <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}
    </>
  );
}
