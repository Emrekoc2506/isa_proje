import styles from './Header.module.css';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiShoppingCart, FiHeart, FiUser, FiX, FiMenu, FiBell } from 'react-icons/fi';
import { MdOutlineLocalShipping } from 'react-icons/md';
import { useStickyHeader } from '../../hooks/useStickyHeader';
import CategoryNav from '../CategoryNav/CategoryNav';
import CartDrawer from '../CartDrawer/CartDrawer';
import NotificationDropdown from '../NotificationDropdown/NotificationDropdown';
import logoImage from '../../assets/images/logo.png';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import { useWishlist } from '../../context/WishlistContext';

export default function Header() {
  const { isSticky } = useStickyHeader(60);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen]         = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const notifRef = useRef(null);

  const { totalCount, totalPrice } = useCart();
  const { unreadCount } = useNotifications();
  const { totalCount: wishlistCount } = useWishlist();

  return (
    <>
      {/* ── Ücretsiz Teslimat Bandı ─────────────────────────── */}
      <div className={styles.announcement}>
        <MdOutlineLocalShipping className={styles.announcementIcon} />
        <span><strong>10.47 €</strong> ve üzeri siparişlerde ücretsiz teslimat</span>
      </div>

      {/* ── Ana Header ─────────────────────────────────────── */}
      <header className={`${styles.header} ${isSticky ? styles.sticky : ''}`}>
        <div className={styles.inner}>

          {/* Logo */}
          <a href="/" className={styles.logo} aria-label="mysticvelora – Ana Sayfa">
            <img src={logoImage} alt="mysticvelora" width={180} height={72} />
            <span className={styles.brandName}>mysticvelora</span>
          </a>

          {/* Arama Kutusu */}
          <div className={`${styles.searchWrapper} ${searchOpen ? styles.searchOpen : ''}`}>
            <form className={styles.searchForm} onSubmit={e => e.preventDefault()}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Ürün ara…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Ara"
              />
              <button type="submit" className={styles.searchBtn} aria-label="Ara">
                <FiSearch />
              </button>
            </form>
          </div>

          {/* Üst Aksiyonlar */}
          <div className={styles.actions}>
            {/* Mobil arama */}
            <button
              className={`${styles.actionBtn} ${styles.mobileSearch}`}
              onClick={() => setSearchOpen(v => !v)}
              aria-label={searchOpen ? 'Aramayı kapat' : 'Aramayı aç'}
            >
              {searchOpen ? <FiX /> : <FiSearch />}
            </button>

            {/* Giriş */}
            <a href="/giris" className={styles.actionBtn} aria-label="Hesap">
              <FiUser />
              <span className={styles.actionLabel}>Giriş Yap</span>
            </a>

            {/* Favoriler */}
            <div className={styles.wishlistWrapper}>
              <a href="/panel" className={styles.actionBtn} aria-label={`Favoriler - ${wishlistCount} ürün`}>
                <FiHeart />
                {wishlistCount > 0 && (
                  <span className={styles.wishlistBadge}>{wishlistCount}</span>
                )}
                <span className={styles.actionLabel}>Favoriler</span>
              </a>
            </div>

            {/* 🔔 Bildirimler */}
            <div className={styles.notifWrapper} ref={notifRef}>
              <button
                id="btn-notifications"
                className={`${styles.actionBtn} ${notifOpen ? styles.actionActive : ''}`}
                onClick={() => setNotifOpen(v => !v)}
                aria-label="Bildirimler"
                aria-expanded={notifOpen}
              >
                <FiBell />
                {unreadCount > 0 && (
                  <span className={styles.notifBadge} aria-label={`${unreadCount} okunmamış bildirim`}>
                    {unreadCount}
                  </span>
                )}
                <span className={styles.actionLabel}>Bildirimler</span>
              </button>
              <NotificationDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>

            {/* 🛒 Sepet */}
            <button
              id="btn-cart"
              className={`${styles.actionBtn} ${styles.cartBtn}`}
              onClick={() => setCartOpen(true)}
              aria-label={`Sepet – ${totalCount} ürün`}
            >
              <FiShoppingCart />
              {totalCount > 0 && (
                <span className={styles.cartBadge} aria-live="polite">{totalCount}</span>
              )}
              <span className={styles.actionLabel}>{totalPrice.toFixed(2)} €</span>
            </button>

            {/* Mobil hamburger */}
            <button
              className={`${styles.actionBtn} ${styles.hamburger}`}
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Menü"
            >
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {/* Mobil Arama Paneli */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              className={styles.mobileSearchPanel}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <form className={styles.mobileSearchForm} onSubmit={e => e.preventDefault()}>
                <input
                  type="text"
                  className={styles.mobileSearchInput}
                  placeholder="Ürün ara…"
                  autoFocus
                  aria-label="Mobil arama"
                />
                <button type="submit" className={styles.mobileSearchSubmit}>
                  <FiSearch /> Ara
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Kategori Navigasyonu ────────────────────────────── */}
      <CategoryNav mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      {/* ── Sepet Çekmecesi ─────────────────────────────────── */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
