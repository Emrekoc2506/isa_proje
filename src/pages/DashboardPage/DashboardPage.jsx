import styles from './DashboardPage.module.css';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiPackage, FiHeart, FiUser, FiSettings,
  FiLogOut, FiMenu, FiX, FiShoppingCart, FiChevronRight,
  FiMapPin, FiBell, FiEdit3, FiTrash2, FiEye, FiMessageSquare
} from 'react-icons/fi';
import logoImage from '../../assets/images/logo.png';
import { demoUser, dashboardStats, orderHistory } from '../../data/dashboard';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import ChatUI from '../../components/ChatUI/ChatUI';
import NotificationDropdown from '../../components/NotificationDropdown/NotificationDropdown';

const NAV_ITEMS = [
  { id: 'overview',  label: 'Genel Bakış',   icon: FiGrid },
  { id: 'messages',  label: 'Mesajlarım',    icon: FiMessageSquare },
  { id: 'orders',    label: 'Siparişlerim',  icon: FiPackage },
  { id: 'wishlist',  label: 'Favorilerim',   icon: FiHeart },
  { id: 'profile',   label: 'Profilim',      icon: FiUser },
  { id: 'settings',  label: 'Ayarlar',       icon: FiSettings },
];

const STATUS_CONFIG = {
  delivered:  { label: 'Teslim Edildi', color: '#2ecc71' },
  shipping:   { label: 'Kargoda',       color: '#C9A227' },
  preparing:  { label: 'Hazırlanıyor',  color: '#7B4EA6' },
  cancelled:  { label: 'İptal',         color: '#e05594' },
};

export default function DashboardPage({ onLogout }) {
  const [active, setActive] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { items: wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { unreadCount } = useNotifications();

  const initials = demoUser.name.split(' ').map(n => n[0]).join('');

  const sidebarVariants = {
    hidden: { x: '-100%', opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: 'tween', duration: 0.3 } },
    exit: { x: '-100%', opacity: 0, transition: { duration: 0.25 } },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  return (
    <div className={styles.page}>

      {/* ════ SIDEBAR ════════════════════════════════════════════ */}
      {/* Mobil overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — desktop her zaman görünür, mobilde slide */}
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
            <p className={styles.profileName}>{demoUser.name}</p>
            <p className={styles.profileEmail}>{demoUser.email}</p>
            <span className={styles.memberBadge}>{demoUser.level}</span>
          </div>
        </div>

        {/* Puan */}
        <div className={styles.pointsBar}>
          <span className={styles.pointsLabel}>✦ {demoUser.points} puan</span>
          <div className={styles.pointsTrack}>
            <div
              className={styles.pointsFill}
              style={{ width: `${Math.min((demoUser.points / 2000) * 100, 100)}%` }}
            />
          </div>
          <span className={styles.pointsNext}>Altın Üye'ye 760 puan kaldı</span>
        </div>

        {/* Navigasyon */}
        <nav className={styles.nav} aria-label="Panel navigasyonu">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`${styles.navItem} ${active === id ? styles.navActive : ''}`}
              onClick={() => { setActive(id); setSidebarOpen(false); }}
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
          onClick={onLogout}
          aria-label="Çıkış yap"
        >
          <FiLogOut />
          <span>Çıkış Yap</span>
        </button>
      </aside>

      {/* ════ ANA İÇERİK ═══════════════════════════════════════ */}
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
            {NAV_ITEMS.find(n => n.id === active)?.label}
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
                {/* Hoş geldin */}
                <div className={styles.welcomeBanner}>
                  <div>
                    <h2 className={styles.welcomeTitle}>Hoş geldin, {demoUser.name.split(' ')[0]}! ✨</h2>
                    <p className={styles.welcomeSub}>Mistik alışveriş deneyimine hazır mısın?</p>
                  </div>
                  <a href="/urunler" className={styles.shopBtn}>
                    Alışverişe Devam Et <FiChevronRight />
                  </a>
                </div>

                {/* İstatistik Kartları */}
                <div className={styles.statsGrid}>
                  {dashboardStats.map((stat, i) => {
                    let displayValue = stat.value;
                    if (stat.id === 'wishlist') displayValue = wishlist.length;

                    return (
                      <motion.div
                        key={stat.id}
                        className={styles.statCard}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.4 }}
                        style={{ '--stat-color': stat.color }}
                      >
                        <span className={styles.statIcon}>{stat.icon}</span>
                        <div className={styles.statContent}>
                          <p className={styles.statValue}>{displayValue}</p>
                          <p className={styles.statLabel}>{stat.label}</p>
                        </div>
                        <div className={styles.statGlow} aria-hidden="true" />
                      </motion.div>
                    );
                  })}
                </div>

                {/* Son Siparişler */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Son Siparişler</h3>
                    <button className={styles.seeAllBtn} onClick={() => setActive('orders')}>
                      Tümünü Gör <FiChevronRight />
                    </button>
                  </div>
                  {orderHistory.slice(0, 2).map(order => (
                    <OrderRow key={order.id} order={order} compact />
                  ))}
                </div>

                {/* Favori Ürünler */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Favorilerim</h3>
                    <button className={styles.seeAllBtn} onClick={() => setActive('wishlist')}>
                      Tümünü Gör <FiChevronRight />
                    </button>
                  </div>
                  <div className={styles.miniWishlist}>
                    {wishlist.slice(0, 3).map(item => (
                      <div key={item.id} className={styles.miniWishItem}>
                        <img src={item.image} alt={item.name} className={styles.miniWishImg} />
                        <span className={styles.miniWishName}>{item.name}</span>
                        <span className={styles.miniWishPrice}>{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── SİPARİŞLER ─────────────────────────────────── */}
            {active === 'orders' && (
              <motion.div key="orders" variants={contentVariants} initial="hidden" animate="visible" exit="exit">
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Tüm Siparişlerim</h3>
                    <span className={styles.sectionCount}>{orderHistory.length} sipariş</span>
                  </div>
                  {orderHistory.map(order => (
                    <OrderRow key={order.id} order={order} />
                  ))}
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
                      <a href="/" className={styles.shopBtn}>Alışverişe Başla</a>
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
                              onClick={() => addToCart({ id: item.id || item.name, name: item.name, price: item.price, image: item.image })}
                            >
                              <FiShoppingCart /> Sepete Ekle
                            </button>
                            <button
                              className={styles.wishRemoveBtn}
                              onClick={() => removeFromWishlist(item.id || item.name)}
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

            {/* ── MESAJLARIM (SIGNALR MOCK) ──────────────────── */}
            {active === 'messages' && (
              <motion.div key="messages" variants={contentVariants} initial="hidden" animate="visible" exit="exit" style={{ height: '100%' }}>
                <ChatUI />
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
                      <button className={styles.avatarEditBtn}>
                        <FiEdit3 /> Fotoğraf Değiştir
                      </button>
                    </div>
                    <div className={styles.formGrid}>
                      {[
                        { label: 'Ad Soyad', value: demoUser.name, type: 'text' },
                        { label: 'E-posta', value: demoUser.email, type: 'email' },
                        { label: 'Telefon', value: '+90 555 000 00 00', type: 'tel' },
                        { label: 'Doğum Tarihi', value: '1998-04-15', type: 'date' },
                      ].map(field => (
                        <div key={field.label} className={styles.formField}>
                          <label className={styles.fieldLabel}>{field.label}</label>
                          <input
                            type={field.type}
                            defaultValue={field.value}
                            className={styles.fieldInput}
                          />
                        </div>
                      ))}
                    </div>
                    <div className={styles.profileAddressSection}>
                      <h4 className={styles.subSectionTitle}>
                        <FiMapPin /> Kayıtlı Adresler
                      </h4>
                      <div className={styles.addressCard}>
                        <p className={styles.addressTitle}>Ev Adresi</p>
                        <p className={styles.addressText}>Bağcılar Mah. Çiçek Sok. No:14 D:3, Kadıköy / İstanbul</p>
                        <button className={styles.addressEditBtn}><FiEdit3 /> Düzenle</button>
                      </div>
                    </div>
                    <button className={styles.saveBtn}>Değişiklikleri Kaydet</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── AYARLAR ────────────────────────────────────── */}
            {active === 'settings' && (
              <motion.div key="settings" variants={contentVariants} initial="hidden" animate="visible" exit="exit">
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Ayarlar</h3>
                  </div>
                  <div className={styles.settingsGrid}>
                    {[
                      { label: 'E-posta Bildirimleri', desc: 'Sipariş ve kampanya bildirimleri', checked: true },
                      { label: 'SMS Bildirimleri', desc: 'Kargo ve teslimat bildirimleri', checked: false },
                      { label: 'Bülten Aboneliği', desc: 'Haftalık mistik içerikler', checked: true },
                      { label: 'Çerez Tercihleri', desc: 'Analitik ve kişiselleştirme', checked: false },
                    ].map(setting => (
                      <div key={setting.label} className={styles.settingRow}>
                        <div>
                          <p className={styles.settingLabel}>{setting.label}</p>
                          <p className={styles.settingDesc}>{setting.desc}</p>
                        </div>
                        <label className={styles.toggle}>
                          <input type="checkbox" defaultChecked={setting.checked} />
                          <span className={styles.toggleSlider} />
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Şifre Değiştir */}
                  <div className={styles.passwordSection}>
                    <h4 className={styles.subSectionTitle}>Şifre Değiştir</h4>
                    <div className={styles.formGrid}>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Mevcut Şifre</label>
                        <input type="password" className={styles.fieldInput} placeholder="••••••" />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Yeni Şifre</label>
                        <input type="password" className={styles.fieldInput} placeholder="••••••" />
                      </div>
                    </div>
                    <button className={styles.saveBtn} style={{ marginTop: '16px' }}>
                      Şifreyi Güncelle
                    </button>
                  </div>

                  {/* Tehlikeli Bölge */}
                  <div className={styles.dangerZone}>
                    <h4 className={styles.dangerTitle}>⚠ Tehlikeli Bölge</h4>
                    <p className={styles.dangerDesc}>Bu işlem geri alınamaz. Hesabınız kalıcı olarak silinecektir.</p>
                    <button className={styles.dangerBtn}>Hesabımı Sil</button>
                  </div>
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
function OrderRow({ order, compact }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[order.statusCode] || {};

  return (
    <div className={styles.orderRow}>
      <div className={styles.orderHeader} onClick={() => !compact && setOpen(v => !v)} style={{ cursor: compact ? 'default' : 'pointer' }}>
        <div className={styles.orderMeta}>
          <span className={styles.orderId}>{order.id}</span>
          <span className={styles.orderDate}>{order.date}</span>
        </div>
        <div className={styles.orderRight}>
          <span className={styles.statusBadge} style={{ '--status-color': cfg.color }}>
            {order.status}
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
        {(!compact || true) && open && (
          <motion.div
            className={styles.orderItems}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {order.items.map((item, i) => (
              <div key={i} className={styles.orderItem}>
                <span className={styles.orderItemName}>{item.name}</span>
                <span className={styles.orderItemQty}>×{item.qty}</span>
                <span className={styles.orderItemPrice}>{item.price}</span>
              </div>
            ))}
            <div className={styles.orderActions}>
              <button className={styles.orderBtn}><FiEye /> Detay</button>
              {order.statusCode === 'delivered' && (
                <button className={styles.orderBtn}><FiShoppingCart /> Tekrar Sipariş</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
