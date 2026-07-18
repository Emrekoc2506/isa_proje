import styles from './ProductCard.module.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingCart, FiHeart, FiCheck } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa'; // Filled heart
import { cardHover } from '../../animations/variants';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function ProductCard({ product }) {
  const { name, price, oldPrice, discount, unit, image, href, isNew, isSale, id } = product;
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();

  const productId = id || name;
  const isFavorite = isInWishlist(productId);
  const detailHref = `/urun/${productId}`;

  const handleAdd = async () => {
    try {
      await addToCart({ id: productId, name, price, image });
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch (err) {
      // Error alert is already handled by CartContext, so we just catch and suppress here
    }
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
        {isNew && <span className={styles.badge + ' ' + styles.badgeNew}>Yeni</span>}
        {isSale && discount && (
          <span className={styles.badge + ' ' + styles.badgeSale}>{discount}</span>
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
        <img src={image} alt={name} className={styles.img} loading="lazy" />
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
          className={`${styles.addBtn} ${added ? styles.addBtnAdded : ''}`}
          onClick={handleAdd}
          whileHover={{ scale: added ? 1 : 1.04 }}
          whileTap={{ scale: 0.97 }}
          aria-label={`${name} sepete ekle`}
        >
          <AnimatePresence mode="wait">
            {added ? (
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
