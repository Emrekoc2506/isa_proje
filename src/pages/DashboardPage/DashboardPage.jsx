import styles from './DashboardPage.module.css';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiPackage, FiHeart, FiUser, FiSettings,
  FiLogOut, FiMenu, FiX, FiShoppingCart, FiChevronRight,
  FiMapPin, FiBell, FiTrash2, FiMessageSquare, FiLoader
} from 'react-icons/fi';
import logoImage from '../../assets/images/logo-2.png';
import { getMyOrders } from '../../services/orderApi';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import ChatUI from '../../components/ChatUI/ChatUI';
import NotificationDropdown from '../../components/NotificationDropdown/NotificationDropdown';
import AddressesSection from './AddressesSection';
import * as accountApi from '../../services/accountApi';

const NAV_ITEMS = [
  { id: 'overview',  label: 'Genel Bakış',   icon: FiGrid },
  { id: 'messages',  label: 'Mesajlarım',    icon: FiMessageSquare },
  { id: 'orders',    label: 'Siparişlerim',  icon: FiPackage },
  { id: 'wishlist',  label: 'Favorilerim',   icon: FiHeart },
  { id: 'addresses', label: 'Adreslerim',    icon: FiMapPin },
  { id: 'settings',  label: 'Ayarlar',       icon: FiSettings },
];

export default function DashboardPage({ activeTab = 'overview' }) {
  const [active, setActive] = useState(activeTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  
  const { items: wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { unreadCount } = useNotifications();
  const { user, logout, reloadUser } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  const navigate = useNavigate();
  const { id: routeOrderId } = useParams();

  // API State'leri
  const [ordersList, setOrdersList] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Settings form states
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confPass, setConfPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState('');

  // Email Değiştirme State'leri
  const [newEmail, setNewEmail] = useState('');
  const [emailConfirmPassword, setEmailConfirmPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Telefon formatı maskesi (ozel_hoca projesinden esinlenilmiştir)
  const handlePhoneChange = (value) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = digits.substring(1);
    digits = digits.substring(0, 10);
    let res = '';
    if (digits.length > 0) res += digits.substring(0, 3);
    if (digits.length > 3) res += ' ' + digits.substring(3, 6);
    if (digits.length > 6) res += ' ' + digits.substring(6, 8);
    if (digits.length > 8) res += ' ' + digits.substring(8, 10);
    setProfilePhone(res);
    if (profileError) setProfileError('');
    if (profileSuccess) setProfileSuccess(false);
  };

  // Şifre Gücü Analizi
  const getPasswordStrength = useCallback((pass) => {
    if (!pass) return { score: 0, text: '', color: 'transparent' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score, text: 'Zayıf Şifre', color: '#e05594' };
    if (score <= 4) return { score, text: 'Orta Derece Şifre', color: '#f39c12' };
    return { score, text: 'Güçlü Şifre', color: '#2ecc71' };
  }, []);

  useEffect(() => {
    setActive(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      setProfileName(user.fullName || '');
      setProfilePhone(user.phoneNumber || '');
    }
  }, [user]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const ordersData = await getMyOrders();
      if (ordersData) {
        // Siparişleri haritala
        const mapped = ordersData.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber || o.id.substring(0, 8).toUpperCase(),
          date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR'),
          total: (o.totalAmount || o.grandTotal || 0) + ' ₺',
          status: o.statusText || 'Sipariş Verildi',
          statusCode: String(o.status || 'placed').toLowerCase(),
          items: (o.items || []).map(it => ({
            name: it.productName || "Mistik Ürün",
            qty: it.quantity,
            price: (it.unitPrice || 0) + ' ₺'
          }))
        }));
        setOrdersList(mapped);
      }
    } catch (err) {
      console.error("Dashboard sipariş yükleme hatası:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, active]);

  const handleLogoutClick = async () => {
    await logout();
    navigate('/giris');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
    setProfileLoading(true);

    try {
      await accountApi.updateProfile({
        fullName: profileName,
        phoneNumber: profilePhone
      });
      await reloadUser();
      setProfileSuccess(true);
    } catch (err) {
      let errorMessage = err.message || 'Profil güncellenemedi.';
      if (err.errors) {
        errorMessage = Object.entries(err.errors)
          .map(([key, value]) => `${key}: ${value.join(', ')}`)
          .join(' | ');
      }
      setProfileError(errorMessage);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess(false);

    if (newPass.length < 8) {
      setPassError("Yeni şifre en az 8 karakter olmalıdır.");
      return;
    }

    if (newPass !== confPass) {
      setPassError("Yeni şifreler uyuşmuyor.");
      return;
    }

    setPassLoading(true);

    try {
      await accountApi.changePassword({
        currentPassword: curPass,
        newPassword: newPass,
        confirmPassword: confPass
      });
      setPassSuccess(true);
      setCurPass('');
      setNewPass('');
      setConfPass('');
    } catch (err) {
      let errorMessage = err.message || 'Şifre değiştirilemedi.';
      if (err.errors) {
        errorMessage = Object.entries(err.errors)
          .map(([key, value]) => `${key}: ${value.join(', ')}`)
          .join(' | ');
      }
      setPassError(errorMessage);
    } finally {
      setPassLoading(false);
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess(false);

    if (!newEmail || !newEmail.includes('@')) {
      setEmailError('Geçerli bir yeni e-posta adresi giriniz.');
      return;
    }

    if (newEmail.toLowerCase() === (user?.email || '').toLowerCase()) {
      setEmailError('Yeni e-posta adresi mevcut e-posta adresinizle aynı olamaz.');
      return;
    }

    if (!emailConfirmPassword) {
      setEmailError('Güvenlik doğrulaması için mevcut şifrenizi giriniz.');
      return;
    }

    setEmailLoading(true);

    try {
      await accountApi.changeEmail({
        newEmail,
        currentPassword: emailConfirmPassword
      });
      await reloadUser();
      setEmailSuccess(true);
      setNewEmail('');
      setEmailConfirmPassword('');
    } catch (err) {
      let errorMessage = err.message || 'E-posta adresi güncellenemedi.';
      if (err.errors) {
        errorMessage = Object.entries(err.errors)
          .map(([key, value]) => `${key}: ${value.join(', ')}`)
          .join(' | ');
      }
      setEmailError(errorMessage);
    } finally {
      setEmailLoading(false);
    }
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('')
    : "M";

  const contentVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  const displayName = user?.fullName || "Müşteri";
  const displayEmail = user?.email || "";

  return (
    <div className={styles.page}>

      {/* MOBİL SIDEBAR OVERLAY */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarMobileOpen : ''} ${isLight ? styles.sidebarLight : styles.sidebarDark}`}
        style={isLight ? { background: 'linear-gradient(180deg, #4bbfe8 0%, #62cff0 40%, #7dd9f5 100%)' } : undefined}
      >
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
                <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
              </svg>
            ))}
          </>)}

          {/* GÜNDÜZ MODU */}
          {isLight && (<>
            {/* Güneş */}
            <div className={styles.sidebarSun} />
            {/* Bulut 1 — sol üst, büyük */}
            <div className={styles.sidebarCloudShape} style={{ top: '8%', left: '-10px', animationDuration: '7s', animationDelay: '0s' }}>
              <div className={styles.sidebarCloudBase} />
              <div className={styles.sidebarCloudBump1} />
              <div className={styles.sidebarCloudBump2} />
              <div className={styles.sidebarCloudBump3} />
            </div>
            {/* Bulut 2 — sol orta, küçük */}
            <div className={styles.sidebarCloudShape} style={{ top: '38%', left: '-20px', animationDuration: '9s', animationDelay: '2s', transform: 'scale(0.65)' }}>
              <div className={styles.sidebarCloudBase} />
              <div className={styles.sidebarCloudBump1} />
              <div className={styles.sidebarCloudBump2} />
              <div className={styles.sidebarCloudBump3} />
            </div>
            {/* Bulut 3 — sol alt, orta */}
            <div className={styles.sidebarCloudShape} style={{ top: '68%', left: '-15px', animationDuration: '8s', animationDelay: '1s', transform: 'scale(0.8)' }}>
              <div className={styles.sidebarCloudBase} />
              <div className={styles.sidebarCloudBump1} />
              <div className={styles.sidebarCloudBump2} />
              <div className={styles.sidebarCloudBump3} />
            </div>
          </>)}
        </div>

        {/* ── İÇERİK (scroll edilebilir) ── */}
        <div className={styles.sidebarInner}>
          {/* Logo */}
          <a href="/" className={styles.sidebarLogo}>
            <img src={logoImage} alt="muhristan" className={styles.sidebarLogoImg} />
            <span className={styles.sidebarBrand}>muhristan</span>
          </a>

          {/* Badge & Theme Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
            <span className={styles.memberBadge}>Müşteri Paneli</span>
            <ThemeToggle id="customer-sidebar-theme-toggle" />
          </div>

          {/* Profil Özeti */}
          <div className={styles.profileCard}>
            <div className={styles.avatar}>
              <span className={styles.avatarInitials}>{initials}</span>
              <div className={styles.avatarGlow} aria-hidden="true" />
            </div>
            <div className={styles.profileInfo}>
              <p className={styles.profileName}>{displayName}</p>
              <p className={styles.profileEmail}>{displayEmail}</p>
            </div>
          </div>

          {/* Navigasyon */}
          <nav className={styles.nav} aria-label="Panel navigasyonu">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`${styles.navItem} ${active === id ? styles.navActive : ''}`}
                onClick={() => {
                  setActive(id);
                  navigate(`/${id === 'overview' ? 'panel' : id === 'wishlist' ? 'favorilerim' : id === 'profile' ? 'profilim' : id === 'orders' ? 'siparislerim' : id === 'addresses' ? 'adreslerim' : id === 'messages' ? 'panel' : 'ayarlar'}`);
                  setSidebarOpen(false);
                  window.scrollTo(0, 0);
                  document.documentElement.scrollTop = 0;
                  document.body.scrollTop = 0;
                }}
              >
                <Icon className={styles.navIcon} />
                <span>{label}</span>
                {active === id && (
                  <motion.div className={styles.navIndicator} layoutId="nav-indicator" />
                )}
              </button>
            ))}
          </nav>

          {/* Çıkış */}
          <button
            className={styles.logoutBtn}
            onClick={handleLogoutClick}
            aria-label="Çıkış yap"
          >
            <FiLogOut />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* ANA İÇERIK */}
      <main className={styles.main}>

        {/* Üst Bar */}
        <header className={styles.topBar}>
          <button
            className={styles.hamburger}
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Menüyü aç"
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <h1 className={styles.pageTitle}>
            {NAV_ITEMS.find(n => n.id === active)?.label || 'Panel'}
          </h1>
          <div className={styles.topBarActions}>
            <div style={{ position: 'relative' }}>
              <button 
                id="btn-notifications"
                className={styles.iconBtn} 
                aria-label="Bildirimler"
                onClick={() => setNotifOpen(v => !v)}
              >
                <FiBell />
                {unreadCount > 0 && (
                  <span className={styles.notifBadgeDashboard}>{unreadCount}</span>
                )}
              </button>
              <NotificationDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>
            
            <a href="/" className={styles.iconBtn} aria-label="Mağazaya dön">
              <FiShoppingCart />
            </a>
          </div>
        </header>

        {/* İçerik Alanı */}
        <div className={styles.content}>
          <AnimatePresence mode="wait">

            {/* ── GENEL BAKIŞ ────────────────────────────────── */}
            {active === 'overview' && (
              <motion.div key="overview" variants={contentVariants} initial="hidden" animate="visible" exit="exit">
                <div className={styles.welcomeBanner}>
                  <div>
                    <h2 className={styles.welcomeTitle}>Hoş geldin, {displayName.split(' ')[0]}! ✨</h2>
                    <p className={styles.welcomeSub}>Mistik alışveriş deneyimine hazır mısın?</p>
                  </div>
                  <a href="/urunler" className={styles.shopBtn}>
                    Alışverişe Devam Et <FiChevronRight />
                  </a>
                </div>

                {/* İstatistik Kartları */}
                <div className={styles.statsGrid}>
                  {[
                    { id: 'orders', label: 'Toplam Sipariş', value: ordersList.length, icon: '📦', color: 'var(--gold)' },
                    { id: 'wishlist', label: 'Favori Ürünler', value: wishlist.length, icon: '♥', color: '#e05594' }
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.id}
                      className={styles.statCard}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      style={{ '--stat-color': stat.color }}
                      onClick={() => setActive(stat.id)}
                    >
                      <span className={styles.statIcon}>{stat.icon}</span>
                      <div className={styles.statContent}>
                        <p className={styles.statValue}>{stat.value}</p>
                        <p className={styles.statLabel}>{stat.label}</p>
                      </div>
                      <div className={styles.statGlow} aria-hidden="true" />
                    </motion.div>
                  ))}
                </div>

                {/* Son Siparişler */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Son Siparişler</h3>
                    <button className={styles.seeAllBtn} onClick={() => { setActive('orders'); navigate('/siparislerim'); }}>
                      Tümünü Gör <FiChevronRight />
                    </button>
                  </div>
                  {loadingOrders ? (
                    <p className={styles.emptyText}>Yükleniyor...</p>
                  ) : (
                    <>
                      {ordersList.slice(0, 2).map(order => (
                        <OrderRow key={order.id} order={order} compact />
                      ))}
                      {ordersList.length === 0 && (
                        <p className={styles.emptyText} style={{ textAlign: 'center', padding: '16px' }}>Henüz siparişiniz bulunmamaktadır.</p>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── SİPARİŞLER ─────────────────────────────────── */}
            {active === 'orders' && (
              <motion.div key="orders" variants={contentVariants} initial="hidden" animate="visible" exit="exit">
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Tüm Siparişlerim</h3>
                    <span className={styles.sectionCount}>{ordersList.length} sipariş</span>
                  </div>
                  {loadingOrders ? (
                    <p className={styles.emptyText}>Yükleniyor...</p>
                  ) : (
                    <>
                      {ordersList.map(order => (
                        <OrderRow key={order.id} order={order} initialOpen={routeOrderId === order.id} />
                      ))}
                      {ordersList.length === 0 && (
                        <div className={styles.emptyState}>
                          <span className={styles.emptyIcon}>📦</span>
                          <p>Henüz sipariş vermediniz.</p>
                          <a href="/urunler" className={styles.shopBtn}>Ürünleri Keşfet</a>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── FAVORİLER ──────────────────────────────────── */}
            {active === 'wishlist' && (
              <motion.div key="wishlist" variants={contentVariants} initial="hidden" animate="visible" exit="exit">
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Favori Ürünlerim</h3>
                    <span className={styles.sectionCount}>{wishlist.length} ürün</span>
                  </div>
                  {wishlist.length === 0 ? (
                    <div className={styles.emptyState}>
                      <span className={styles.emptyIcon}>♥</span>
                      <p>Henüz favori ürün eklemediniz.</p>
                      <a href="/urunler" className={styles.shopBtn}>Alışverişe Başla</a>
                    </div>
                  ) : (
                    <div className={styles.wishlistGrid}>
                      {wishlist.map((item, i) => (
                        <motion.div
                          key={item.id}
                          className={styles.wishCard}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          layout
                        >
                          <img src={item.image} alt={item.name} className={styles.wishImg} />
                          <div className={styles.wishInfo}>
                            <p className={styles.wishName}>{item.name}</p>
                            <p className={styles.wishPrice}>{item.price}</p>
                          </div>
                          <div className={styles.wishActions}>
                            <button 
                              className={styles.wishCartBtn} 
                              aria-label="Sepete ekle"
                              onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, image: item.image })}
                            >
                              <FiShoppingCart /> Sepete Ekle
                            </button>
                            <button
                              className={styles.wishRemoveBtn}
                              onClick={() => removeFromWishlist(item.id)}
                              aria-label="Favorilerden çıkar"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── MESAJLARIM ─────────────────────────────────── */}
            {active === 'messages' && (
              <motion.div key="messages" variants={contentVariants} initial="hidden" animate="visible" exit="exit" style={{ height: '100%' }}>
                <ChatUI />
              </motion.div>
            )}

            {/* ── ADRESLERİM ─────────────────────────────────── */}
            {active === 'addresses' && (
              <motion.div key="addresses" variants={contentVariants} initial="hidden" animate="visible" exit="exit">
                <AddressesSection />
              </motion.div>
            )}

            {/* ── AYARLAR ────────────────────────────────────── */}
            {(active === 'settings' || active === 'profile') && (
              <motion.div key="settings" variants={contentVariants} initial="hidden" animate="visible" exit="exit">
                {/* Profil Bilgilerini Güncelle */}
                <div className={styles.sectionCard} style={{ marginBottom: 20 }}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Profilimi Güncelle</h3>
                  </div>
                  <form onSubmit={handleProfileUpdate} className={styles.profileForm}>
                    {profileSuccess && <div style={{ color: '#2ecc71', fontSize: 13, marginBottom: 16 }}>✔ Profil bilgileriniz başarıyla güncellendi.</div>}
                    {profileError && <div style={{ color: '#e05594', fontSize: 13, marginBottom: 16 }}>{profileError}</div>}
                    
                    <div className={styles.formGrid}>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Ad Soyad</label>
                        <input 
                          type="text" 
                          required 
                          value={profileName} 
                          onChange={e => {
                            setProfileName(e.target.value);
                            if (profileError) setProfileError('');
                            if (profileSuccess) setProfileSuccess(false);
                          }} 
                          className={styles.fieldInput} 
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Telefon</label>
                        <input 
                          type="tel" 
                          value={profilePhone} 
                          onChange={e => handlePhoneChange(e.target.value)} 
                          className={styles.fieldInput} 
                          placeholder="Örn: 555 000 00 00" 
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={profileLoading} className={styles.shopBtn} style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {profileLoading && <FiLoader className={styles.spinner} style={{ animation: 'spin 1.5s linear infinite', fontSize: 14, margin: 0 }} />}
                      Değişiklikleri Kaydet
                    </button>
                  </form>
                </div>

                {/* E-posta Adresi Değiştir */}
                <div className={styles.sectionCard} style={{ marginBottom: 20 }}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>E-posta Adresi Değiştir</h3>
                  </div>
                  <form onSubmit={handleEmailChange} className={styles.profileForm}>
                    {emailSuccess && <div style={{ color: '#2ecc71', fontSize: 13, marginBottom: 16 }}>✔ E-posta adresiniz başarıyla güncellendi.</div>}
                    {emailError && <div style={{ color: '#e05594', fontSize: 13, marginBottom: 16 }}>{emailError}</div>}
                    
                    <div className={styles.formGrid}>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Mevcut E-posta</label>
                        <input 
                          type="email" 
                          value={user?.email || ''} 
                          readOnly 
                          className={styles.fieldInput} 
                          style={{ opacity: 0.7, cursor: 'not-allowed' }}
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Yeni E-posta Adresi</label>
                        <input 
                          type="email" 
                          required 
                          value={newEmail} 
                          onChange={e => {
                            setNewEmail(e.target.value);
                            if (emailError) setEmailError('');
                            if (emailSuccess) setEmailSuccess(false);
                          }} 
                          className={styles.fieldInput} 
                          placeholder="yeni@eposta.com"
                        />
                      </div>
                      <div className={styles.formField} style={{ gridColumn: '1 / -1' }}>
                        <label className={styles.fieldLabel}>Mevcut Şifreniz (Güvenlik Doğrulaması)</label>
                        <input 
                          type="password" 
                          required 
                          value={emailConfirmPassword} 
                          onChange={e => {
                            setEmailConfirmPassword(e.target.value);
                            if (emailError) setEmailError('');
                            if (emailSuccess) setEmailSuccess(false);
                          }} 
                          className={styles.fieldInput} 
                          placeholder="Mevcut şifreniz"
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={emailLoading} className={styles.shopBtn} style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {emailLoading && <FiLoader className={styles.spinner} style={{ animation: 'spin 1.5s linear infinite', fontSize: 14, margin: 0 }} />}
                      E-posta Adresini Güncelle
                    </button>
                  </form>
                </div>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Şifre Değiştir</h3>
                  </div>
                  <form onSubmit={handlePasswordChange} className={styles.profileForm}>
                    {passSuccess && <div style={{ color: '#2ecc71', fontSize: 13, marginBottom: 16 }}>✔ Şifreniz başarıyla değiştirildi.</div>}
                    {passError && <div style={{ color: '#e05594', fontSize: 13, marginBottom: 16 }}>{passError}</div>}
                    
                    <div className={styles.formGrid}>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Mevcut Şifre</label>
                        <input 
                          type="password" 
                          required 
                          value={curPass} 
                          onChange={e => {
                            setCurPass(e.target.value);
                            if (passError) setPassError('');
                            if (passSuccess) setPassSuccess(false);
                          }} 
                          className={styles.fieldInput} 
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Yeni Şifre</label>
                        <input 
                          type="password" 
                          required 
                          value={newPass} 
                          onChange={e => {
                            setNewPass(e.target.value);
                            if (passError) setPassError('');
                            if (passSuccess) setPassSuccess(false);
                          }} 
                          className={styles.fieldInput} 
                        />
                        
                        {newPass && (() => {
                          const strength = getPasswordStrength(newPass);
                          return (
                            <div style={{ marginTop: 6, paddingLeft: 4 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{ fontSize: '11px', color: strength.color, fontWeight: '600', transition: 'color 0.3s' }}>
                                  {strength.text}
                                </span>
                              </div>
                              <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ 
                                  width: `${(strength.score / 5) * 100}%`, 
                                  height: '100%', 
                                  backgroundColor: strength.color, 
                                  transition: 'width 0.3s ease, background-color 0.3s ease',
                                  boxShadow: `0 0 8px ${strength.color}`
                                }} />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Yeni Şifre Tekrar</label>
                        <input 
                          type="password" 
                          required 
                          value={confPass} 
                          onChange={e => {
                            setConfPass(e.target.value);
                            if (passError) setPassError('');
                            if (passSuccess) setPassSuccess(false);
                          }} 
                          className={styles.fieldInput} 
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={passLoading} className={styles.shopBtn} style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {passLoading && <FiLoader className={styles.spinner} style={{ animation: 'spin 1.5s linear infinite', fontSize: 14, margin: 0 }} />}
                      Şifreyi Güncelle
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ── Sipariş Satırı Alt Bileşeni ──────────────────────────────
function OrderRow({ order, compact, initialOpen = false }) {
  const [open, setOpen] = useState(initialOpen);
  
  // Placed is always Placed
  const cfg = { label: order.status || 'Sipariş Verildi', color: 'var(--gold)' };

  return (
    <div className={styles.orderRow}>
      <div className={styles.orderHeader} onClick={() => !compact && setOpen(v => !v)} style={{ cursor: compact ? 'default' : 'pointer' }}>
        <div className={styles.orderMeta}>
          <span className={styles.orderNumber} style={{ color: 'var(--gold-light)', fontWeight: 600 }}>#{order.orderNumber}</span>
          <span className={styles.orderDate}>{order.date}</span>
        </div>
        <div className={styles.orderRight}>
          <span className={styles.statusBadge} style={{ '--status-color': cfg.color }}>
            {cfg.label}
          </span>
          <span className={styles.orderTotal}>{order.total}</span>
          {!compact && (
            <motion.span
              className={styles.orderChevron}
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <FiChevronRight />
            </motion.span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {(!compact && open) && (
          <motion.div
            className={styles.orderItems}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {order.items.map((item, i) => (
              <div key={i} className={styles.orderItem} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className={styles.orderItemName} style={{ color: 'var(--text-light)' }}>{item.name}</span>
                <div style={{ display: 'flex', gap: 20 }}>
                  <span className={styles.orderItemQty} style={{ color: 'var(--text-muted)' }}>{item.qty} adet</span>
                  <span className={styles.orderItemPrice} style={{ color: 'var(--gold-light)', fontWeight: 500 }}>{item.price}</span>
                </div>
              </div>
            ))}
            <div style={{ padding: '8px 0', fontSize: 11, color: 'var(--text-muted)' }}>
              Sipariş ID: {order.id}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
