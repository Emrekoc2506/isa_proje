import styles from './ProductDetailPage.module.css';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShoppingCart, FiHeart, FiCheck, FiStar,
  FiChevronRight, FiPackage, FiTruck,
  FiShield, FiMinus, FiPlus, FiShare2, FiAward,
  FiZap, FiChevronDown, FiMessageCircle, FiBell
} from 'react-icons/fi';
import { FaHeart, FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { useProducts } from '../../context/ProductContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { getProductById, getProductBySlug, getProductReviews, createProductReview } from '../../services/productApi';
import MainLayout from '../../layouts/MainLayout/MainLayout';
import SEO from '../../components/SEO/SEO';
import { ProductDetailSkeleton } from '../../components/Skeleton/Skeleton';
import ProductReviews from '../../components/ProductReviews/ProductReviews';
import RecentlyViewed from '../../components/RecentlyViewed/RecentlyViewed';
import StockNotifyModal from '../../components/StockNotifyModal/StockNotifyModal';
import { addRecentlyViewed } from '../../utils/recentlyViewed';

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
  if (!reviews?.length) return 5; // Varsayılan puan
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  /* ─── API State'leri ────────────────────────────────── */
  const [productDetail, setProductDetail] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [stockModalOpen, setStockModalOpen] = useState(false);

  /* ─── Ürünü Bul ─────────────────────────────────────── */
  const product = products.find(p => String(p.id) === String(id) || p.slug === id);

  useEffect(() => {
    if (product) {
      addRecentlyViewed(product);
    }
  }, [product]);

  useEffect(() => {
    async function fetchDetail() {
      try {
        setLoadingDetail(true);
        // id Guid mi kontrol et
        const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
        let detailData = null;
        
        if (isGuid) {
          detailData = await getProductById(id).catch(() => null);
        } else {
          detailData = await getProductBySlug(id).catch(() => null);
        }

        if (detailData) {
          setProductDetail(detailData);
          addRecentlyViewed(detailData);
          const reviewsData = await getProductReviews(detailData.id).catch(() => []);
          setReviews(reviewsData || []);
        } else if (product) {
          setProductDetail(product);
        }
      } catch (err) {
        console.error("Detay yükleme hatası:", err);
        if (product) {
          setProductDetail(product);
        }
      } finally {
        setLoadingDetail(false);
      }
    }
    fetchDetail();
  }, [id, product]);

  /* ─── Benzer Ürünler (Random) ───────────────────────── */
  const relatedProducts = useMemo(() => {
    if (!products.length || !productDetail) return [];
    const others = products.filter(p => String(p.id) !== String(productDetail.id) && p.isActive !== false);
    const shuffled = [...others].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 8);
  }, [products, productDetail]);

  /* ─── State'ler ─────────────────────────────────────── */
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(null);

  // Auto-select first variant on load if exists
  useEffect(() => {
    if (productDetail?.variants?.length > 0) {
      setSelectedVariantId(productDetail.variants[0].id);
    } else {
      setSelectedVariantId(null);
    }
  }, [productDetail]);

  const selectedVariant = useMemo(() => {
    return productDetail?.variants?.find(v => v.id === selectedVariantId) || null;
  }, [productDetail, selectedVariantId]);

  /* ─── Medya Listesi ─────────────────────────────────── */
  const mediaList = useMemo(() => {
    if (productDetail?.images?.length) {
      return productDetail.images.map(img => ({ type: 'image', src: img.url, alt: productDetail.name }));
    }
    if (productDetail?.imageUrl) {
      return [{ type: 'image', src: productDetail.imageUrl, alt: productDetail.name }];
    }
    if (product) {
      return [{ type: 'image', src: product.image, alt: product.name }];
    }
    return [];
  }, [productDetail, product]);

  /* ─── Related Scroll Ref ────────────────────────────── */
  const relatedRef = useRef(null);
  const scrollRelated = (dir) => {
    if (!relatedRef.current) return;
    relatedRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  if (loadingDetail) {
    return (
      <MainLayout>
        <div className={styles.loadingScreen}>
          <div className={styles.spinner} />
          <p>Ürün detayları yükleniyor...</p>
        </div>
      </MainLayout>
    );
  }

  if (!productDetail) {
    return (
      <MainLayout>
        <div className={styles.loadingScreen}>
          <p>Ürün bulunamadı.</p>
          <Link to="/urunler" className={styles.buyBtn} style={{ marginTop: '16px', textDecoration: 'none', display: 'inline-block' }}>Mağazaya Dön</Link>
        </div>
      </MainLayout>
    );
  }

  /* ─── Hesaplamalar ──────────────────────────────────── */
  const isFav = isInWishlist(productDetail.id);
  const rating = avg(reviews);
  const visibleReviews = showAllReviews ? reviews : (reviews || []).slice(0, 3);

  /* ─── Handlers ──────────────────────────────────────── */
  const handleAddToCart = () => {
    const finalPrice = productDetail.price + (selectedVariant?.additionalPrice || 0);
    addToCart({ 
      id: productDetail.id, 
      name: productDetail.name + (selectedVariant ? ` (${selectedVariant.name})` : ''), 
      price: finalPrice + ' ₺', 
      image: productDetail.imageUrl || (productDetail.images?.[0]?.url || '') 
    }, qty, selectedVariantId);
    
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2200);
  };

  const handleBuyNow = () => {
    const finalPrice = productDetail.price + (selectedVariant?.additionalPrice || 0);
    addToCart({ 
      id: productDetail.id, 
      name: productDetail.name + (selectedVariant ? ` (${selectedVariant.name})` : ''), 
      price: finalPrice + ' ₺', 
      image: productDetail.imageUrl || (productDetail.images?.[0]?.url || '') 
    }, qty, selectedVariantId);
    
    navigate('/odeme');
  };

  const handlePrev = () => setActiveImg(p => (p === 0 ? mediaList.length - 1 : p - 1));
  const handleNext = () => setActiveImg(p => (p === mediaList.length - 1 ? 0 : p + 1));

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    try {
      await createProductReview(productDetail.id, {
        rating: reviewRating,
        comment: reviewText.trim()
      });
      alert("Yorumunuz onaylanmak üzere gönderildi.");
      setReviewText("");
      // Yorumları tekrar yükle
      const updated = await getProductReviews(productDetail.id);
      setReviews(updated || []);
    } catch (err) {
      alert(err.message || "Yorum eklenirken hata oluştu. Lütfen giriş yaptığınızdan emin olun.");
    }
  };

  const whatsappUrl = `https://wa.me/905551234567?text=${encodeURIComponent(`Merhaba! ${productDetail.name} hakkında bilgi almak istiyorum.`)}`;
  const instagramUrl = `https://www.instagram.com/mysticvelora`;

  /* ─── Tabs ──────────────────────────────────────────── */
  const tabs = [
    { key: 'description', label: 'Açıklama' },
    { key: 'specs', label: 'Özellikler' },
    { key: 'reviews', label: `Yorumlar (${reviews.length || 0})` },
  ];

  if (loadingDetail) {
    return (
      <MainLayout>
        <div className={styles.page}>
          <SEO title="Ürün Yükleniyor... | mysticvelora" />
          <ProductDetailSkeleton />
        </div>
      </MainLayout>
    );
  }

  if (!productDetail) {
    return (
      <MainLayout>
        <div className={styles.page} style={{ textAlign: 'center', padding: '120px 20px', minHeight: '60vh' }}>
          <SEO title="Ürün Bulunamadı | mysticvelora" />
          <h2 style={{ color: 'var(--gold-light)', fontSize: '32px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>Ürün Bulunamadı</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '16px' }}>Aradığınız ilan veya ürün mevcut değil ya da kaldırılmış olabilir.</p>
          <Link to="/urunler" style={{ background: 'linear-gradient(135deg, var(--gold-light), var(--gold-dark))', color: 'var(--bg-dark)', padding: '14px 28px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '15px' }}>
            Tüm İlanları / Ürünleri İncele
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO
        title={productDetail.name}
        description={productDetail.description || `${productDetail.name} özel tasarım takı ve aksesuar.`}
        image={productDetail.imageUrl || (productDetail.images?.[0]?.url || '')}
      />
      <div className={styles.page}>

        {/* ════ BREADCRUMB ══════════════════════════════════ */}
        <nav className={styles.breadcrumb}>
          <Link to="/" className={styles.breadLink}>Ana Sayfa</Link>
          <FiChevronRight className={styles.breadSep} />
          <Link to="/urunler" className={styles.breadLink}>Mağaza</Link>
          <FiChevronRight className={styles.breadSep} />
          <span className={styles.breadCurrent}>{productDetail.name}</span>
        </nav>

        {/* ════ 2-SÜTUN ANA BÖLÜM ═══════════════════════════ */}
        <div className={styles.mainGrid}>

          {/* ── SOL: GALERİ ─────────────────────────────── */}
          <div className={styles.galleryCol}>
            {/* Ana Görsel Kutusu */}
            <div
              className={`${styles.mainFrame} ${isZoomed ? styles.zoomed : ''}`}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
            >
              {/* Badge'ler */}
              <div className={styles.frameBadges}>
                {productDetail.isNew && <span className={`${styles.badge} ${styles.bNew}`}>YENİ</span>}
                {productDetail.isSale && productDetail.discount && (
                  <span className={`${styles.badge} ${styles.bSale}`}>{productDetail.discount}</span>
                )}
              </div>

              {/* Favori (galeri üstünde) */}
              <motion.button
                className={`${styles.favOverlay} ${isFav ? styles.favOn : ''}`}
                onClick={() => toggleWishlist({ 
                  id: productDetail.id, 
                  name: productDetail.name, 
                  price: productDetail.price + ' ₺', 
                  image: productDetail.imageUrl || (productDetail.images?.[0]?.url || '') 
                })}
                whileTap={{ scale: 0.85 }}
                aria-label="Favorilere ekle"
              >
                {isFav ? <FaHeart /> : <FiHeart />}
              </motion.button>

              {/* Görsel */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImg}
                  className={styles.mediaInner}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.03 }}
                  transition={{ duration: 0.35 }}
                >
                  <img
                    src={mediaList[activeImg]?.src || "https://images.unsplash.com/photo-1602928321679-560bb453f190?w=500"}
                    alt={mediaList[activeImg]?.alt || productDetail.name}
                    className={styles.mainImg}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigasyon Okları */}
              {mediaList.length > 1 && (
                <>
                  <button className={`${styles.navBtn} ${styles.navLeft}`} onClick={handlePrev} aria-label="Önceki">
                    &#10094;
                  </button>
                  <button className={`${styles.navBtn} ${styles.navRight}`} onClick={handleNext} aria-label="Sonraki">
                    &#10095;
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
                  <button
                    key={i}
                    className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ''}`}
                    onClick={() => setActiveImg(i)}
                    aria-label={`Görsel ${i + 1}`}
                  >
                    <img src={m.src} alt={m.alt} loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {/* Paylaş Butonu */}
            <button
              className={styles.shareBtn}
              onClick={() => navigator.share?.({ title: productDetail.name, url: window.location.href })}
              aria-label="Paylaş"
            >
              <FiShare2 /> <span>Paylaş</span>
            </button>
          </div>

          {/* ── SAĞ: ÜRÜN BİLGİLERİ ─────────────────────── */}
          <div className={styles.infoCol}>
            <h1 className={styles.productTitle}>{productDetail.name}</h1>
            <div className={styles.titleAccent} />

            {/* Rating Satırı */}
            <div className={styles.ratingRow}>
              <Stars rating={rating} size={15} />
              <span className={styles.ratingNum}>{rating.toFixed(1)}</span>
              <span className={styles.ratingCount}>({reviews.length} değerlendirme)</span>
              <button className={styles.ratingLink} onClick={() => setActiveTab('reviews')}>
                Yorumları gör →
              </button>
            </div>

            {/* Fiyat Bloğu */}
            <div className={styles.priceBlock}>
              {productDetail.oldPrice && (
                <div className={styles.oldPriceRow}>
                  <span className={styles.oldPrice}>{productDetail.oldPrice + (selectedVariant?.additionalPrice || 0)} ₺</span>
                  {productDetail.discount && (
                    <span className={styles.discountBadge}>{productDetail.discount}</span>
                  )}
                </div>
              )}
              <div className={styles.currentPrice}>
                {productDetail.price + (selectedVariant?.additionalPrice || 0)} ₺
                {productDetail.unit && <span className={styles.priceUnit}>/ {productDetail.unit}</span>}
              </div>
            </div>

            <div className={styles.hr} />

            {/* Kısa Açıklama */}
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {productDetail.shortDescription || "Mistik şifa enerjileri barındıran bu özel ürün, ritüellerinizde ve günlük yaşamınızda huzuru yakalamanıza yardımcı olur."}
            </p>

            {/* VARYANT SEÇİMİ */}
            {productDetail.variants?.length > 0 && (
              <>
                <div className={styles.hr} />
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Seçenekler</span>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {productDetail.variants.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => { setSelectedVariantId(v.id); setQty(1); }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          background: selectedVariantId === v.id ? 'rgba(201, 162, 39, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: selectedVariantId === v.id ? '1px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: selectedVariantId === v.id ? 'var(--gold-light)' : 'var(--text-secondary)',
                          transition: 'all 0.2s'
                        }}
                      >
                        {v.name} {v.additionalPrice > 0 ? `(+${v.additionalPrice} ₺)` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className={styles.hr} />

            {/* Miktar Seçici */}
            <div className={styles.qtyRow}>
              <span className={styles.qtyLabel}>Miktar</span>
              <div className={styles.qtyBox}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  disabled={(selectedVariant ? selectedVariant.stockQuantity : productDetail.stockQuantity) === 0}
                  aria-label="Azalt"
                >
                  <FiMinus />
                </button>
                <span className={styles.qtyVal}>{qty}</span>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQty(q => Math.min(selectedVariant ? selectedVariant.stockQuantity : productDetail.stockQuantity, q + 1))}
                  disabled={(selectedVariant ? selectedVariant.stockQuantity : productDetail.stockQuantity) === 0}
                  aria-label="Artır"
                >
                  <FiPlus />
                </button>
              </div>
              <span className={styles.stockLabel}>
                <FiZap className={styles.stockIcon} /> 
                {(selectedVariant ? selectedVariant.stockQuantity : productDetail.stockQuantity) === 0 ? (
                  <span style={{ color: '#e05594' }}>Tükendi</span>
                ) : (
                  <>Stokta Mevcut ({(selectedVariant ? selectedVariant.stockQuantity : productDetail.stockQuantity)} Adet)</>
                )}
              </span>
            </div>

            {/* CTA Butonları */}
            <div className={styles.ctaGroup}>
              <button
                className={`${styles.cartBtn} ${addedToCart ? styles.cartAdded : ''}`}
                onClick={(selectedVariant ? selectedVariant.stockQuantity : productDetail.stockQuantity) === 0 ? () => setStockModalOpen(true) : handleAddToCart}
              >
                {(selectedVariant ? selectedVariant.stockQuantity : productDetail.stockQuantity) === 0 ? (
                  <span><FiBell /> Stoka Gelince Bildir</span>
                ) : addedToCart ? (
                  <span><FiCheck /> Sepete Eklendi!</span>
                ) : (
                  <span><FiShoppingCart /> Sepete Ekle</span>
                )}
              </button>

              <button 
                className={styles.buyBtn} 
                onClick={handleBuyNow}
                disabled={(selectedVariant ? selectedVariant.stockQuantity : productDetail.stockQuantity) === 0}
                style={{
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <FiZap style={{ color: '#fff' }} /> Hızlı Öde
              </button>

              <button
                className={`${styles.wishBtn} ${isFav ? styles.wishOn : ''}`}
                onClick={() => toggleWishlist({ 
                  id: productDetail.id, 
                  name: productDetail.name, 
                  price: productDetail.price + ' ₺', 
                  image: productDetail.imageUrl || (productDetail.images?.[0]?.url || '') 
                })}
                aria-label={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
              >
                {isFav ? <FaHeart /> : <FiHeart />}
              </button>
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
            </div>
          </div>
        </div>

        {/* ════ TAB SİSTEMİ ═════════════════════════════════ */}
        <section className={styles.tabSection} id="reviews">
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
              </button>
            ))}
          </div>

          {/* Tab İçeriği */}
          <div className={styles.tabContent}>
            {/* Açıklama */}
            {activeTab === 'description' && (
              <div className={styles.descWrap}>
                {(productDetail.description || 'Bu mistik ürün hakkında açıklama bulunmamaktadır.').split('\n\n').map((para, i) => (
                  <p key={i} className={styles.descPara}>{para}</p>
                ))}
              </div>
            )}

            {/* Özellikler */}
            {activeTab === 'specs' && (
              <div className={styles.specsWrap}>
                <table className={styles.specsTable}>
                  <tbody>
                    <tr className={styles.specRow}>
                      <td className={styles.specKey}>Stok Durumu</td>
                      <td className={styles.specVal}>{productDetail.stockQuantity} Adet</td>
                    </tr>
                    <tr className={styles.specRow}>
                      <td className={styles.specKey}>Kategori</td>
                      <td className={styles.specVal}>{productDetail.categoryName || "Mistik Ürünler"}</td>
                    </tr>
                    {productDetail.subcategory && (
                      <tr className={styles.specRow}>
                        <td className={styles.specKey}>Alt Kategori</td>
                        <td className={styles.specVal}>{productDetail.subcategory}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Yorumlar */}
            {activeTab === 'reviews' && (
              <div className={styles.reviewsWrap}>
                
                {/* Yorum Yazma Formu */}
                {productDetail.hasPurchased ? (
                  <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ color: 'var(--gold-light)', marginBottom: '16px' }}>Bu Ürünü Değerlendirin</h4>
                    <form onSubmit={handleReviewSubmit}>
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ marginRight: '12px', color: 'var(--text-muted)' }}>Puanınız:</span>
                        {[1,2,3,4,5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}
                          >
                            <FiStar style={{ fill: star <= reviewRating ? 'var(--gold)' : 'none', color: 'var(--gold)' }} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        required
                        placeholder="Yorumunuzu buraya yazın..."
                        value={reviewText}
                        onChange={e => setReviewText(e.target.value)}
                        style={{
                          width: '100%',
                          height: '80px',
                          padding: '12px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                          marginBottom: '12px',
                          resize: 'none'
                        }}
                      />
                      <button type="submit" className={styles.buyBtn} style={{ padding: '8px 24px', fontSize: '14px' }}>
                        Yorumu Gönder
                      </button>
                    </form>
                  </div>
                ) : (
                  <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: 13 }}>
                    * Bu ürünü sadece satın almış olan doğrulanmış müşterilerimiz değerlendirebilir.
                  </div>
                )}

                {reviews.length > 0 ? (
                  <>
                    <div className={styles.reviewSummary}>
                      <div className={styles.avgBlock}>
                        <span className={styles.avgNum}>{rating.toFixed(1)}</span>
                        <Stars rating={rating} size={22} />
                        <span className={styles.avgSub}>{reviews.length} değerlendirme</span>
                      </div>
                    </div>

                    <div className={styles.reviewList}>
                      {visibleReviews.map(rv => (
                        <div key={rv.id} className={styles.reviewCard}>
                          <div className={styles.rvHeader}>
                            <div className={styles.rvAvatar}>
                              {rv.customerName ? rv.customerName[0].toUpperCase() : "M"}
                            </div>
                            <div className={styles.rvMeta} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className={styles.rvName} style={{ margin: 0 }}>{rv.customerName || "Müşteri"}</span>
                                {rv.isVerifiedPurchase && (
                                  <span style={{ fontSize: 10, background: 'rgba(46,204,113,0.15)', border: '1px solid #2ecc71', color: '#2ecc71', padding: '1px 6px', borderRadius: 4 }}>
                                    Satın Aldı
                                  </span>
                                )}
                              </div>
                              <Stars rating={rv.rating} size={12} />
                            </div>
                            <span className={styles.rvDate}>
                              {rv.createdAt ? new Date(rv.createdAt).toLocaleDateString('tr-TR') : ""}
                            </span>
                          </div>
                          <p className={styles.rvText}>{rv.comment}</p>
                        </div>
                      ))}
                    </div>

                    {reviews.length > 3 && (
                      <button
                        className={styles.showMoreBtn}
                        onClick={() => setShowAllReviews(v => !v)}
                      >
                        {showAllReviews ? 'Daha az göster' : `Tümünü gör (${reviews.length})`}
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
          </div>
        </section>

        {/* ════ BENZER ÜRÜNLER ════════════════════════════════ */}
        {relatedProducts.length > 0 && (
          <section className={styles.relatedSection}>
            <div className={styles.relatedHeader}>
              <h2 className={styles.relatedTitle}>
                <span className={styles.relatedTitleAccent}>✦</span>
                Bunları da Beğenebilirsiniz
                <span className={styles.relatedTitleAccent}>✦</span>
              </h2>
              <div className={styles.relatedNav}>
                <button className={styles.relNavBtn} onClick={() => scrollRelated(-1)} aria-label="Sola kaydır">
                  &#10094;
                </button>
                <button className={styles.relNavBtn} onClick={() => scrollRelated(1)} aria-label="Sağa kaydır">
                  &#10095;
                </button>
              </div>
            </div>

            <div className={styles.relatedTrack} ref={relatedRef}>
              {relatedProducts.map((rp, i) => (
                <RelatedCard key={rp.id || i} product={rp} navigate={navigate} addToCart={addToCart} />
              ))}
            </div>
          </section>
        )}

        {/* Müşteri Değerlendirmeleri (Product Reviews) */}
        <ProductReviews productId={productDetail?.id || product?.id || id} />

        {/* Son İnceledikleriniz (Recently Viewed Products) */}
        <RecentlyViewed currentProductId={productDetail?.id || product?.id || id} />

        {/* Stoka Gelince Bildir Modali */}
        <StockNotifyModal
          isOpen={stockModalOpen}
          onClose={() => setStockModalOpen(false)}
          product={productDetail || product}
        />

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
    <div
      className={styles.relCard}
      onClick={() => navigate(`/urun/${product.id}`)}
      style={{ cursor: 'pointer' }}
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
    </div>
  );
}
