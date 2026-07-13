import styles from './DashboardPage.module.css';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiPackage, FiHeart, FiUser, FiSettings,
  FiLogOut, FiMenu, FiX, FiShoppingCart, FiChevronRight,
  FiMapPin, FiBell, FiTrash2, FiMessageSquare, FiLoader
} from 'react-icons/fi';
import logoImage from '../../assets/images/logo.png';
import { getMyOrders } from '../../services/orderApi';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
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
  { id: 'profile',   label: 'Profilim',      icon: FiUser },
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
      setProfileError(err.message || 'Profil güncellenemedi.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess(false);

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
      setPassError(err.message || 'Şifre değiştirilemedi.');
    } finally {
      setPassLoading(false);
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
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarMobileOpen : ''}`}>
        {/* Logo */}
        <a href="/" className={styles.sidebarLogo}>
          <img src={logoImage} alt="mysticvelora" className={styles.sidebarLogoImg} />
          <span className={styles.sidebarBrand}>mysticvelora</span>
        </a>

        {/* Profil Özeti */}
        <div className={styles.profileCard}>
          <div className={styles.avatar}>
            <span className={styles.avatarInitials}>{initials}</span>
            <div className={styles.avatarGlow} aria-hidden="true" />
          </div>
          <div className={styles.profileInfo}>
            <p className={styles.profileName}>{displayName}</p>
            <p className={styles.profileEmail}>{displayEmail}</p>
            <span className={styles.memberBadge}>Kayıtlı Üye</span>
          </div>
        </div>

        {/* Navigasyon */}
        <nav className={styles.nav} aria-label="Panel navigasyonu">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`${styles.navItem} ${active === id ? styles.navActive : ''}`}
              onClick={() => { setActive(id); navigate(`/${id === 'overview' ? 'panel' : id === 'wishlist' ? 'favorilerim' : id === 'profile' ? 'profilim' : id === 'orders' ? 'siparislerim' : id === 'addresses' ? 'adreslerim' : id === 'messages' ? 'panel' : 'ayarlar'}`); setSidebarOpen(false); }}
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

            {/* ── PROFİL ─────────────────────────────────────── */}
            {active === 'profile' && (
              <motion.div key="profile" variants={contentVariants} initial="hidden" animate="visible" exit="exit">
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Profil Bilgilerim</h3>
                  </div>
                  <div className={styles.profileForm}>
                    <div className={styles.profileAvatarBig}>
                      <div className={styles.avatarBig}>
                        <span>{initials}</span>
                      </div>
                    </div>
                    <div className={styles.formGrid}>
                      {[
                        { label: 'Ad Soyad', value: displayName, type: 'text', readOnly: true },
                        { label: 'E-posta', value: displayEmail, type: 'email', readOnly: true },
                        { label: 'Telefon', value: user?.phoneNumber || 'Telefon eklenmemiş', type: 'tel', readOnly: true },
                        { label: 'Kullanıcı Rolleri', value: roles.join(', ') || "Müşteri", type: 'text', readOnly: true },
                      ].map(field => (
                        <div key={field.label} className={styles.formField}>
                          <label className={styles.fieldLabel}>{field.label}</label>
                          <input
                            type={field.type}
                            defaultValue={field.value}
                            readOnly={field.readOnly}
                            className={styles.fieldInput}
                            style={{ opacity: field.readOnly ? 0.7 : 1 }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── AYARLAR ────────────────────────────────────── */}
            {active === 'settings' && (
              <motion.div key="settings" variants={contentVariants} initial="hidden" animate="visible" exit="exit">
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
                        <input type="text" required value={profileName} onChange={e => setProfileName(e.target.value)} className={styles.fieldInput} />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Telefon</label>
                        <input type="tel" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} className={styles.fieldInput} placeholder="Örn: 905550000000" />
                      </div>
                    </div>
                    <button type="submit" disabled={profileLoading} className={styles.shopBtn} style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {profileLoading && <FiLoader className={styles.spinner} style={{ animation: 'spin 1.5s linear infinite', fontSize: 14, margin: 0 }} />}
                      Değişiklikleri Kaydet
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
                        <input type="password" required value={curPass} onChange={e => setCurPass(e.target.value)} className={styles.fieldInput} />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Yeni Şifre</label>
                        <input type="password" required value={newPass} onChange={e => setNewPass(e.target.value)} className={styles.fieldInput} />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Yeni Şifre Tekrar</label>
                        <input type="password" required value={confPass} onChange={e => setConfPass(e.target.value)} className={styles.fieldInput} />
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
