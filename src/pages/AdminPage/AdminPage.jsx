import styles from './AdminPage.module.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiPackage, FiFolder, FiMessageSquare, FiLogOut, FiMenu, FiX,
  FiShoppingCart, FiImage, FiTag, FiBox, FiUser, FiTrendingUp, FiBookOpen, FiStar
} from 'react-icons/fi';
import logoImage from '../../assets/images/logo.png';
import ChatUI from '../../components/ChatUI/ChatUI';
import ThemeToggle from '../../components/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// Import modular sections
import DashboardSection from './sections/DashboardSection';
import ProductsSection from './sections/ProductsSection';
import VariantsSection from './sections/VariantsSection';
import CategoriesSection from './sections/CategoriesSection';
import BannersSection from './sections/BannersSection';
import CouponsSection from './sections/CouponsSection';
import OrdersSection from './sections/OrdersSection';
import InventorySection from './sections/InventorySection';
import CustomersSection from './sections/CustomersSection';
import ReportsSection from './sections/ReportsSection';
import BlogAdminSection from './sections/BlogAdminSection';
import ReviewsSection from './sections/ReviewsSection';

const NAV_ITEMS = [
  { id: 'overview',   label: 'Yönetim Özeti',    icon: FiGrid },
  { id: 'products',   label: 'Ürün Yönetimi',    icon: FiPackage },
  { id: 'categories', label: 'Kategori Yönetimi', icon: FiFolder },
  { id: 'slides',     label: 'Billboard Yönetimi', icon: FiImage },
  { id: 'blog',       label: 'Blog Yönetimi',     icon: FiBookOpen },
  { id: 'reviews',    label: 'Yorum Yönetimi',    icon: FiStar },
  { id: 'orders',     label: 'Sipariş Takibi',   icon: FiShoppingCart },
  { id: 'messages',   label: 'Destek Mesajları',  icon: FiMessageSquare },
  { id: 'coupons',    label: 'Kupon Yönetimi',   icon: FiTag },
  { id: 'inventory',  label: 'Stok Yönetimi',    icon: FiBox },
  { id: 'customers',  label: 'Müşteri Hesapları', icon: FiUser },
  { id: 'reports',    label: 'Satış Raporları',  icon: FiTrendingUp },
];

export default function AdminPage() {
  const [active, setActive] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedChatUser, setSelectedChatUser] = useState(null); // { id, name }
  
  const { logout } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();

  const handleLogoutClick = async () => {
    await logout();
    navigate('/giris');
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
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
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarMobileOpen : ''} ${isLight ? styles.sidebarLight : styles.sidebarDark}`}>

        {/* ── ANİMASYON KATMANI (scroll etkilemez) ── */}
        <div className={styles.sidebarAnimBg} aria-hidden="true">

          {/* GECE MODU */}
          {!isLight && (<>
            {/* Ay */}
            <div className={styles.sidebarMoon}>
              <div className={styles.sidebarMoonHole} style={{ width: 9, height: 9, top: 14, left: 7 }} />
              <div className={styles.sidebarMoonHole} style={{ width: 5, height: 5, top: 24, left: 18 }} />
              <div className={styles.sidebarMoonHole} style={{ width: 4, height: 4, top: 10, left: 21 }} />
            </div>
            {/* Yıldızlar */}
            {[...Array(18)].map((_, i) => (
              <svg key={i} className={styles.sidebarStar} viewBox="0 0 20 20"
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
          </>)}

          {/* GÜNDÜZ MODU */}
          {isLight && (<>
            {/* Güneş */}
            <div className={styles.sidebarSun} />
            {/* Bulutlar — farklı boyut ve konumlarla dağıtılmış */}
            {[
              { top: '18%', left: '5%',  w: 70, h: 40, delay: '0s',    dur: '7s'  },
              { top: '16%', left: '25%', w: 50, h: 30, delay: '0.5s',  dur: '6s'  },
              { top: '20%', left: '45%', w: 40, h: 28, delay: '1s',    dur: '8s'  },
              { top: '42%', left: '8%',  w: 65, h: 38, delay: '1.5s',  dur: '7s'  },
              { top: '40%', left: '35%', w: 45, h: 30, delay: '0.3s',  dur: '9s'  },
              { top: '44%', left: '55%', w: 38, h: 24, delay: '2s',    dur: '6s'  },
              { top: '68%', left: '10%', w: 72, h: 42, delay: '0.8s',  dur: '8s'  },
              { top: '66%', left: '40%', w: 48, h: 32, delay: '1.8s',  dur: '7s'  },
              { top: '70%', left: '62%', w: 36, h: 22, delay: '2.5s',  dur: '9s'  },
              { top: '88%', left: '15%', w: 60, h: 36, delay: '1.2s',  dur: '6s'  },
            ].map((c, i) => (
              <div key={i} className={styles.sidebarCloud}
                style={{
                  top: c.top,
                  left: c.left,
                  width: c.w,
                  height: c.h,
                  animationDelay: c.delay,
                  animationDuration: c.dur,
                  opacity: 0.75,
                }}
              />
            ))}
          </>)}
        </div>

        {/* ── İÇERİK (scroll edilebilir) ── */}
        <div className={styles.sidebarInner}>
          <a href="/" className={styles.logoLink}>
            <img src={logoImage} alt="mysticvelora" className={styles.logoImg} />
            <span className={styles.brandName}>mysticvelora</span>
          </a>
          <div className={styles.badgeWrap} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
            <span className={styles.adminBadge}>Yönetici Paneli</span>
            <ThemeToggle id="admin-sidebar-theme-toggle" />
          </div>

          <nav className={styles.nav} aria-label="Yönetici Menüsü">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`${styles.navItem} ${active === item.id || (item.id === 'products' && active === 'variants') ? styles.navActive : ''}`}
                  onClick={() => { setActive(item.id); setSidebarOpen(false); }}
                >
                  <Icon className={styles.navIcon} />
                  <span>{item.label}</span>
                  {(active === item.id || (item.id === 'products' && active === 'variants')) && (
                    <motion.div className={styles.navIndicator} layoutId="admin-nav-indicator" />
                  )}
                </button>
              );
            })}
          </nav>

          <button onClick={handleLogoutClick} className={styles.logoutBtn} aria-label="Oturumu Kapat">
            <FiLogOut />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* ANA İÇERİK */}
      <main className={styles.main}>
        <header className={styles.topBar}>
          <button className={styles.hamburger} onClick={() => setSidebarOpen(v => !v)} aria-label="Menüyü Aç/Kapat">
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <h2 className={styles.pageTitle}>
            {NAV_ITEMS.find(n => n.id === active)?.label || 'Varyant Yönetimi'}
          </h2>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-dark)', padding: '6px 14px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-gold)' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gold-light)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
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
              style={{ height: active === 'messages' ? '100%' : 'auto' }}
            >
              {active === 'overview' && <DashboardSection />}
              
              {active === 'products' && (
                <ProductsSection 
                  onSelectProductForVariants={(p) => {
                    setSelectedProduct(p);
                    setActive('variants');
                  }} 
                />
              )}

              {active === 'variants' && (
                <VariantsSection 
                  product={selectedProduct} 
                  onBack={() => setActive('products')} 
                />
              )}

              {active === 'categories' && <CategoriesSection />}
              
              {active === 'slides' && <BannersSection />}
              
              {active === 'blog' && <BlogAdminSection />}
              
              {active === 'reviews' && <ReviewsSection />}
              
              {active === 'orders' && <OrdersSection />}
              
              {active === 'messages' && <ChatUI key={selectedChatUser?.id ?? 'all'} isAdmin={true} initialUserId={selectedChatUser?.id} initialUserName={selectedChatUser?.name} />}

              {active === 'coupons' && <CouponsSection />}

              {active === 'inventory' && <InventorySection />}

              {active === 'customers' && (
                <CustomersSection
                  onMessageUser={(userId, userName) => {
                    setSelectedChatUser({ id: userId, name: userName });
                    setActive('messages');
                  }}
                />
              )}

              {active === 'reports' && <ReportsSection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
