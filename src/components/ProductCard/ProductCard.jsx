import styles from './ProductCard.module.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingCart, FiHeart, FiCheck } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa'; // Filled heart
import { cardHover } from '../../animations/variants';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { getSafeStockQuantity } from '../../utils/stockUtils';

export default function ProductCard({ product }) {
  const { name, price, oldPrice, discount, unit, image, href, isNew, isSale, id, isFreeShipping, isFreeCargo } = product;
  const freeShipping = isFreeShipping ?? isFreeCargo;
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [added, setAdded] = useState(false);
  const [stockOut, setStockOut] = useState(false);
  const navigate = useNavigate();

  const productId = id || name;
  const detailSlugOrId = product.slug || id || name;
  const isFavorite = isInWishlist(productId);
  const detailHref = `/urun/${detailSlugOrId}`;

  const availableStock = getSafeStockQuantity(product);
  const isOutOfStock =
    product.isOutOfStock === true ||
    (product.hasExplicitStock === true && availableStock === 0) ||
    availableStock === 0;

  const handleAdd = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (isOutOfStock) {
      setStockOut(true);
      setTimeout(() => setStockOut(false), 2500);
      return;
    }
    const res = await addToCart({ id: productId, name, price, image });
    if (res && res.success === false) {
      setStockOut(true);
      setTimeout(() => setStockOut(false), 2500);
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const handleWishlist = () => {
    toggleWishlist({ id: productId, name, price, image, href });
  };

  return (
    <motion.article
      className={styles.card}
      variants={cardHover}
      initial="rest"
      whileHover="hover"
    >
      {/* ── Badges ─────────────────────────────────────────── */}
      <div className={styles.badges}>
        {isOutOfStock ? (
          <span className={styles.badge} style={{ background: '#e05594', color: '#ffffff', fontWeight: 700 }}>Tükendi</span>
        ) : (
          <>
            {isNew && <span className={styles.badge + ' ' + styles.badgeNew}>Yeni</span>}
            {isSale && discount && (
              <span className={styles.badge + ' ' + styles.badgeSale}>{discount}</span>
            )}
            {freeShipping && (
              <span className={styles.badge} style={{ background: '#10b981', color: '#ffffff', fontWeight: 700 }}>Kargo Bedava</span>
            )}
          </>
        )}
      </div>

      {/* ── Wishlist Butonu ────────────────────────────────── */}
      <button 
        className={`${styles.wishlistBtn} ${isFavorite ? styles.wishlistBtnActive : ''}`} 
        aria-label="Favorilere ekle"
        onClick={handleWishlist}
      >
        {isFavorite ? <FaHeart color="#C45079" /> : <FiHeart />}
      </button>

      {/* ── Görsel ─────────────────────────────────────────── */}
      <a href={detailHref} className={styles.imgWrapper} tabIndex={-1} onClick={(e) => { e.preventDefault(); navigate(detailHref); }}>
        <img src={image} alt={name} className={styles.img} loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src = '/ornek resim.jpg'; }} />
        <div className={styles.imgOverlay} />
      </a>

      {/* ── İçerik ─────────────────────────────────────────── */}
      <div className={styles.content}>
        <a href={detailHref} className={styles.name} title={name} onClick={(e) => { e.preventDefault(); navigate(detailHref); }}>
          {name}
        </a>

        <div className={styles.priceRow}>
          {oldPrice && <span className={styles.oldPrice}>{oldPrice}</span>}
          <strong className={styles.price}>{price}</strong>
          {unit && <span className={styles.unit}>/ {unit}</span>}
        </div>

        <motion.button
          className={`${styles.addBtn} ${stockOut ? styles.addBtnOutOfStock : added ? styles.addBtnAdded : ''}`}
          onClick={handleAdd}
          whileHover={{ scale: added || stockOut ? 1 : 1.04 }}
          whileTap={{ scale: 0.97 }}
          aria-label={`${name} sepete ekle`}
        >
          <AnimatePresence mode="wait">
            {stockOut ? (
              <motion.span
                key="out"
                className={styles.addBtnInner}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                ⚠️ Stok Tükendi!
              </motion.span>
            ) : isOutOfStock ? (
              <span className={styles.addBtnInner}>Tükendi</span>
            ) : added ? (
              <motion.span
                key="added"
                className={styles.addBtnInner}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <FiCheck /> Eklendi!
              </motion.span>
            ) : (
              <motion.span
                key="add"
                className={styles.addBtnInner}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <FiShoppingCart /> Sepete Ekle
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.article>
  );
}
