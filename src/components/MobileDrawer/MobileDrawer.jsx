import styles from "./MobileDrawer.module.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiHome,
  FiGrid,
  FiHeart,
  FiBell,
  FiUser,
  FiLogOut,
  FiChevronDown,
  FiChevronRight,
  FiBookOpen,
  FiShoppingCart,
} from "react-icons/fi";
import logoImage from "../../assets/images/logo-2.png";
import { useAuth } from "../../context/AuthContext";
import { useProducts } from "../../context/ProductContext";
import { useWishlist } from "../../context/WishlistContext";
import { useNotifications } from "../../context/NotificationContext";
import { useCart } from "../../context/CartContext";
import ThemeToggle from "../ThemeToggle";

export default function MobileDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { categories } = useProducts();
  const { totalCount: wishlistCount } = useWishlist();
  const { unreadCount } = useNotifications();
  const { totalCount: cartCount, totalPrice } = useCart();
  const [openCategories, setOpenCategories] = useState({});

  const handleLinkClick = (path) => {
    onClose();
    if (path) {
      navigate(path);
    }
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    window.location.href = "/giris";
  };

  const toggleCategory = (catId) => {
    setOpenCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const userName =
    user?.firstName || user?.name || user?.email?.split("@")[0] || "Kullanıcı";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Arka Plan Karartması (Overlay) */}
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sol Kayar Çekmece (Drawer Panel) */}
          <motion.div
            className={styles.drawer}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
          >
            {/* Header / Üst Kısım */}
            <div className={styles.header}>
              <Link
                to="/"
                className={styles.brand}
                onClick={() => handleLinkClick("/")}
              >
                <img
                  src={logoImage}
                  alt="muhristan"
                  className={styles.logoImg}
                />
                <span className={styles.brandTitle}>muhristan</span>
              </Link>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Menüyü Kapat"
              >
                <FiX />
              </button>
            </div>

            {/* İçerik Alanı (Kaydırılabilir) */}
            <div className={styles.body}>
              {/* Kullanıcı Bilgi / Giriş Kartı */}
              <div className={styles.userCard}>
                {isAuthenticated ? (
                  <div className={styles.userInfo}>
                    <div className={styles.userAvatar}>
                      <FiUser />
                    </div>
                    <div className={styles.userDetails}>
                      <span className={styles.greeting}>Hoş geldin,</span>
                      <span className={styles.userName}>{userName}</span>
                    </div>
                    <div className={styles.userActions}>
                      <button
                        className={styles.panelBtn}
                        onClick={() =>
                          handleLinkClick(isAdmin ? "/admin" : "/panel")
                        }
                      >
                        Panelim
                      </button>
                      <button
                        className={styles.logoutBtn}
                        onClick={handleLogout}
                        title="Çıkış Yap"
                        aria-label="Çıkış Yap"
                      >
                        <FiLogOut />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className={styles.loginBannerBtn}
                    onClick={() => handleLinkClick("/giris")}
                  >
                    <FiUser className={styles.loginIcon} />
                    <div className={styles.loginText}>
                      <span className={styles.loginTitle}>
                        Giriş Yap / Üye Ol
                      </span>
                      <span className={styles.loginSub}>
                        Fırsatlardan yararlanmak için hemen giriş yapın
                      </span>
                    </div>
                  </button>
                )}
              </div>

              {/* Hızlı Kısayollar Grid (Favoriler, Tema, Bildirimler) */}
              <div className={styles.quickGrid}>
                <button
                  className={styles.quickItem}
                  onClick={() => handleLinkClick("/favorilerim")}
                >
                  <div className={styles.quickIconWrapper}>
                    <FiHeart className={styles.quickIcon} />
                    {wishlistCount > 0 && (
                      <span className={styles.badge}>{wishlistCount}</span>
                    )}
                  </div>
                  <span className={styles.quickLabel}>Favorilerim</span>
                </button>

                <div className={styles.quickItemTheme}>
                  <div className={styles.themeToggleBox}>
                    <ThemeToggle />
                  </div>
                  <span className={styles.quickLabel}>Tema</span>
                </div>

                <button
                  className={styles.quickItem}
                  onClick={() =>
                    handleLinkClick(
                      isAuthenticated
                        ? isAdmin
                          ? "/admin"
                          : "/panel"
                        : "/giris",
                    )
                  }
                >
                  <div className={styles.quickIconWrapper}>
                    <FiBell className={styles.quickIcon} />
                    {unreadCount > 0 && (
                      <span className={styles.badge}>{unreadCount}</span>
                    )}
                  </div>
                  <span className={styles.quickLabel}>Bildirimler</span>
                </button>
              </div>

              {/* Ana Sayfa & Navigasyon Bağlantıları */}
              <div className={styles.section}>
                <span className={styles.sectionTitle}>Gezinme</span>
                <nav className={styles.navList}>
                  <button
                    className={styles.navLink}
                    onClick={() => handleLinkClick("/")}
                  >
                    <FiHome className={styles.navIcon} />
                    <span>Ana Sayfa</span>
                  </button>
                  <button
                    className={styles.navLink}
                    onClick={() => handleLinkClick("/urunler")}
                  >
                    <FiGrid className={styles.navIcon} />
                    <span>Tüm Ürünler</span>
                  </button>
                  <button
                    className={styles.navLink}
                    onClick={() => handleLinkClick("/blog")}
                  >
                    <FiBookOpen className={styles.navIcon} />
                    <span>Blog & Yazılar</span>
                  </button>
                </nav>
              </div>

              {/* Kategoriler Akordeon */}
              {categories && categories.length > 0 && (
                <div className={styles.section}>
                  <span className={styles.sectionTitle}>Kategoriler</span>
                  <div className={styles.categoryTree}>
                    {categories.map((cat) => {
                      const hasChildren =
                        cat.children && cat.children.length > 0;
                      const isOpen = !!openCategories[cat.id];
                      const catName = cat.name || cat.label || "";

                      return (
                        <div key={cat.id} className={styles.catNode}>
                          <div className={styles.catRow}>
                            <button
                              className={styles.catNameBtn}
                              onClick={() =>
                                handleLinkClick(`/urunler?kategori=${cat.id}`)
                              }
                            >
                              {catName}
                            </button>

                            {hasChildren && (
                              <button
                                type="button"
                                className={styles.catToggleBtn}
                                onClick={() => toggleCategory(cat.id)}
                                aria-label={`${catName} alt kategorilerini göster`}
                              >
                                {isOpen ? (
                                  <FiChevronDown />
                                ) : (
                                  <FiChevronRight />
                                )}
                              </button>
                            )}
                          </div>

                          {/* Alt Kategoriler */}
                          <AnimatePresence>
                            {hasChildren && isOpen && (
                              <motion.div
                                className={styles.subCatList}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                {cat.children.map((child) => {
                                  const childName =
                                    child.name || child.label || "";
                                  const childHref =
                                    child.href ||
                                    `/urunler?kategori=${child.id}`;
                                  const hasSubChildren =
                                    child.children && child.children.length > 0;

                                  return (
                                    <div
                                      key={child.id || childName}
                                      className={styles.subCatItem}
                                    >
                                      <button
                                        className={styles.subCatLink}
                                        onClick={() =>
                                          handleLinkClick(childHref)
                                        }
                                      >
                                        • {childName}
                                      </button>

                                      {/* Seviye 3 Alt Kategoriler */}
                                      {hasSubChildren && (
                                        <div className={styles.level3List}>
                                          {child.children.map((sub) => (
                                            <button
                                              key={sub.id}
                                              className={styles.level3Link}
                                              onClick={() =>
                                                handleLinkClick(
                                                  `/urunler?kategori=${sub.id}`,
                                                )
                                              }
                                            >
                                              — {sub.name}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}