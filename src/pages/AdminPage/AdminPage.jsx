import styles from './AdminPage.module.css';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiPackage, FiFolder, FiMessageSquare, FiLogOut, FiMenu, FiX,
  FiTrash2, FiPlusCircle, FiCheck, FiDollarSign, FiActivity, FiShoppingCart, FiImage
} from 'react-icons/fi';
import logoImage from '../../assets/images/logo.png';
import ChatUI from '../../components/ChatUI/ChatUI';
import { useProducts } from '../../context/ProductContext';

const NAV_ITEMS = [
  { id: 'overview',  label: 'Yönetim Özeti',   icon: FiGrid },
  { id: 'products',  label: 'Ürün Yönetimi',   icon: FiPackage },
  { id: 'categories',label: 'Kategori Yönetimi',icon: FiFolder },
  { id: 'slides',    label: 'Afiş/İlan Yönetimi', icon: FiImage },
  { id: 'orders',    label: 'Sipariş Takibi',  icon: FiShoppingCart },
  { id: 'messages',  label: 'Destek Mesajları', icon: FiMessageSquare },
];

export default function AdminPage({ onLogout }) {
  const [active, setActive] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { 
    products, 
    categories, 
    orders, 
    slides,
    addProduct, 
    deleteProduct, 
    addCategory, 
    deleteCategory,
    addSubcategory,
    deleteSubcategory,
    updateOrderStatus,
    updateProductPrice,
    addSlide,
    deleteSlide
  } = useProducts();

  // Yeni Ürün Formu State'leri
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodOldPrice, setProdOldPrice] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodSubcategory, setProdSubcategory] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [isSale, setIsSale] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [showAddProdModal, setShowAddProdModal] = useState(false);

  // Yeni Afiş/İlan Formu State'leri
  const [slideTitle, setSlideTitle] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideCta, setSlideCta] = useState('');
  const [slideHref, setSlideHref] = useState('');
  const [slideImage, setSlideImage] = useState('');

  // Yeni Kategori Formu State'i
  const [catName, setCatName] = useState('');

  const contentVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    if (!prodName || !prodPrice) return;

    addProduct({
      name: prodName,
      price: parseFloat(prodPrice),
      oldPrice: prodOldPrice ? parseFloat(prodOldPrice) : null,
      categoryId: prodCategory || categories[0]?.id,
      subcategory: prodSubcategory || null,
      image: prodImage || null,
      isNew,
      isSale,
      isFeatured
    });

    // Formu temizle
    setProdName('');
    setProdPrice('');
    setProdOldPrice('');
    setProdCategory('');
    setProdSubcategory('');
    setProdImage('');
    setIsNew(false);
    setIsSale(false);
    setIsFeatured(false);
    setShowAddProdModal(false);
  };

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (!catName.trim()) return;

    addCategory(catName.trim());
    setCatName('');
  };

  const handlePriceUpdate = (id, val) => {
    const numeric = parseFloat(val);
    if (!isNaN(numeric) && numeric > 0) {
      updateProductPrice(id, numeric);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSlideImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlideImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSlideSubmit = (e) => {
    e.preventDefault();
    if (!slideTitle || !slideImage) return;

    addSlide({
      title: slideTitle,
      subtitle: slideSubtitle,
      cta: slideCta,
      href: slideHref || '/urunler',
      image: slideImage
    });

    setSlideTitle('');
    setSlideSubtitle('');
    setSlideCta('');
    setSlideHref('');
    setSlideImage('');
  };

  // Toplam Satış Ciro Hesabı
  const totalSales = orders.reduce((sum, o) => {
    const numeric = parseFloat(o.total.replace(/[^0-9.,]/g, '').replace(',', '.'));
    return sum + (isNaN(numeric) ? 0 : numeric);
  }, 0);

  return (
    <div className={styles.page}>
      
      {/* Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarMobileOpen : ''}`}>
        <a href="/" className={styles.sidebarLogo}>
          <img src={logoImage} alt="mysticvelora" className={styles.sidebarLogoImg} />
          <span className={styles.sidebarBrand}>mysticvelora</span>
        </a>

        <div className={styles.adminBadgeCard}>
          <div className={styles.avatar}>
            <span className={styles.avatarInitials}>AD</span>
          </div>
          <div className={styles.profileInfo}>
            <p className={styles.profileName}>Admin Yetkili</p>
            <span className={styles.roleBadge}>Yönetici</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`${styles.navItem} ${active === id ? styles.navActive : ''}`}
              onClick={() => { setActive(id); setSidebarOpen(false); }}
            >
              <Icon className={styles.navIcon} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <button className={styles.logoutBtn} onClick={onLogout}>
          <FiLogOut />
          <span>Çıkış Yap</span>
        </button>
      </aside>

      {/* Ana İçerik */}
      <main className={styles.main}>
        <header className={styles.topBar}>
          <button className={styles.hamburger} onClick={() => setSidebarOpen(v => !v)}>
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <h1 className={styles.pageTitle}>
            {NAV_ITEMS.find(n => n.id === active)?.label} (Yönetim Paneli)
          </h1>
        </header>

        <div className={styles.content}>
          <AnimatePresence mode="wait">
            
            {/* ── GENEL BAKIŞ (OVERVIEW) ────────────────────── */}
            {active === 'overview' && (
              <motion.div key="overview" variants={contentVariants} initial="hidden" animate="visible" exit="exit" className={styles.gridContainer}>
                
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <FiPackage className={styles.statIcon} />
                    <div>
                      <h3>{products.length}</h3>
                      <p>Toplam Ürün</p>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <FiFolder className={styles.statIcon} />
                    <div>
                      <h3>{categories.length}</h3>
                      <p>Toplam Kategori</p>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <FiImage className={styles.statIcon} style={{ color: '#c5a0db' }} />
                    <div>
                      <h3>{slides.length}</h3>
                      <p>Aktif Afiş/İlan</p>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <FiShoppingCart className={styles.statIcon} />
                    <div>
                      <h3>{orders.length}</h3>
                      <p>Toplam Sipariş</p>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <FiDollarSign className={styles.statIcon} style={{ color: '#2ecc71' }} />
                    <div>
                      <h3>{Math.round(totalSales).toLocaleString('tr-TR')} ₺</h3>
                      <p>Toplam Ciro</p>
                    </div>
                  </div>
                </div>

                <div className={styles.panelCard}>
                  <h3>Son Yapılan Değişiklikler</h3>
                  <p className={styles.emptyText}>Henüz sistem logu bulunmuyor. Ürün veya kategori eklediğinizde burada güncellemeleri göreceksiniz.</p>
                </div>

              </motion.div>
            )}

            {/* ── ÜRÜN YÖNETİMİ (PRODUCTS) ──────────────────── */}
            {active === 'products' && (
              <motion.div key="products" variants={contentVariants} initial="hidden" animate="visible" exit="exit">
                <div className={styles.premiumProductCard}>
                  <div className={styles.premiumHeader}>
                    <div className={styles.premiumIconBadge}><FiPlusCircle /></div>
                    <div>
                      <h3 className={styles.premiumTitle}>Yeni Ürün Ekle</h3>
                      <p className={styles.premiumSubtitle}>Sitenize yeni mistik ve şifa dolu ürünler tanımlayın</p>
                    </div>
                  </div>
                  
                  <form onSubmit={handleAddProductSubmit} className={styles.cardForm}>
                    <div className={styles.formGridRow}>
                      <div className={styles.formField}>
                        <label>Ürün Adı *</label>
                        <div className={styles.inputWrapper}>
                          <input type="text" required value={prodName} onChange={e => setProdName(e.target.value)} placeholder="Örn: Palo Santo Tütsü Demeti" />
                        </div>
                      </div>
                      
                      <div className={styles.formField}>
                        <label>Kategori *</label>
                        <div className={styles.inputWrapper}>
                          <select 
                            value={prodCategory || (categories[0]?.id || '')} 
                            onChange={e => {
                              setProdCategory(e.target.value);
                              setProdSubcategory(''); // Reset subcategory when category changes
                            }}
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Alt Kategori Seçimi (Varsa) */}
                    {categories.find(c => c.id === (prodCategory || categories[0]?.id))?.children && (
                      <div className={styles.formGridRow} style={{ marginTop: '-8px', marginBottom: '8px' }}>
                        <div className={styles.formField}>
                          <label>Alt Kategori</label>
                          <div className={styles.inputWrapper}>
                            <select 
                              value={prodSubcategory} 
                              onChange={e => setProdSubcategory(e.target.value)}
                            >
                              <option value="">Alt Kategori Yok</option>
                              {categories.find(c => c.id === (prodCategory || categories[0]?.id))?.children.map(ch => (
                                <option key={ch.label} value={ch.label}>{ch.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className={styles.formField} />
                      </div>
                    )}

                    <div className={styles.formGridRowThree}>
                      <div className={styles.formField}>
                        <label>Fiyat (₺) *</label>
                        <div className={styles.inputWrapper}>
                          <input type="number" step="0.01" required value={prodPrice} onChange={e => setProdPrice(e.target.value)} placeholder="0.00" />
                        </div>
                      </div>
                      <div className={styles.formField}>
                        <label>Eski Fiyat (₺)</label>
                        <div className={styles.inputWrapper}>
                          <input type="number" step="0.01" value={prodOldPrice} onChange={e => setProdOldPrice(e.target.value)} placeholder="0.00" />
                        </div>
                      </div>
                      <div className={styles.formField}>
                        <label>Ürün Görseli</label>
                        <div className={styles.fileUploadContainer}>
                          <input 
                            type="file" 
                            accept="image/*" 
                            id="prod-image-upload" 
                            onChange={handleImageUpload}
                            className={styles.fileInput}
                          />
                          <label htmlFor="prod-image-upload" className={styles.fileLabel}>
                            Dosya Seç
                          </label>
                          {prodImage && (
                            <img src={prodImage} alt="Önizleme" className={styles.imagePreviewThumb} />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.checkboxAndSubmitRow}>
                      <div className={styles.checkboxRow}>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" checked={isNew} onChange={e => setIsNew(e.target.checked)} />
                          <span className={styles.checkboxCustom}>Yeni</span>
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" checked={isSale} onChange={e => setIsSale(e.target.checked)} />
                          <span className={styles.checkboxCustom}>İndirim</span>
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
                          <span className={styles.checkboxCustom}>Öne Çıkan</span>
                        </label>
                      </div>
                      
                      <button type="submit" className={styles.submitCardBtn}>
                        <FiPlusCircle /> Ürünü Kaydet & Yayınla
                      </button>
                    </div>
                  </form>
                  <div className={styles.premiumCardGlow} aria-hidden="true" />
                </div>

                <div className={styles.actionHeader}>
                  <h3>Sistemde Kayıtlı Ürünler ({products.length})</h3>
                </div>

                {/* Tablo Kartı */}
                <div className={styles.tableCard}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Görsel</th>
                        <th>Ürün Adı</th>
                        <th>Fiyat</th>
                        <th>Kategori</th>
                        <th>Durum</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id}>
                          <td>
                            <img src={p.image} alt={p.name} className={styles.tableProdImg} />
                          </td>
                          <td className={styles.tableProdName}>{p.name}</td>
                          <td>
                            <div className={styles.tablePriceWrapper}>
                              <input 
                                type="number" 
                                step="0.01" 
                                defaultValue={parseFloat(p.price.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                                onBlur={(e) => handlePriceUpdate(p.id, e.target.value)}
                                className={styles.tablePriceInput}
                              />
                              <span className={styles.tablePriceEuro}>₺</span>
                            </div>
                          </td>
                          <td>{p.categoryId}</td>
                          <td>
                            <div className={styles.badgeRow}>
                              {p.isNew && <span className={styles.tableBadgeNew}>Yeni</span>}
                              {p.isSale && <span className={styles.tableBadgeSale}>İndirim</span>}
                              {p.isFeatured && <span className={styles.tableBadgeFeat}>Öne Çıkan</span>}
                            </div>
                          </td>
                          <td>
                            <button className={styles.tableDeleteBtn} onClick={() => deleteProduct(p.id)}>
                              <FiTrash2 /> Sil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </motion.div>
            )}

            {/* ── KATEGORİ YÖNETİMİ (CATEGORIES) ────────────── */}
            {active === 'categories' && (
              <motion.div key="categories" variants={contentVariants} initial="hidden" animate="visible" exit="exit" className={styles.gridContainer}>
                
                <div className={styles.panelCard}>
                  <h3>Yeni Kategori Ekle</h3>
                  <form onSubmit={handleAddCategorySubmit} className={styles.inlineForm}>
                    <input 
                      type="text" 
                      required 
                      placeholder="Kategori adı girin (örn. Ritüel Ürünleri)" 
                      value={catName}
                      onChange={e => setCatName(e.target.value)}
                    />
                    <button type="submit" className={styles.inlineAddBtn}>
                      <FiPlusCircle /> Kategori Ekle
                    </button>
                  </form>
                </div>

                <div className={styles.tableCard}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Kategori ID</th>
                        <th>Kategori Adı</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(c => (
                        <tr key={c.id}>
                          <td style={{ color: 'var(--text-muted)' }}>{c.id}</td>
                          <td className={styles.tableProdName}>
                            <div>
                              <span>{c.label}</span>
                              {c.children && c.children.length > 0 && (
                                <div className={styles.subCategoryTags}>
                                  {c.children.map(sub => (
                                    <span key={sub.label} className={styles.subTag}>
                                      {sub.label}
                                      <button 
                                        type="button"
                                        onClick={() => deleteSubcategory(c.id, sub.label)} 
                                        className={styles.subTagDel} 
                                        aria-label="Alt kategoriyi sil"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className={styles.categoryActionsRow}>
                              {/* Alt Kategori Ekleme Formu */}
                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const input = e.target.querySelector('input');
                                  if(input.value.trim()){
                                    addSubcategory(c.id, input.value.trim());
                                    input.value = '';
                                  }
                                }} 
                                className={styles.subCatInlineForm}
                              >
                                <input type="text" placeholder="Alt Kategori Ekle..." className={styles.subCatInput} />
                                <button type="submit" className={styles.subCatAddBtn} title="Alt Kategori Ekle">
                                  +
                                </button>
                              </form>

                              <button 
                                className={styles.tableAddProdBtn} 
                                onClick={() => {
                                  setProdCategory(c.id);
                                  setShowAddProdModal(true);
                                }}
                              >
                                <FiPlusCircle /> Ürün Ekle
                              </button>
                              <button className={styles.tableDeleteBtn} onClick={() => deleteCategory(c.id)}>
                                <FiTrash2 /> Sil
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </motion.div>
            )}

            {/* ── AFİŞ/İLAN YÖNETİMİ (SLIDES) ────────────────── */}
            {active === 'slides' && (
              <motion.div key="slides" variants={contentVariants} initial="hidden" animate="visible" exit="exit">
                
                {/* Yeni Afiş Ekleme Formu */}
                <div className={styles.premiumProductCard}>
                  <div className={styles.premiumHeader}>
                    <div className={styles.premiumIconBadge}><FiImage /></div>
                    <div>
                      <h3 className={styles.premiumTitle}>Yeni Afiş (İlan) Ekle</h3>
                      <p className={styles.premiumSubtitle}>Ana sayfa manşet slaytlarını dinamik olarak yönetin</p>
                    </div>
                  </div>
                  
                  <form onSubmit={handleAddSlideSubmit} className={styles.cardForm}>
                    <div className={styles.formGridRow}>
                      <div className={styles.formField}>
                        <label>Afiş Başlığı (Büyük Yazı) *</label>
                        <div className={styles.inputWrapper}>
                          <input type="text" required value={slideTitle} onChange={e => setSlideTitle(e.target.value)} placeholder="Örn: Yeni Sezon Doğal Taşlar" />
                        </div>
                      </div>
                      
                      <div className={styles.formField}>
                        <label>Afiş Alt Başlığı (Üst İnce Yazı)</label>
                        <div className={styles.inputWrapper}>
                          <input type="text" value={slideSubtitle} onChange={e => setSlideSubtitle(e.target.value)} placeholder="Örn: Arındır • Koru • Dengele" />
                        </div>
                      </div>
                    </div>

                    <div className={styles.formGridRowThree}>
                      <div className={styles.formField}>
                        <label>Buton Yazısı (CTA)</label>
                        <div className={styles.inputWrapper}>
                          <input type="text" value={slideCta} onChange={e => setSlideCta(e.target.value)} placeholder="Keşfet" />
                        </div>
                      </div>
                      <div className={styles.formField}>
                        <label>Buton Linki (Yönlendirme)</label>
                        <div className={styles.inputWrapper}>
                          <input type="text" value={slideHref} onChange={e => setSlideHref(e.target.value)} placeholder="/urunler" />
                        </div>
                      </div>
                      <div className={styles.formField}>
                        <label>Afiş Görseli *</label>
                        <div className={styles.fileUploadContainer}>
                          <input 
                            type="file" 
                            accept="image/*" 
                            id="slide-image-upload" 
                            onChange={handleSlideImageUpload}
                            className={styles.fileInput}
                          />
                          <label htmlFor="slide-image-upload" className={styles.fileLabel}>
                            Dosya Seç
                          </label>
                          {slideImage && (
                            <img src={slideImage} alt="Afiş Önizleme" className={styles.imagePreviewThumb} />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.checkboxAndSubmitRow}>
                      <div style={{ flex: 1 }} />
                      <button type="submit" className={styles.submitCardBtn}>
                        <FiPlusCircle /> Afişi Yayınla
                      </button>
                    </div>
                  </form>
                  <div className={styles.premiumCardGlow} aria-hidden="true" />
                </div>

                {/* Slayt Listesi */}
                <div className={styles.actionHeader}>
                  <h3>Aktif Afişler / İlanlar ({slides.length})</h3>
                </div>

                <div className={styles.tableCard}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Görsel</th>
                        <th>Başlık</th>
                        <th>Alt Başlık</th>
                        <th>Buton / Link</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slides.map(s => (
                        <tr key={s.id}>
                          <td>
                            <img src={s.image} alt={s.title} className={styles.tableProdImg} style={{ width: '80px', height: '45px', objectFit: 'cover' }} />
                          </td>
                          <td className={styles.tableProdName}>{s.title}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{s.subtitle}</td>
                          <td>
                            <span style={{ fontSize: '12px', color: 'var(--gold-light)' }}>{s.cta} ({s.href})</span>
                          </td>
                          <td>
                            <button className={styles.tableDeleteBtn} onClick={() => deleteSlide(s.id)}>
                              <FiTrash2 /> Sil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </motion.div>
            )}

            {/* ── SİPARİŞ TAKİBİ (ORDERS) ───────────────────── */}
            {active === 'orders' && (
              <motion.div key="orders" variants={contentVariants} initial="hidden" animate="visible" exit="exit">
                <div className={styles.actionHeader}>
                  <h3>Müşteri Siparişleri ({orders.length})</h3>
                </div>

                <div className={styles.tableCard}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Sipariş ID</th>
                        <th>Müşteri</th>
                        <th>Alınan Ürünler</th>
                        <th>Tarih</th>
                        <th>Tutar</th>
                        <th>Durum</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id}>
                          <td style={{ fontWeight: 'bold', color: 'var(--gold-light)' }}>{o.id}</td>
                          <td>
                            <div>
                              <p style={{ margin: 0, fontWeight: 600 }}>{o.customerName}</p>
                              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{o.customerEmail}</p>
                            </div>
                          </td>
                          <td>
                            <div className={styles.orderItemsList}>
                              {o.items.map((it, idx) => (
                                <div key={idx} className={styles.orderItemRow}>
                                  <span>{it.qty}x</span> {it.name}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td>{o.date}</td>
                          <td style={{ fontWeight: 600 }}>{o.total}</td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles[o.statusCode]}`}>
                              {o.status}
                            </span>
                          </td>
                          <td>
                            <div className={styles.orderActionsCol}>
                              {o.statusCode === 'preparing' && (
                                <button 
                                  className={styles.statusUpdateBtn}
                                  onClick={() => updateOrderStatus(o.id, 'Kargoda', 'shipping')}
                                >
                                  Kargoya Ver
                                </button>
                              )}
                              {o.statusCode === 'shipping' && (
                                <button 
                                  className={styles.statusUpdateBtn}
                                  onClick={() => updateOrderStatus(o.id, 'Teslim Edildi', 'delivered')}
                                >
                                  Teslim Et
                                </button>
                              )}
                              {o.statusCode === 'delivered' && (
                                <span style={{ color: '#2ecc71', fontSize: 12, fontWeight: 600 }}>Tamamlandı</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ── DESTEK MESAJLARI (MESSAGES) ────────────────── */}
            {active === 'messages' && (
              <motion.div key="messages" variants={contentVariants} initial="hidden" animate="visible" exit="exit" style={{ height: '100%' }}>
                <ChatUI isAdmin={true} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

    </div>
  );
}
