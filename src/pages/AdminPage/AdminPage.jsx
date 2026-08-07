import styles from "./AdminPage.module.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiGrid,
  FiPackage,
  FiFolder,
  FiMessageSquare,
  FiLogOut,
  FiMenu,
  FiX,
  FiShoppingCart,
  FiImage,
  FiTag,
  FiBox,
  FiUser,
  FiTrendingUp,
  FiBookOpen,
  FiStar,
} from "react-icons/fi";
import ChatUI from "../../components/ChatUI/ChatUI";
import ThemeToggle from "../../components/ThemeToggle";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

// Import modular sections
import DashboardSection from "./sections/DashboardSection";
import ProductsSection from "./sections/ProductsSection";
import VariantsSection from "./sections/VariantsSection";
import CategoriesSection from "./sections/CategoriesSection";
import BannersSection from "./sections/BannersSection";
import CouponsSection from "./sections/CouponsSection";
import OrdersSection from "./sections/OrdersSection";
import InventorySection from "./sections/InventorySection";
import CustomersSection from "./sections/CustomersSection";
import ReportsSection from "./sections/ReportsSection";
import BlogAdminSection from "./sections/BlogAdminSection";
import ReviewsSection from "./sections/ReviewsSection";

const NAV_ITEMS = [
  { id: "overview", label: "Yönetim Özeti", icon: FiGrid },
  { id: "products", label: "Ürün Yönetimi", icon: FiPackage },
  { id: "categories", label: "Kategori Yönetimi", icon: FiFolder },
  { id: "slides", label: "Billboard Yönetimi", icon: FiImage },
  { id: "blog", label: "Blog Yönetimi", icon: FiBookOpen },
  { id: "reviews", label: "Yorum Yönetimi", icon: FiStar },
  { id: "orders", label: "Sipariş Takibi", icon: FiShoppingCart },
  { id: "messages", label: "Destek Mesajları", icon: FiMessageSquare },
  { id: "coupons", label: "Kupon Yönetimi", icon: FiTag },
  { id: "inventory", label: "Stok Yönetimi", icon: FiBox },
  { id: "customers", label: "Müşteri Hesapları", icon: FiUser },
  { id: "reports", label: "Satış Raporları", icon: FiTrendingUp },
];

export default function AdminPage() {
  const [active, setActive] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedChatUser, setSelectedChatUser] = useState(null); // { id, name }

  const { logout } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const navigate = useNavigate();

  const handleLogoutClick = async () => {
    await logout();
    navigate("/giris");
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" },
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  return (
    <div className={styles.page}>
      {/* Mobil Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarMobileOpen : ""} ${isLight ? styles.sidebarLight : styles.sidebarDark}`}
        style={
          isLight
            ? {
                background:
                  "linear-gradient(180deg, #4bbfe8 0%, #62cff0 40%, #7dd9f5 100%)",
              }
            : undefined
        }
      >
        {/* ── ANİMASYON KATMANI (scroll etkilemez) ── */}
        <div className={styles.sidebarAnimBg} aria-hidden="true">
          {/* GECE MODU */}
          {!isLight && (
            <>
              {/* Ay */}
              <div className={styles.sidebarMoon}>
                <div
                  className={styles.sidebarMoonHole}
                  style={{ width: 9, height: 9, top: 14, left: 7 }}
                />
                <div
                  className={styles.sidebarMoonHole}
                  style={{ width: 5, height: 5, top: 24, left: 18 }}
                />
                <div
                  className={styles.sidebarMoonHole}
                  style={{ width: 4, height: 4, top: 10, left: 21 }}
                />
              </div>
              {/* Yıldızlar */}
              {[...Array(18)].map((_, i) => (
                <svg
                  key={i}
                  className={styles.sidebarStar}
                  viewBox="0 0 20 20"
                  style={{
                    top: `${Math.floor((i * 37 + 11) % 92)}%`,
                    left: `${Math.floor((i * 53 + 7) % 85)}%`,
                    width: `${8 + (i % 5) * 3}px`,
                    animationDelay: `${(i * 0.37).toFixed(2)}s`,
                    animationDuration: `${2 + (i % 4) * 0.5}s`,
                  }}
                >
                  <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
                </svg>
              ))}
            </>
          )}

          {/* GÜNDÜZ MODU */}
          {isLight && (
            <>
              {/* Güneş */}
              <div className={styles.sidebarSun} />
              {/* Bulut 1 — sol üst, büyük */}
              <div
                className={styles.sidebarCloudShape}
                style={{
                  top: "8%",
                  left: "-10px",
                  animationDuration: "7s",
                  animationDelay: "0s",
                }}
              >
                <div className={styles.sidebarCloudBase} />
                <div className={styles.sidebarCloudBump1} />
                <div className={styles.sidebarCloudBump2} />
                <div className={styles.sidebarCloudBump3} />
              </div>
              {/* Bulut 2 — sol orta, küçük */}
              <div
                className={styles.sidebarCloudShape}
                style={{
                  top: "38%",
                  left: "-20px",
                  animationDuration: "9s",
                  animationDelay: "2s",
                  transform: "scale(0.65)",
                }}
              >
                <div className={styles.sidebarCloudBase} />
                <div className={styles.sidebarCloudBump1} />
                <div className={styles.sidebarCloudBump2} />
                <div className={styles.sidebarCloudBump3} />
              </div>
              {/* Bulut 3 — sol alt, orta */}
              <div
                className={styles.sidebarCloudShape}
                style={{
                  top: "68%",
                  left: "-15px",
                  animationDuration: "8s",
                  animationDelay: "1s",
                  transform: "scale(0.8)",
                }}
              >
                <div className={styles.sidebarCloudBase} />
                <div className={styles.sidebarCloudBump1} />
                <div className={styles.sidebarCloudBump2} />
                <div className={styles.sidebarCloudBump3} />
              </div>
            </>
          )}
        </div>

        {/* ── İÇERİK (scroll edilebilir) ── */}
        <div className={styles.sidebarInner}>
          <div
            className={styles.badgeWrap}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              gap: "8px",
            }}
          >
            <span className={styles.adminBadge}>Yönetici Paneli</span>
            <ThemeToggle id="admin-sidebar-theme-toggle" />
          </div>

          <nav className={styles.nav} aria-label="Yönetici Menüsü">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`${styles.navItem} ${active === item.id || (item.id === "products" && active === "variants") ? styles.navActive : ""}`}
                  onClick={() => {
                    setActive(item.id);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon className={styles.navIcon} />
                  <span>{item.label}</span>
                  {(active === item.id ||
                    (item.id === "products" && active === "variants")) && (
                    <motion.div
                      className={styles.navIndicator}
                      layoutId="admin-nav-indicator"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <button
            onClick={handleLogoutClick}
            className={styles.logoutBtn}
            aria-label="Oturumu Kapat"
          >
            <FiLogOut />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* ANA İÇERİK */}
      <main className={styles.main}>
        <header className={styles.topBar}>
          <button
            className={styles.hamburger}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Menüyü Aç/Kapat"
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <h2 className={styles.pageTitle}>
            {NAV_ITEMS.find((n) => n.id === active)?.label ||
              "Varyant Yönetimi"}
          </h2>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "var(--bg-dark)",
              padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--border-gold)",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "var(--gold-light)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Tema
            </span>
            <ThemeToggle id="admin-topbar-theme-toggle" />
          </div>
        </header>

        <div className={styles.content}>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ height: active === "messages" ? "100%" : "auto" }}
            >
              {active === "overview" && <DashboardSection />}

              {active === "products" && <ProductsSection />}

              {active === "categories" && <CategoriesSection />}

              {active === "slides" && <BannersSection />}

              {active === "blog" && <BlogAdminSection />}

              {active === "reviews" && <ReviewsSection />}

              {active === "orders" && <OrdersSection />}

              {active === "messages" && (
                <ChatUI
                  key={selectedChatUser?.id ?? "all"}
                  isAdmin={true}
                  initialUserId={selectedChatUser?.id}
                  initialUserName={selectedChatUser?.name}
                />
              )}

              {active === "coupons" && <CouponsSection />}

              {active === "inventory" && <InventorySection />}

              {active === "customers" && (
                <CustomersSection
                  onMessageUser={(userId, userName) => {
                    setSelectedChatUser({ id: userId, name: userName });
                    setActive("messages");
                  }}
                />
              )}

              {active === "reports" && <ReportsSection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
