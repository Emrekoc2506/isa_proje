import styles from "./ProductDetailPage.module.css";
import { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShoppingCart,
  FiHeart,
  FiCheck,
  FiStar,
  FiChevronRight,
  FiTruck,
  FiShield,
  FiMinus,
  FiPlus,
  FiShare2,
  FiZap,
  FiChevronDown,
  FiMessageCircle,
  FiBell,
  FiZoomIn,
  FiAlertCircle,
} from "react-icons/fi";
import { FaHeart, FaWhatsapp, FaInstagram } from "react-icons/fa";
import { useProducts } from "../../context/ProductContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import {
  getProductById,
  getProductBySlug,
  getProductReviews,
  createProductReview,
} from "../../services/productApi";
import MainLayout from "../../layouts/MainLayout/MainLayout";
import SEO from "../../components/SEO/SEO";
import { toAbsoluteUrl, stripHtml } from "../../utils/seoHelpers";
import { ProductDetailSkeleton } from "../../components/Skeleton/Skeleton";
import ProductReviews from "../../components/ProductReviews/ProductReviews";
import RecentlyViewed from "../../components/RecentlyViewed/RecentlyViewed";
import StockNotifyModal from "../../components/StockNotifyModal/StockNotifyModal";
import {
  addRecentlyViewed,
  removeRecentlyViewed,
} from "../../utils/recentlyViewed";
import { getKnownStockQuantity } from "../../utils/stockUtils";
import { formatTurkishDate } from "../../utils/dateUtils";

/* ─── Yıldız Bileşeni ────────────────────────────────────── */
function Stars({ rating, size = 14 }) {
  return (
    <span className={styles.starsRow} style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <FiStar
          key={i}
          className={i <= Math.round(rating) ? styles.starOn : styles.starOff}
        />
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
  const { products, loadProducts, catalogDeferred } = useProducts();
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
  const product = products.find(
    (p) => String(p.id) === String(id) || p.slug === id,
  );

  // Home'dan detay sayfasına geçişte katalog ertelenmiş olabilir; benzer ürünleri korumak için burada yükle.
  useEffect(() => {
    if (
      catalogDeferred &&
      products.length === 0 &&
      typeof loadProducts === "function"
    ) {
      loadProducts({ pageSize: 500 });
    }
  }, [catalogDeferred, products.length, loadProducts]);

  useEffect(() => {
    if (product) {
      addRecentlyViewed(product);
    }
  }, [product]);

  useEffect(() => {
    async function fetchDetail() {
      try {
        setLoadingDetail(true);
        const isGuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            id,
          );
        let detailData = null;
        let isNotFound = false;

        try {
          if (isGuid) {
            detailData = await getProductById(id);
          } else {
            detailData = await getProductBySlug(id);
          }
        } catch (err) {
          if (
            err.status === 404 ||
            err.code === "not_found" ||
            String(err.message).includes("404")
          ) {
            isNotFound = true;
            removeRecentlyViewed(id);
          }
        }

        if (detailData) {
          setProductDetail(detailData);
          addRecentlyViewed(detailData);
          const reviewsData = await getProductReviews(detailData.id).catch(
            () => [],
          );
          setReviews(reviewsData || []);
        } else if (!isNotFound && product) {
          setProductDetail(product);
        } else {
          setProductDetail(null);
        }
      } catch (err) {
        console.error("Detay yükleme hatası:", err);
        setProductDetail(null);
      } finally {
        setLoadingDetail(false);
      }
    }
    fetchDetail();
  }, [id, product]);

  /* ─── Benzer Ürünler (Random) ───────────────────────── */
  const relatedProducts = useMemo(() => {
    if (!products.length || !productDetail) return [];
    const others = products.filter(
      (p) =>
        String(p.id) !== String(productDetail.id) &&
        p.isActive !== false &&
        !p.isSecret &&
        !p.IsSecret &&
        !p.name?.endsWith(" [GİZLİ]"),
    );
    const shuffled = [...others].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 8);
  }, [products, productDetail]);

  /* ─── State'ler ─────────────────────────────────────── */
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [stockError, setStockError] = useState(null);
  const [activeTab, setActiveTab] = useState("description");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [customNote, setCustomNote] = useState("");

  // ESC tuşu ile Lightbox kapatma
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    if (lightboxOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  // Auto-select first variant on load if exists
  useEffect(() => {
    if (productDetail?.variants?.length > 0) {
      setSelectedVariantId(productDetail.variants[0].id);
    } else {
      setSelectedVariantId(null);
    }
  }, [productDetail]);

  const selectedVariant = useMemo(() => {
    return (
      productDetail?.variants?.find((v) => v.id === selectedVariantId) || null
    );
  }, [productDetail, selectedVariantId]);

  /* ─── Medya Listesi ─────────────────────────────────── */
  const mediaList = useMemo(() => {
    let urls = [];
    if (
      Array.isArray(productDetail?.images) &&
      productDetail.images.length > 0
    ) {
      const sorted = [...productDetail.images].sort((a, b) => {
        const aPrimary = a.isPrimary || a.IsPrimary ? 1 : 0;
        const bPrimary = b.isPrimary || b.IsPrimary ? 1 : 0;
        if (aPrimary !== bPrimary) return bPrimary - aPrimary;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });
      urls = sorted
        .map((i) => (typeof i === "string" ? i : i?.url || i?.Url))
        .filter(Boolean);
    } else if (
      Array.isArray(productDetail?.imageUrls) &&
      productDetail.imageUrls.length > 0
    ) {
      urls = productDetail.imageUrls.filter(Boolean);
    } else if (productDetail?.imageUrl || productDetail?.ImageUrl) {
      urls = [productDetail.imageUrl || productDetail.ImageUrl];
    } else if (product?.image || product?.imageUrl) {
      urls = [product.image || product.imageUrl];
    }

    if (urls.length === 0) {
      urls = ["/ornek resim.jpg"];
    }

    return urls.map((src) => ({
      type: "image",
      src,
      alt: productDetail?.name || "Ürün Görseli",
    }));
  }, [productDetail, product]);

  /* ─── Related Scroll Ref ────────────────────────────── */
  const relatedRef = useRef(null);
  const scrollRelated = (dir) => {
    if (!relatedRef.current) return;
    relatedRef.current.scrollBy({ left: dir * 280, behavior: "smooth" });
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
          <Link
            to="/urunler"
            className={styles.buyBtn}
            style={{
              marginTop: "16px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Mağazaya Dön
          </Link>
        </div>
      </MainLayout>
    );
  }

  /* ─── Hesaplamalar ──────────────────────────────────── */
  const isFav = isInWishlist(productDetail.id);
  const rating = avg(reviews);
  const visibleReviews = showAllReviews ? reviews : (reviews || []).slice(0, 3);
  const currentAvailableStock = getKnownStockQuantity(
    selectedVariant || productDetail,
  );
  const stockKnown = currentAvailableStock !== null;
  const isOutOfStock = stockKnown && currentAvailableStock === 0;

  /* ─── F12 Geliştirici / Admin Stok Takip Uyarısı ─────── */
  useEffect(() => {
    if (productDetail && !stockKnown) {
      console.warn(
        `[Stok Uyarısı - F12] "${productDetail.name}" (ID: ${productDetail.id}) için backend'den stok adedi (stockQuantity/availableStock) dönmedi. Müşteriye "Stokta Mevcut" gösteriliyor. Lütfen admin panelinden bu ürünün stok adedini kontrol ediniz.`,
        { product: productDetail }
      );
    }
  }, [productDetail, stockKnown]);

  /* ─── Handlers ──────────────────────────────────────── */
  const handleAddToCart = async () => {
    setStockError(null);
    if (isOutOfStock) {
      setStockError("Bu ürünün stoğu tükenmiştir.");
      setTimeout(() => setStockError(null), 4000);
      return;
    }

    if (stockKnown && qty > currentAvailableStock) {
      setStockError(
        `Bu üründen en fazla ${currentAvailableStock} adet ekleyebilirsiniz.`,
      );
      setTimeout(() => setStockError(null), 4000);
      return;
    }

    const finalPrice =
      productDetail.price + (selectedVariant?.additionalPrice || 0);
    const res = await addToCart(
      {
        id: productDetail.id,
        name:
          productDetail.name +
          (selectedVariant ? ` (${selectedVariant.name})` : ""),
        price: finalPrice + " ₺",
        image: productDetail.imageUrl || productDetail.images?.[0]?.url || "",
      },
      qty,
      selectedVariantId,
      customNote.trim(),
    );

    if (res && res.success === false) {
      setStockError(res.message || "Bu ürün için yeterli stok bulunmuyor.");
      setTimeout(() => setStockError(null), 4000);
      return;
    }

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2200);
  };

  const handleBuyNow = async () => {
    setStockError(null);
    if (isOutOfStock) {
      setStockError("Bu ürünün stoğu tükenmiştir.");
      setTimeout(() => setStockError(null), 4000);
      return;
    }

    const finalPrice =
      productDetail.price + (selectedVariant?.additionalPrice || 0);
    const res = await addToCart(
      {
        id: productDetail.id,
        name:
          productDetail.name +
          (selectedVariant ? ` (${selectedVariant.name})` : ""),
        price: finalPrice + " ₺",
        image: productDetail.imageUrl || productDetail.images?.[0]?.url || "",
      },
      qty,
      selectedVariantId,
      customNote.trim(),
    );

    if (res && res.success === false) {
      setStockError(res.message || "Bu ürün için yeterli stok bulunmuyor.");
      setTimeout(() => setStockError(null), 4000);
      return;
    }

    navigate("/odeme");
  };

  const handlePrev = () =>
    setActiveImg((p) => (p === 0 ? mediaList.length - 1 : p - 1));
  const handleNext = () =>
    setActiveImg((p) => (p === mediaList.length - 1 ? 0 : p + 1));

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    try {
      await createProductReview(productDetail.id, {
        rating: reviewRating,
        comment: reviewText.trim(),
      });
      alert("Yorumunuz onaylanmak üzere gönderildi.");
      setReviewText("");
      // Yorumları tekrar yükle
      const updated = await getProductReviews(productDetail.id);
      setReviews(updated || []);
    } catch (err) {
      alert(
        err.message ||
          "Yorum eklenirken hata oluştu. Lütfen giriş yaptığınızdan emin olun.",
      );
    }
  };

  const whatsappUrl = `https://wa.me/905427906863?text=${encodeURIComponent(`Merhaba! ${productDetail.name} hakkında bilgi almak istiyorum.`)}`;
  const instagramUrl = `https://www.instagram.com/muhristan`;

  /* ─── Tabs ──────────────────────────────────────────── */
  const tabs = [
    { key: "description", label: "Açıklama" },
    { key: "specs", label: "Özellikler" },
    { key: "reviews", label: `Yorumlar (${reviews.length || 0})` },
  ];

  if (loadingDetail) {
    return (
      <MainLayout>
        <div className={styles.page}>
          <SEO title="Ürün Yükleniyor... | muhristan" />
          <ProductDetailSkeleton />
        </div>
      </MainLayout>
    );
  }

  if (!productDetail) {
    return (
      <MainLayout>
        <div
          className={styles.page}
          style={{
            textAlign: "center",
            padding: "120px 20px",
            minHeight: "60vh",
          }}
        >
          <SEO title="Ürün Bulunamadı | Muhristan" is404={true} />
          <h2
            style={{
              color: "var(--gold-light)",
              fontSize: "32px",
              marginBottom: "12px",
              fontFamily: "var(--font-heading)",
            }}
          >
            Ürün Bulunamadı
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              marginBottom: "28px",
              fontSize: "16px",
            }}
          >
            Aradığınız ilan veya ürün mevcut değil ya da kaldırılmış olabilir.
          </p>
          <Link
            to="/urunler"
            style={{
              background:
                "linear-gradient(135deg, var(--gold-light), var(--gold-dark))",
              color: "var(--bg-dark)",
              padding: "14px 28px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "15px",
            }}
          >
            Tüm İlanları / Ürünleri İncele
          </Link>
        </div>
      </MainLayout>
    );
  }

  /* ─── SEO & Structured Data (Product & Breadcrumb JSON-LD) ─── */
  const productTitle =
    productDetail.seoTitle || `${productDetail.name} | Muhristan`;
  const productDesc =
    productDetail.seoDescription ||
    productDetail.shortDescription ||
    stripHtml(productDetail.description) ||
    `${productDetail.name} özel tasarım takı ve aksesuar.`;
  const canonicalUrl =
    productDetail.canonicalUrl ||
    `https://muhristan.com/urun/${productDetail.slug || productDetail.id}`;
  const primaryImgUrl = toAbsoluteUrl(
    productDetail.imageUrl || mediaList[0]?.src || "/logo-2.png",
  );
  const rawPriceNum =
    typeof productDetail.price === "number"
      ? productDetail.price
      : parseFloat(String(productDetail.price).replace(/[^0-9.]/g, "")) || 0;

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: productDetail.name,
    image: [primaryImgUrl],
    description: stripHtml(
      productDetail.description ||
        productDetail.shortDescription ||
        productDetail.name,
    ).slice(0, 160),
    sku: productDetail.sku || String(productDetail.id),
    brand: {
      "@type": "Brand",
      name: productDetail.brand || "Muhristan",
    },
    url: canonicalUrl,
    offers: {
      "@type": "Offer",
      priceCurrency: "TRY",
      price: rawPriceNum,
      availability:
        productDetail.stockQuantity > 0 ||
        productDetail.stock > 0 ||
        productDetail.inStock !== false
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: canonicalUrl,
    },
  };

  const categoryName =
    productDetail.categoryName || productDetail.category?.name || "Kategori";
  const categorySlug =
    productDetail.categorySlug || productDetail.category?.slug || "";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Ana Sayfa",
        item: "https://muhristan.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryName,
        item: categorySlug
          ? `https://muhristan.com/urunler?category=${categorySlug}`
          : "https://muhristan.com/urunler",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: productDetail.name,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <MainLayout>
      <SEO
        title={productTitle}
        description={productDesc}
        keywords={productDetail.seoKeywords}
        canonical={canonicalUrl}
        type="product"
        image={primaryImgUrl}
        jsonLd={[productSchema, breadcrumbSchema]}
      />
      <div className={styles.page}>
        {/* ════ BREADCRUMB ══════════════════════════════════ */}
        <nav className={styles.breadcrumb}>
          <Link to="/" className={styles.breadLink}>
            Ana Sayfa
          </Link>
          <FiChevronRight className={styles.breadSep} />
          <Link to="/urunler" className={styles.breadLink}>
            Mağaza
          </Link>
          <FiChevronRight className={styles.breadSep} />
          <span className={styles.breadCurrent}>{productDetail.name}</span>
        </nav>

        {/* ════ 2-SÜTUN ANA BÖLÜM ═══════════════════════════ */}
        <div className={styles.mainGrid}>
          {/* ── SOL: GALERİ ─────────────────────────────── */}
          <div className={styles.galleryCol}>
            {/* Ana Görsel Kutusu */}
            <div
              className={`${styles.mainFrame} ${isZoomed ? styles.zoomed : ""}`}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onClick={() => setLightboxOpen(true)}
              style={{ cursor: "zoom-in" }}
              title="Görseli büyütmek için tıklayın"
            >
              {/* Görseli Büyüt Rozeti */}
              <div
                style={{
                  position: "absolute",
                  bottom: "14px",
                  right: "14px",
                  background: "rgba(0, 0, 0, 0.65)",
                  color: "var(--gold-light)",
                  borderRadius: "20px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  zIndex: 10,
                  pointerEvents: "none",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(201, 162, 39, 0.35)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                }}
              >
                <FiZoomIn size={14} /> Büyüt
              </div>

              {/* Badge'ler */}
              <div className={styles.frameBadges}>
                {productDetail.isNew && (
                  <span className={`${styles.badge} ${styles.bNew}`}>YENİ</span>
                )}
                {productDetail.isSale && productDetail.discount && (
                  <span className={`${styles.badge} ${styles.bSale}`}>
                    {productDetail.discount}
                  </span>
                )}
              </div>

              {/* Favori (galeri üstünde) */}
              <motion.button
                className={`${styles.favOverlay} ${isFav ? styles.favOn : ""}`}
                onClick={() =>
                  toggleWishlist({
                    id: productDetail.id,
                    name: productDetail.name,
                    price: productDetail.price + " ₺",
                    image:
                      productDetail.imageUrl ||
                      productDetail.images?.[0]?.url ||
                      "",
                  })
                }
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
                    src={mediaList[activeImg]?.src || "/ornek resim.jpg"}
                    alt={mediaList[activeImg]?.alt || productDetail.name}
                    className={styles.mainImg}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/ornek resim.jpg";
                    }}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigasyon Okları */}
              {mediaList.length > 1 && (
                <>
                  <button
                    type="button"
                    className={`${styles.navBtn} ${styles.navLeft}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePrev(e);
                    }}
                    aria-label="Önceki"
                  >
                    &#10094;
                  </button>
                  <button
                    type="button"
                    className={`${styles.navBtn} ${styles.navRight}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleNext(e);
                    }}
                    aria-label="Sonraki"
                  >
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
                      type="button"
                      className={`${styles.dot} ${i === activeImg ? styles.dotActive : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveImg(i);
                      }}
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
                    type="button"
                    className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveImg(i);
                    }}
                    aria-label={`Görsel ${i + 1}`}
                  >
                    <img
                      src={m.src}
                      alt={m.alt}
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/ornek resim.jpg";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Paylaş Butonu */}
            <button
              className={styles.shareBtn}
              onClick={() =>
                navigator.share?.({
                  title: productDetail.name,
                  url: window.location.href,
                })
              }
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
              <span className={styles.ratingCount}>
                ({reviews.length} değerlendirme)
              </span>
              <button
                className={styles.ratingLink}
                onClick={() => setActiveTab("reviews")}
              >
                Yorumları gör →
              </button>
            </div>

            {/* Fiyat Bloğu */}
            <div className={styles.priceBlock}>
              {productDetail.oldPrice && (
                <div className={styles.oldPriceRow}>
                  <span className={styles.oldPrice}>
                    {productDetail.oldPrice +
                      (selectedVariant?.additionalPrice || 0)}{" "}
                    ₺
                  </span>
                  {productDetail.discount && (
                    <span className={styles.discountBadge}>
                      {productDetail.discount}
                    </span>
                  )}
                </div>
              )}
              <div className={styles.currentPrice}>
                {productDetail.price + (selectedVariant?.additionalPrice || 0)}{" "}
                ₺
                {productDetail.unit && (
                  <span className={styles.priceUnit}>
                    / {productDetail.unit}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.hr} />

            {/* Kısa Açıklama */}
            <p style={{ color: "var(--text-muted)", lineHeight: "1.6" }}>
              {productDetail.shortDescription ||
                "Mistik şifa enerjileri barındıran bu özel ürün, ritüellerinizde ve günlük yaşamınızda huzuru yakalamanıza yardımcı olur."}
            </p>

            {/* Fiziksel Özellikler (Ağırlık & Ölçü) */}
            {(productDetail.weightGram ||
              productDetail.weight ||
              productDetail.dimensions) && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginTop: "12px",
                }}
              >
                {(productDetail.weightGram || productDetail.weight) && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(201, 162, 39, 0.08)",
                      border: "1px solid rgba(201, 162, 39, 0.3)",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>⚖️</span>
                    <span>
                      Ağırlık:{" "}
                      <strong style={{ color: "var(--gold-light)" }}>
                        {productDetail.weightGram || productDetail.weight} gr
                      </strong>
                    </span>
                  </div>
                )}

                {productDetail.dimensions && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(201, 162, 39, 0.08)",
                      border: "1px solid rgba(201, 162, 39, 0.3)",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>📏</span>
                    <span>
                      Ölçü:{" "}
                      <strong style={{ color: "var(--gold-light)" }}>
                        {productDetail.dimensions}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* VARYANT SEÇİMİ */}
            {productDetail.variants?.length > 0 && (
              <>
                <div className={styles.hr} />
                <div style={{ marginBottom: "16px" }}>
                  <span
                    style={{
                      display: "block",
                      color: "var(--text-secondary)",
                      fontSize: "13px",
                      fontWeight: 600,
                      marginBottom: "8px",
                    }}
                  >
                    Seçenekler
                  </span>
                  <div
                    style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                  >
                    {productDetail.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariantId(v.id);
                          setQty(1);
                        }}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 500,
                          cursor: "pointer",
                          background:
                            selectedVariantId === v.id
                              ? "var(--gold-glow)"
                              : "var(--bg-dark)",
                          border:
                            selectedVariantId === v.id
                              ? "1px solid var(--gold)"
                              : "1px solid var(--border-gold)",
                          color:
                            selectedVariantId === v.id
                              ? "var(--gold-light)"
                              : "var(--text-secondary)",
                          transition: "all 0.2s",
                        }}
                      >
                        {v.name}{" "}
                        {v.additionalPrice > 0
                          ? `(+${v.additionalPrice} ₺)`
                          : ""}
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
                  onClick={() => {
                    setStockError(null);
                    setQty((q) => Math.max(1, q - 1));
                  }}
                  disabled={isOutOfStock || qty <= 1}
                  aria-label="Azalt"
                >
                  <FiMinus />
                </button>
                <span className={styles.qtyVal}>{qty}</span>
                <button
                  className={styles.qtyBtn}
                  onClick={() => {
                    if (stockKnown && qty >= currentAvailableStock) {
                      setStockError(
                        `Maksimum mevcut stok sınırı: ${currentAvailableStock} adet`,
                      );
                      setTimeout(() => setStockError(null), 3500);
                      return;
                    }
                    setStockError(null);
                    setQty((q) => q + 1);
                  }}
                  disabled={
                    isOutOfStock || (stockKnown && qty >= currentAvailableStock)
                  }
                  aria-label="Artır"
                >
                  <FiPlus />
                </button>
              </div>
              <span className={styles.stockLabel}>
                <FiZap className={styles.stockIcon} />
                {isOutOfStock ? (
                  <span style={{ color: "#e05594", fontWeight: 700 }}>
                    Tükendi
                  </span>
                ) : stockKnown ? (
                  <>Stokta Mevcut ({currentAvailableStock} Adet)</>
                ) : (
                  <>Stokta Mevcut</>
                )}
              </span>
            </div>

            {/* Stok Uyarı Banner'ı */}
            <AnimatePresence>
              {stockError && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "rgba(224, 85, 148, 0.14)",
                    border: "1px solid rgba(224, 85, 148, 0.45)",
                    color: "#f8a5c2",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    lineHeight: "1.4",
                    marginBottom: "14px",
                  }}
                >
                  <FiAlertCircle
                    style={{
                      fontSize: "18px",
                      color: "#e05594",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1 }}>{stockError}</span>
                  <button
                    onClick={() => setStockError(null)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#f8a5c2",
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: "2px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA Butonları */}
            <div className={styles.ctaGroup}>
              <button
                className={`${styles.cartBtn} ${addedToCart ? styles.cartAdded : ""}`}
                onClick={
                  isOutOfStock ? () => setStockModalOpen(true) : handleAddToCart
                }
                disabled={isOutOfStock && !setStockModalOpen}
              >
                {isOutOfStock ? (
                  <span>
                    <FiBell /> Stoka Gelince Bildir
                  </span>
                ) : addedToCart ? (
                  <span>
                    <FiCheck /> Sepete Eklendi!
                  </span>
                ) : (
                  <span>
                    <FiShoppingCart /> Sepete Ekle
                  </span>
                )}
              </button>

              <button
                className={`${styles.wishBtn} ${isFav ? styles.wishOn : ""}`}
                onClick={() =>
                  toggleWishlist({
                    id: productDetail.id,
                    name: productDetail.name,
                    price: productDetail.price + " ₺",
                    image:
                      productDetail.imageUrl ||
                      productDetail.images?.[0]?.url ||
                      "",
                  })
                }
                aria-label={isFav ? "Favorilerden çıkar" : "Favorilere ekle"}
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
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${styles.contactBtn} ${styles.waBtnC}`}
                >
                  <FaWhatsapp /> WhatsApp
                </a>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${styles.contactBtn} ${styles.igBtnC}`}
                >
                  <FaInstagram /> Instagram
                </a>
              </div>
            </div>

            {/* Güven Rozetleri */}
            <div className={styles.trustGrid}>
              <div className={styles.trustItem}>
                <FiTruck className={styles.trustIcon} />
                <div>
                  <b>Yurtiçi Kargo</b>
                  <span>
                    {(() => {
                      if (
                        productDetail.isFreeShipping ||
                        productDetail.freeShipping ||
                        productDetail.shippingFee === 0 ||
                        productDetail.cargoFee === 0
                      ) {
                        return "🚚 Ücretsiz Kargo";
                      }
                      const fee =
                        productDetail.shippingFee ??
                        productDetail.cargoFee ??
                        productDetail.cargoPrice ??
                        productDetail.shippingCost;
                      if (
                        fee != null &&
                        fee !== "" &&
                        !isNaN(parseFloat(fee)) &&
                        parseFloat(fee) > 0
                      ) {
                        return `${parseFloat(fee)} ₺ Kargo Ücreti`;
                      }
                      return "Hızlı & Güvenli Teslimat";
                    })()}
                  </span>
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
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`${styles.tabBtn} ${activeTab === t.key ? styles.tabActive : ""}`}
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
            {activeTab === "description" && (
              <div className={styles.descWrap}>
                {productDetail.description &&
                productDetail.description.trim().startsWith("<") ? (
                  // HTML içeriği (TinyMCE çıktısı) — XSS korumalı render
                  <div
                    className={styles.richContent}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        productDetail.description || "",
                        {
                          ADD_TAGS: ["iframe"],
                          ADD_ATTR: [
                            "allow",
                            "allowfullscreen",
                            "frameborder",
                            "src",
                            "width",
                            "height",
                            "title",
                          ],
                          FORCE_BODY: true,
                        },
                      ),
                    }}
                  />
                ) : (
                  // Eski düz metin formatı (geriye dönük uyumluluk)
                  (
                    productDetail.description ||
                    "Bu mistik ürün hakkında açıklama bulunmamaktadır."
                  )
                    .split("\n\n")
                    .map((para, i) => (
                      <p key={i} className={styles.descPara}>
                        {para}
                      </p>
                    ))
                )}
              </div>
            )}

            {/* Özellikler */}
            {activeTab === "specs" && (
              <div className={styles.specsWrap}>
                <table className={styles.specsTable}>
                  <tbody>
                    <tr className={styles.specRow}>
                      <td className={styles.specKey}>Stok Durumu</td>
                      <td className={styles.specVal}>
                        {productDetail.stockQuantity} Adet
                      </td>
                    </tr>
                    <tr className={styles.specRow}>
                      <td className={styles.specKey}>Kategori</td>
                      <td className={styles.specVal}>
                        {productDetail.categoryName || "Mistik Ürünler"}
                      </td>
                    </tr>
                    {productDetail.subcategory && (
                      <tr className={styles.specRow}>
                        <td className={styles.specKey}>Alt Kategori</td>
                        <td className={styles.specVal}>
                          {productDetail.subcategory}
                        </td>
                      </tr>
                    )}
                    {(productDetail.weightGram || productDetail.weight) && (
                      <tr className={styles.specRow}>
                        <td className={styles.specKey}>Ağırlık</td>
                        <td className={styles.specVal}>
                          {productDetail.weightGram || productDetail.weight} gr
                        </td>
                      </tr>
                    )}
                    {productDetail.dimensions && (
                      <tr className={styles.specRow}>
                        <td className={styles.specKey}>Ölçü / Boyut</td>
                        <td className={styles.specVal}>
                          {productDetail.dimensions}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Yorumlar */}
            {activeTab === "reviews" && (
              <div className={styles.reviewsWrap}>
                {/* Yorum Yazma Formu */}
                {productDetail.hasPurchased ? (
                  <div
                    style={{
                      marginBottom: "32px",
                      paddingBottom: "24px",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <h4
                      style={{
                        color: "var(--gold-light)",
                        marginBottom: "16px",
                      }}
                    >
                      Bu Ürünü Değerlendirin
                    </h4>
                    <form onSubmit={handleReviewSubmit}>
                      <div style={{ marginBottom: "12px" }}>
                        <span
                          style={{
                            marginRight: "12px",
                            color: "var(--text-muted)",
                          }}
                        >
                          Puanınız:
                        </span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "18px",
                              padding: "0 4px",
                            }}
                          >
                            <FiStar
                              style={{
                                fill:
                                  star <= reviewRating ? "var(--gold)" : "none",
                                color: "var(--gold)",
                              }}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        required
                        placeholder="Yorumunuzu buraya yazın..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        style={{
                          width: "100%",
                          height: "80px",
                          padding: "12px",
                          borderRadius: "8px",
                          background: "var(--bg-dark)",
                          border: "1px solid var(--border-gold)",
                          color: "var(--text-primary)",
                          marginBottom: "12px",
                          resize: "none",
                        }}
                      />
                      <button
                        type="submit"
                        className={styles.buyBtn}
                        style={{ padding: "8px 24px", fontSize: "14px" }}
                      >
                        Yorumu Gönder
                      </button>
                    </form>
                  </div>
                ) : (
                  <div
                    style={{
                      marginBottom: "32px",
                      paddingBottom: "24px",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      color: "var(--text-muted)",
                      fontSize: 13,
                    }}
                  >
                    * Bu ürünü sadece satın almış olan doğrulanmış
                    müşterilerimiz değerlendirebilir.
                  </div>
                )}

                {reviews.length > 0 ? (
                  <>
                    <div className={styles.reviewSummary}>
                      <div className={styles.avgBlock}>
                        <span className={styles.avgNum}>
                          {rating.toFixed(1)}
                        </span>
                        <Stars rating={rating} size={22} />
                        <span className={styles.avgSub}>
                          {reviews.length} değerlendirme
                        </span>
                      </div>
                    </div>

                    <div className={styles.reviewList}>
                      {visibleReviews.map((rv) => (
                        <div key={rv.id} className={styles.reviewCard}>
                          <div className={styles.rvHeader}>
                            <div className={styles.rvAvatar}>
                              {rv.customerName
                                ? rv.customerName[0].toUpperCase()
                                : "M"}
                            </div>
                            <div
                              className={styles.rvMeta}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <span
                                  className={styles.rvName}
                                  style={{ margin: 0 }}
                                >
                                  {rv.customerName || "Müşteri"}
                                </span>
                                {rv.isVerifiedPurchase && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      background: "rgba(46,204,113,0.15)",
                                      border: "1px solid #2ecc71",
                                      color: "#2ecc71",
                                      padding: "1px 6px",
                                      borderRadius: 4,
                                    }}
                                  >
                                    Satın Aldı
                                  </span>
                                )}
                              </div>
                              <Stars rating={rv.rating} size={12} />
                            </div>
                            <span className={styles.rvDate}>
                              {formatTurkishDate(rv.createdAt)}
                            </span>
                          </div>
                          <p className={styles.rvText}>{rv.comment}</p>
                        </div>
                      ))}
                    </div>

                    {reviews.length > 3 && (
                      <button
                        className={styles.showMoreBtn}
                        onClick={() => setShowAllReviews((v) => !v)}
                      >
                        {showAllReviews
                          ? "Daha az göster"
                          : `Tümünü gör (${reviews.length})`}
                        <FiChevronDown
                          className={showAllReviews ? styles.chevUp : ""}
                        />
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
                <button
                  className={styles.relNavBtn}
                  onClick={() => scrollRelated(-1)}
                  aria-label="Sola kaydır"
                >
                  &#10094;
                </button>
                <button
                  className={styles.relNavBtn}
                  onClick={() => scrollRelated(1)}
                  aria-label="Sağa kaydır"
                >
                  &#10095;
                </button>
              </div>
            </div>

            <div className={styles.relatedTrack} ref={relatedRef}>
              {relatedProducts.map((rp, i) => (
                <RelatedCard
                  key={rp.id || i}
                  product={rp}
                  navigate={navigate}
                  addToCart={addToCart}
                />
              ))}
            </div>
          </section>
        )}

        {/* Müşteri Değerlendirmeleri (Product Reviews) */}
        <ProductReviews productId={productDetail?.id || product?.id || id} />

        {/* Son İnceledikleriniz (Recently Viewed Products) */}
        <RecentlyViewed
          currentProductId={productDetail?.id || product?.id || id}
        />

        {/* Stoka Gelince Bildir Modali */}
        <StockNotifyModal
          isOpen={stockModalOpen}
          onClose={() => setStockModalOpen(false)}
          product={productDetail || product}
        />

        {/* ════ LIGHTBOX (GÖRSEL BÜYÜTME MODALI) ═════════════ */}
        <AnimatePresence>
          {lightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 99999,
                background: "rgba(0, 0, 0, 0.92)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
              }}
              onClick={() => setLightboxOpen(false)}
            >
              {/* Kapat Butonu */}
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                style={{
                  position: "absolute",
                  top: "24px",
                  right: "24px",
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "48px",
                  height: "48px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  transition: "all 0.2s",
                  zIndex: 100000,
                }}
                title="Kapat (ESC)"
              >
                ✕
              </button>

              {/* Görsel Sayacı */}
              {mediaList.length > 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: "28px",
                    left: "28px",
                    color: "var(--gold-light)",
                    fontWeight: 700,
                    fontSize: "15px",
                    letterSpacing: "0.05em",
                    background: "rgba(0,0,0,0.5)",
                    padding: "6px 14px",
                    borderRadius: "20px",
                    border: "1px solid rgba(201,162,39,0.3)",
                  }}
                >
                  {activeImg + 1} / {mediaList.length}
                </div>
              )}

              {/* Sol Ok */}
              {mediaList.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  style={{
                    position: "absolute",
                    left: "24px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(0, 0, 0, 0.65)",
                    border: "1px solid rgba(201, 162, 39, 0.4)",
                    color: "var(--gold-light)",
                    width: "54px",
                    height: "54px",
                    borderRadius: "50%",
                    fontSize: "24px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 100000,
                    transition: "all 0.2s",
                  }}
                  aria-label="Önceki Görsel"
                >
                  &#10094;
                </button>
              )}

              {/* Büyük Görsel */}
              <motion.img
                key={activeImg}
                src={mediaList[activeImg]?.src || "/ornek resim.jpg"}
                alt={productDetail.name}
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: "90vw",
                  maxHeight: "85vh",
                  objectFit: "contain",
                  borderRadius: "12px",
                  boxShadow:
                    "0 25px 60px rgba(0,0,0,0.9), 0 0 20px rgba(201,162,39,0.2)",
                  border: "1px solid rgba(201,162,39,0.25)",
                }}
              />

              {/* Sağ Ok */}
              {mediaList.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  style={{
                    position: "absolute",
                    right: "24px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(0, 0, 0, 0.65)",
                    border: "1px solid rgba(201, 162, 39, 0.4)",
                    color: "var(--gold-light)",
                    width: "54px",
                    height: "54px",
                    borderRadius: "50%",
                    fontSize: "24px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 100000,
                    transition: "all 0.2s",
                  }}
                  aria-label="Sonraki Görsel"
                >
                  &#10095;
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div
      className={styles.relCard}
      onClick={() => navigate(`/urun/${product.id}`)}
      style={{ cursor: "pointer" }}
    >
      <div className={styles.relImgWrap}>
        {product.isNew && <span className={styles.relBadgeNew}>YENİ</span>}
        {product.isSale && product.discount && (
          <span className={styles.relBadgeSale}>{product.discount}</span>
        )}
        <button
          className={`${styles.relFav} ${isFav ? styles.relFavOn : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label="Favorilere ekle"
        >
          {isFav ? <FaHeart /> : <FiHeart />}
        </button>
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className={styles.relImg}
        />
      </div>
      <div className={styles.relInfo}>
        <p className={styles.relName}>{product.name}</p>
        <div className={styles.relPriceRow}>
          {product.oldPrice && (
            <span className={styles.relOldPrice}>{product.oldPrice}</span>
          )}
          <span className={styles.relPrice}>{product.price}</span>
        </div>
        <button
          className={`${styles.relCartBtn} ${added ? styles.relCartAdded : ""}`}
          onClick={handleAdd}
        >
          {added ? (
            <>
              <FiCheck /> Eklendi
            </>
          ) : (
            <>
              <FiShoppingCart /> Sepete Ekle
            </>
          )}
        </button>
      </div>
    </div>
  );
}
