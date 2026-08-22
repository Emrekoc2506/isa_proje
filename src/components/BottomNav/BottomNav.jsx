import { Link, useLocation } from "react-router-dom";
import { FiHome, FiSearch, FiUser, FiMenu } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import styles from "./BottomNav.module.css";

export default function BottomNav({ onMenuClick }) {
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();

  const getProfilePath = () => {
    if (!isAuthenticated) return "/giris";
    return isAdmin ? "/admin" : "/panel";
  };

  const navItems = [
    {
      label: "Ana Sayfa",
      icon: <FiHome className={styles.icon} />,
      path: "/",
    },
    {
      label: "Ürünler",
      icon: <FiSearch className={styles.icon} />,
      path: "/urunler",
    },
    {
      label: isAuthenticated ? "Panelim" : "Giriş",
      icon: <FiUser className={styles.icon} />,
      path: getProfilePath(),
    },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className={styles.bottomNavContainer}>
      {/* ── Üst Rozet / Bilgi Çubuğu (Görsel ile Birebir) ── */}
      <div className={styles.topBadge}>
        <span>MADE WITH <span className={styles.heart}>❤️</span> IN TÜRKİYE</span>
      </div>

      {/* ── Mobil Bottom Navigation Bar ────────────────── */}
      <nav className={styles.bottomNav} aria-label="Mobil Gezinme Barı">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${active ? styles.active : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <div className={styles.iconWrapper}>{item.icon}</div>
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}

        {/* ── Menü Butonu (Kategori/Mobil Çekmece) ──────── */}
        <button
          type="button"
          onClick={onMenuClick}
          className={styles.navItem}
          aria-label="Mobil Menüyü Aç"
        >
          <div className={styles.iconWrapper}>
            <FiMenu className={styles.icon} />
          </div>
          <span className={styles.label}>Menü</span>
        </button>
      </nav>
    </div>
  );
}
