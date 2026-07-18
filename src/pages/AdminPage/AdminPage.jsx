import styles from './AdminPage.module.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiPackage, FiFolder, FiMessageSquare, FiLogOut, FiMenu, FiX,
  FiShoppingCart, FiImage, FiTag, FiBox, FiUser, FiTrendingUp
} from 'react-icons/fi';
import logoImage from '../../assets/images/logo.png';
import ChatUI from '../../components/ChatUI/ChatUI';
import { useAuth } from '../../context/AuthContext';

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

const NAV_ITEMS = [
  { id: 'overview',   label: 'Yönetim Özeti',    icon: FiGrid },
  { id: 'products',   label: 'Ürün Yönetimi',    icon: FiPackage },
  { id: 'categories', label: 'Kategori Yönetimi', icon: FiFolder },
  { id: 'slides',     label: 'Afiş/İlan Yönetimi', icon: FiImage },
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
  
  const { logout } = useAuth();
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
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarMobileOpen : ''}`}>
        <a href="/" className={styles.logoLink}>
          <img src={logoImage} alt="mysticvelora" className={styles.logoImg} />
          <span className={styles.brandName}>mysticvelora</span>
        </a>
        <div className={styles.badgeWrap}>
          <span className={styles.adminBadge}>Yönetici Paneli</span>
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
              
              {active === 'orders' && <OrdersSection />}
              
              {active === 'messages' && <ChatUI isAdmin={true} />}

              {active === 'coupons' && <CouponsSection />}

              {active === 'inventory' && <InventorySection />}

              {active === 'customers' && <CustomersSection />}

              {active === 'reports' && <ReportsSection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
