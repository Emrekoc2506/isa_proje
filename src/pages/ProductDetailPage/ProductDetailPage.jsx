import styles from './ProductDetailPage.module.css';
import { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  FiShoppingCart, FiHeart, FiCheck, FiStar,
  FiChevronLeft, FiChevronRight, FiPackage, FiTruck,
  FiShield, FiMinus, FiPlus, FiShare2, FiAward,
  FiZap, FiChevronDown, FiMessageCircle
} from 'react-icons/fi';
import { FaHeart, FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { useProducts } from '../../context/ProductContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { productDetails, defaultProductDetail } from '../../data/productDetails';
import MainLayout from '../../layouts/MainLayout/MainLayout';

/* ─── Animasyon Varyantları ──────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};
const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } }
};
const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } }
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};
const staggerItem = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
};

/* ─── Yıldız Bileşeni ────────────────────────────────────── */
function Stars({ rating, size = 14 }) {
  return (
    <span className={styles.starsRow} style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map(i => (
        <FiStar key={i} className={i <= Math.round(rating) ? styles.starOn : styles.starOff} />
      ))}
    </span>
  );
}

/* ─── Ortalama Hesapla ───────────────────────────────────── */
function avg(reviews) {
  if (!reviews?.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

/* ═══════════════════════════════════════════════════════════
   ANA COMPONENT
═══════════════════════════════════════════════════════════ */
export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  /* ─── Ürünü Bul ─────────────────────────────────────── */
  const product = products.find(p => String(p.id) === String(id));
  const detail = productDetails[id] || productDetails[Number(id)] || defaultProductDetail;

  /* ─── Benzer Ürünler (Random) ───────────────────────── */
  const relatedProducts = useMemo(() => {
    if (!products.length || !product) return [];
    const others = products.filter(p => String(p.id) !== String(id));
    // Shuffle
    const shuffled = [...others].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 8);
  }, [products, id, product]);

  /* ─── State'ler ─────────────────────────────────────── */
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  /* ─── Medya Listesi ─────────────────────────────────── */
  const mediaList = useMemo(() => {
    if (detail.media?.length) return detail.media;
    if (product) return [{ type: 'image', src: product.image, alt: product.name }];
    return [];
  }, [detail, product]);

  /* ─── Related Scroll Ref ────────────────────────────── */
  const relatedRef = useRef(null);
  const scrollRelated = (dir) => {
    if (!relatedRef.current) return;
    relatedRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  if (!product && products.length > 0) {
    navigate('/urunler', { replace: true });
    return null;
  }

  if (!product) {
    return (
      <MainLayout>
        <div className={styles.loadingScreen}>
          <div className={styles.spinner} />
          <p>Yükleniyor...</p>
        </div>
      </MainLayout>
    );
  }

  /* ─── Hesaplamalar ──────────────────────────────────── */
  const isFav = isInWishlist(product.id);
  const priceNum = parseFloat(String(product.price).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
  const oldPriceNum = product.oldPrice
    ? parseFloat(String(product.oldPrice).replace(/[^0-9.,]/g, '').replace(',', '.'))
    : null;
  const rating = avg(detail.reviews);
  const visibleReviews = showAllReviews ? detail.reviews : (detail.reviews || []).slice(0, 3);

  /* ─── Handlers ──────────────────────────────────────── */
  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) {
      addToCart({ id: product.id, name: product.name, price: product.price, image: product.image });
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2200);
  };

  const handleBuyNow = () => {
    handleAddToCart();
  };

  const handlePrev = () => setActiveImg(p => (p === 0 ? mediaList.length - 1 : p - 1));
  const handleNext = () => setActiveImg(p => (p === mediaList.length - 1 ? 0 : p + 1));

  const whatsappUrl = `https://wa.me/${detail.whatsapp || '905551234567'}?text=${encodeURIComponent(`Merhaba! ${product.name} hakkında bilgi almak istiyorum.`)}`;
  const instagramUrl = `https://www.instagram.com/${detail.instagramHandle || 'aromantra'}`;

  /* ─── Tabs ──────────────────────────────────────────── */
  const tabs = [
    { key: 'description', label: 'Açıklama' },
    { key: 'specs', label: 'Özellikler' },
    { key: 'reviews', label: `Yorumlar (${detail.reviews?.length || 0})` },
  ];

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <MainLayout>
      <div className={styles.page}>

        {/* ════ BREADCRUMB ══════════════════════════════════ */}
        <motion.nav
          className={styles.breadcrumb}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link to="/" className={styles.breadLink}>Ana Sayfa</Link>
          <FiChevronRight className={styles.breadSep} />
          <Link to="/urunler" className={styles.breadLink}>Mağaza</Link>
          <FiChevronRight className={styles.breadSep} />
          <span className={styles.breadCurrent}>{product.name}</span>
        </motion.nav>

        {/* ════ 2-SÜTUN ANA BÖLÜM ═══════════════════════════ */}
        <div className={styles.mainGrid}>

          {/* ── SOL: GALERİ ─────────────────────────────── */}
          <motion.div
            className={styles.galleryCol}
            variants={fadeLeft}
            initial="hidden"
            animate="visible"
          >
            {/* Ana Görsel Kutusu */}
            <div
              className={`${styles.mainFrame} ${isZoomed ? styles.zoomed : ''}`}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
            >
              {/* Badge'ler */}
              <div className={styles.frameBadges}>
                {product.isNew && <span className={`${styles.badge} ${styles.bNew}`}>YENİ</span>}
                {product.isSale && product.discount && (
                  <span className={`${styles.badge} ${styles.bSale}`}>{product.discount}</span>
                )}
              </div>

              {/* Favori (galeri üstünde) */}
              <motion.button
                className={`${styles.favOverlay} ${isFav ? styles.favOn : ''}`}
                onClick={() => toggleWishlist({ id: product.id, name: product.name, price: product.price, image: product.image })}
                whileTap={{ scale: 0.85 }}
                aria-label="Favorilere ekle"
              >
                {isFav ? <FaHeart /> : <FiHeart />}
              </motion.button>

              {/* Görsel / Video */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImg}
                  className={styles.mediaInner}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.03 }}
                  transition={{ duration: 0.35 }}
                >
                  {mediaList[activeImg]?.type === 'video' ? (
                    <video
                      src={mediaList[activeImg].src}
                      className={styles.mainVideo}
                      autoPlay muted loop playsInline
                    />
                  ) : (
                    <img
                      src={mediaList[activeImg]?.src || product.image}
                      alt={mediaList[activeImg]?.alt || product.name}
                      className={styles.mainImg}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigasyon Okları */}
              {mediaList.length > 1 && (
                <>
                  <button className={`${styles.navBtn} ${styles.navLeft}`} onClick={handlePrev} aria-label="Önceki">
                    <FiChevronLeft />
                  </button>
                  <button className={`${styles.navBtn} ${styles.navRight}`} onClick={handleNext} aria-label="Sonraki">
                    <FiChevronRight />
                  </button>
                </>
              )}

              {/* Dot Göstergeler */}
              {mediaList.length > 1 && (
                <div className={styles.dots}>
                  {mediaList.map((_, i) => (
                    <button
                      key={i}
                      className={`${styles.dot} ${i === activeImg ? styles.dotActive : ''}`}
                      onClick={() => setActiveImg(i)}
                      aria-label={`Görsel ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail'lar */}
            {mediaList.length > 1 && (
              <div className={styles.thumbRow}>
                {mediaList.map((m, i) => (
                  <motion.button
                    key={i}
                    className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ''}`}
                    onClick={() => setActiveImg(i)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={`Görsel ${i + 1}`}
                  >
                    {m.type === 'video'
                      ? <span className={styles.thumbPlay}>▶</span>
                      : <img src={m.src} alt={m.alt} loading="lazy" />
                    }
                  </motion.button>
                ))}
              </div>
            )}

            {/* Paylaş Butonu */}
            <button
              className={styles.shareBtn}
              onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}
              aria-label="Paylaş"
            >
              <FiShare2 /> <span>Paylaş</span>
            </button>
          </motion.div>

          {/* ── SAĞ: ÜRÜN BİLGİLERİ ─────────────────────── */}
          <motion.div
            className={styles.infoCol}
            variants={fadeRight}
            initial="hidden"
            animate="visible"
          >
            {/* Ürün Adı */}
            <h1 className={styles.productTitle}>{product.name}</h1>
            <div className={styles.titleAccent} />

            {/* Rating Satırı */}
            {detail.reviews?.length > 0 && (
              <div className={styles.ratingRow}>
                <Stars rating={rating} size={15} />
                <span className={styles.ratingNum}>{rating.toFixed(1)}</span>
                <span className={styles.ratingCount}>({detail.reviews.length} değerlendirme)</span>
                <button className={styles.ratingLink} onClick={() => setActiveTab('reviews')}>
                  Yorumları gör →
                </button>
              </div>
            )}

            {/* Fiyat Bloğu */}
            <div className={styles.priceBlock}>
              {oldPriceNum && (
                <div className={styles.oldPriceRow}>
                  <span className={styles.oldPrice}>{product.oldPrice}</span>
                  {product.discount && (
                    <span className={styles.discountBadge}>{product.discount}</span>
                  )}
                </div>
              )}
              <div className={styles.currentPrice}>
                {product.price}
                {product.unit && <span className={styles.priceUnit}>/ {product.unit}</span>}
              </div>
              {oldPriceNum && priceNum > 0 && (
                  <p className={styles.savingLine}>
                    💰 {Math.round(oldPriceNum - priceNum).toLocaleString('tr-TR')} ₺ tasarruf ediyorsunuz
                  </p>
              )}
            </div>

            <div className={styles.hr} />

            {/* Öne Çıkanlar */}
            {detail.highlights?.length > 0 && (
              <motion.ul
                className={styles.highlights}
                variants={stagger}
                initial="hidden"
                animate="visible"
              >
                {detail.highlights.map((h, i) => (
                  <motion.li key={i} className={styles.highlightItem} variants={staggerItem}>
                    {h}
                  </motion.li>
                ))}
              </motion.ul>
            )}

            <div className={styles.hr} />

            {/* Miktar Seçici */}
            <div className={styles.qtyRow}>
              <span className={styles.qtyLabel}>Miktar</span>
              <div className={styles.qtyBox}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  aria-label="Azalt"
                >
                  <FiMinus />
                </button>
                <span className={styles.qtyVal}>{qty}</span>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQty(q => q + 1)}
                  aria-label="Artır"
                >
                  <FiPlus />
                </button>
              </div>
              <span className={styles.stockLabel}>
                <FiZap className={styles.stockIcon} /> Stokta Mevcut
              </span>
            </div>

            {/* CTA Butonları */}
            <div className={styles.ctaGroup}>
              <motion.button
                className={`${styles.cartBtn} ${addedToCart ? styles.cartAdded : ''}`}
                onClick={handleAddToCart}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: addedToCart ? 1 : 1.02 }}
              >
                <AnimatePresence mode="wait">
                  {addedToCart ? (
                    <motion.span key="ok"
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <FiCheck /> Sepete Eklendi!
                    </motion.span>
                  ) : (
                    <motion.span key="add"
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <FiShoppingCart /> Sepete Ekle
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <motion.button
                className={styles.buyBtn}
                onClick={handleBuyNow}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
              >
                ✨ Hemen Satın Al
              </motion.button>

              <motion.button
                className={`${styles.wishBtn} ${isFav ? styles.wishOn : ''}`}
                onClick={() => toggleWishlist({ id: product.id, name: product.name, price: product.price, image: product.image })}
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.1 }}
                aria-label={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
              >
                {isFav ? <FaHeart /> : <FiHeart />}
              </motion.button>
            </div>

            {/* İletişim Kanalları */}
            <div className={styles.contactBox}>
              <p className={styles.contactLabel}>
                <FiMessageCircle /> Soru sormak için
              </p>
              <div className={styles.contactBtns}>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className={`${styles.contactBtn} ${styles.waBtnC}`}>
                  <FaWhatsapp /> WhatsApp
                </a>
                <a href={instagramUrl} target="_blank" rel="noreferrer" className={`${styles.contactBtn} ${styles.igBtnC}`}>
                  <FaInstagram /> Instagram
                </a>
              </div>
            </div>

            {/* Güven Rozetleri */}
            <div className={styles.trustGrid}>
              <div className={styles.trustItem}>
                <FiTruck className={styles.trustIcon} />
                <div>
                  <b>Ücretsiz Kargo</b>
                  <span>500₺ üzeri siparişlerde</span>
                </div>
              </div>
              <div className={styles.trustItem}>
                <FiShield className={styles.trustIcon} />
                <div>
                  <b>Güvenli Ödeme</b>
                  <span>SSL şifreleme</span>
                </div>
              </div>
              <div className={styles.trustItem}>
                <FiPackage className={styles.trustIcon} />
                <div>
                  <b>Kolay İade</b>
                  <span>30 gün iade hakkı</span>
                </div>
              </div>
              <div className={styles.trustItem}>
                <FiAward className={styles.trustIcon} />
                <div>
                  <b>2 Yıl Garanti</b>
                  <span>Tüm ürünlerde</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ════ TAB SİSTEMİ ═════════════════════════════════ */}
        <motion.section
          className={styles.tabSection}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          id="reviews"
        >
          {/* Tab Başlıkları */}
          <div className={styles.tabBar}>
            {tabs.map(t => (
              <button
                key={t.key}
                className={`${styles.tabBtn} ${activeTab === t.key ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(t.key)}
                role="tab"
                aria-selected={activeTab === t.key}
              >
                {t.label}
                {activeTab === t.key && (
                  <motion.div className={styles.tabIndicator} layoutId="tabIndicator" />
                )}
              </button>
            ))}
          </div>

          {/* Tab İçeriği */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className={styles.tabContent}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.28 }}
            >

              {/* ── Açıklama ─────────────────────────────── */}
              {activeTab === 'description' && (
                <div className={styles.descWrap}>
                  {(detail.description || '').split('\n\n').map((para, i) => (
                    <p key={i} className={styles.descPara}>{para}</p>
                  ))}

                  {/* Feature Icon Grid */}
                  {detail.features?.length > 0 && (
                    <motion.div
                      className={styles.featureGrid}
                      variants={stagger}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                    >
                      {detail.features.map((f, i) => (
                        <motion.div key={i} className={styles.featureCard} variants={staggerItem}>
                          <span className={styles.featureIcon}>{f.icon}</span>
                          <b className={styles.featureTitle}>{f.title}</b>
                          <p className={styles.featureText}>{f.text}</p>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              )}

              {/* ── Özellikler ───────────────────────────── */}
              {activeTab === 'specs' && (
                <div className={styles.specsWrap}>
                  {detail.specs?.length > 0 ? (
                    <table className={styles.specsTable}>
                      <tbody>
                        {detail.specs.map((s, i) => (
                          <tr key={i} className={styles.specRow}>
                            <td className={styles.specKey}>{s.label}</td>
                            <td className={styles.specVal}>{s.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className={styles.emptyMsg}>Özellik bilgisi yakında eklenecek.</p>
                  )}
                </div>
              )}

              {/* ── Yorumlar ─────────────────────────────── */}
              {activeTab === 'reviews' && (
                <div className={styles.reviewsWrap}>
                  {detail.reviews?.length > 0 ? (
                    <>
                      {/* Özet */}
                      <div className={styles.reviewSummary}>
                        <div className={styles.avgBlock}>
                          <span className={styles.avgNum}>{rating.toFixed(1)}</span>
                          <Stars rating={rating} size={22} />
                          <span className={styles.avgSub}>{detail.reviews.length} değerlendirme</span>
                        </div>
                        <div className={styles.barChart}>
                          {[5, 4, 3, 2, 1].map(star => {
                            const cnt = detail.reviews.filter(r => r.rating === star).length;
                            const pct = (cnt / detail.reviews.length) * 100;
                            return (
                              <div key={star} className={styles.barRow}>
                                <span className={styles.barLabel}>{star} ⭐</span>
                                <div className={styles.barTrack}>
                                  <motion.div
                                    className={styles.barFill}
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${pct}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.7, ease: 'easeOut' }}
                                  />
                                </div>
                                <span className={styles.barCnt}>{cnt}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Yorum Kartları */}
                      <motion.div
                        className={styles.reviewList}
                        variants={stagger}
                        initial="hidden"
                        animate="visible"
                      >
                        {visibleReviews.map(rv => (
                          <motion.div key={rv.id} className={styles.reviewCard} variants={staggerItem}>
                            <div className={styles.rvHeader}>
                              <div className={styles.rvAvatar}>{rv.avatar}</div>
                              <div className={styles.rvMeta}>
                                <span className={styles.rvName}>{rv.name}</span>
                                <Stars rating={rv.rating} size={12} />
                              </div>
                              <span className={styles.rvDate}>{rv.date}</span>
                            </div>
                            <p className={styles.rvText}>{rv.text}</p>
                          </motion.div>
                        ))}
                      </motion.div>

                      {detail.reviews.length > 3 && (
                        <button
                          className={styles.showMoreBtn}
                          onClick={() => setShowAllReviews(v => !v)}
                        >
                          {showAllReviews ? 'Daha az göster' : `Tümünü gör (${detail.reviews.length})`}
                          <FiChevronDown className={showAllReviews ? styles.chevUp : ''} />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className={styles.noReview}>
                      <span className={styles.noReviewIcon}>💬</span>
                      <p>Henüz yorum yok. İlk değerlendirmeyi siz yapın!</p>
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </motion.section>

        {/* ════ BENZERÜRÜNLer ════════════════════════════════ */}
        {relatedProducts.length > 0 && (
          <motion.section
            className={styles.relatedSection}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <div className={styles.relatedHeader}>
              <h2 className={styles.relatedTitle}>
                <span className={styles.relatedTitleAccent}>✦</span>
                Bunları da Beğenebilirsiniz
                <span className={styles.relatedTitleAccent}>✦</span>
              </h2>
              <div className={styles.relatedNav}>
                <button className={styles.relNavBtn} onClick={() => scrollRelated(-1)} aria-label="Sola kaydır">
                  <FiChevronLeft />
                </button>
                <button className={styles.relNavBtn} onClick={() => scrollRelated(1)} aria-label="Sağa kaydır">
                  <FiChevronRight />
                </button>
              </div>
            </div>

            <div className={styles.relatedTrack} ref={relatedRef}>
              {relatedProducts.map((rp, i) => (
                <RelatedCard key={rp.id || i} product={rp} navigate={navigate} addToCart={addToCart} />
              ))}
            </div>
          </motion.section>
        )}

      </div>
    </MainLayout>
  );
}

/* ─── Benzer Ürün Kartı ──────────────────────────────────── */
function RelatedCard({ product, navigate, addToCart }) {
  const [added, setAdded] = useState(false);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isFav = isInWishlist(product.id);

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.image });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <motion.div
      className={styles.relCard}
      onClick={() => navigate(`/urun/${product.id}`)}
      whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(0,0,0,0.55), 0 0 24px rgba(201,162,39,0.15)' }}
      transition={{ duration: 0.25 }}
    >
      <div className={styles.relImgWrap}>
        {product.isNew && <span className={styles.relBadgeNew}>YENİ</span>}
        {product.isSale && product.discount && (
          <span className={styles.relBadgeSale}>{product.discount}</span>
        )}
        <button
          className={`${styles.relFav} ${isFav ? styles.relFavOn : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
          aria-label="Favorilere ekle"
        >
          {isFav ? <FaHeart /> : <FiHeart />}
        </button>
        <img src={product.image} alt={product.name} loading="lazy" className={styles.relImg} />
      </div>
      <div className={styles.relInfo}>
        <p className={styles.relName}>{product.name}</p>
        <div className={styles.relPriceRow}>
          {product.oldPrice && <span className={styles.relOldPrice}>{product.oldPrice}</span>}
          <span className={styles.relPrice}>{product.price}</span>
        </div>
        <button
          className={`${styles.relCartBtn} ${added ? styles.relCartAdded : ''}`}
          onClick={handleAdd}
        >
          {added ? <><FiCheck /> Eklendi</> : <><FiShoppingCart /> Sepete Ekle</>}
        </button>
      </div>
    </motion.div>
  );
}
