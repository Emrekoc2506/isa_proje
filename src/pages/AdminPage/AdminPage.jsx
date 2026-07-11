import styles from './AdminPage.module.css';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiPackage, FiFolder, FiMessageSquare, FiLogOut, FiMenu, FiX,
  FiTrash2, FiPlusCircle, FiDollarSign, FiShoppingCart, FiImage,
  FiEye, FiTag, FiAlignLeft, FiBox, FiPercent, FiLink, FiStar,
  FiCheckCircle, FiInfo, FiZap, FiLayers
} from 'react-icons/fi';
import logoImage from '../../assets/images/logo.png';
import ChatUI from '../../components/ChatUI/ChatUI';
import { useProducts } from '../../context/ProductContext';
import { uploadFile } from '../../services/fileApi';

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
    deleteSlide,
    refreshData
  } = useProducts();

  // Admin sayfasına girildiğinde verileri tazele
  useEffect(() => {
    refreshData();
  }, [refreshData, active]);

  // Yeni Ürün Formu State'leri
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodOldPrice, setProdOldPrice] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodSubcategory, setProdSubcategory] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [uploadingProdImg, setUploadingProdImg] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [isSale, setIsSale] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [showAddProdModal, setShowAddProdModal] = useState(false);
  // Genişletilmiş alanlar
  const [prodShortDesc, setProdShortDesc] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodUnit, setProdUnit] = useState('adet');
  const [prodDiscount, setProdDiscount] = useState('');
  const [prodSlug, setProdSlug] = useState('');
  const [formSection, setFormSection] = useState('basic'); // 'basic' | 'detail' | 'media'

  // Yeni Afiş/İlan Formu State'leri
  const [slideTitle, setSlideTitle] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideCta, setSlideCta] = useState('');
  const [slideHref, setSlideHref] = useState('');
  const [slideImage, setSlideImage] = useState('');
  const [uploadingSlideImg, setUploadingSlideImg] = useState(false);

  // Yeni Kategori Formu State'i
  const [catName, setCatName] = useState('');

  const contentVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  // Ürün adından otomatik slug üret
  const autoSlug = (name) => name.toLowerCase().trim()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9\s-]/g,'')
    .replace(/\s+/g,'-');

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!prodName || !prodPrice) return;

    try {
      await addProduct({
        name: prodName,
        price: parseFloat(prodPrice),
        oldPrice: prodOldPrice ? parseFloat(prodOldPrice) : null,
        categoryId: prodCategory || categories[0]?.id,
        subcategoryId: prodSubcategory || null,
        imageUrl: prodImage || null,
        isNew,
        isSale,
        isFeatured,
        shortDescription: prodShortDesc || null,
        description: prodDescription || null,
        stockQuantity: prodStock ? parseInt(prodStock) : 0,
        unit: prodUnit || 'adet',
        discount: prodDiscount || null,
        slug: prodSlug || autoSlug(prodName),
      });

      // Formu temizle
      setProdName(''); setProdPrice(''); setProdOldPrice('');
      setProdCategory(''); setProdSubcategory(''); setProdImage('');
      setIsNew(false); setIsSale(false); setIsFeatured(false);
      setProdShortDesc(''); setProdDescription(''); setProdStock('');
      setProdUnit('adet'); setProdDiscount(''); setProdSlug('');
      setFormSection('basic');
      setShowAddProdModal(false);
      alert("✅ Ürün başarıyla eklendi ve yayınlandı!");
    } catch (err) {
      alert("Ürün eklenirken hata oluştu: " + err.message);
    }
  };

  const handleAddCategorySubmit = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      await addCategory(catName.trim());
      setCatName('');
      alert("Kategori eklendi.");
    } catch (err) {
      alert("Kategori eklenemedi: " + err.message);
    }
  };

  const handlePriceUpdate = async (id, val) => {
    const numeric = parseFloat(val);
    if (!isNaN(numeric) && numeric > 0) {
      try {
        await updateProductPrice(id, numeric);
      } catch (err) {
        alert("Fiyat güncellenemedi: " + err.message);
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setUploadingProdImg(true);
        const res = await uploadFile(file, "products");
        setProdImage(res.url);
      } catch (err) {
        console.error("Görsel yükleme hatası:", err);
        alert("Görsel sunucuya yüklenirken bir hata oluştu.");
      } finally {
        setUploadingProdImg(false);
      }
    }
  };

  const handleSlideImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setUploadingSlideImg(true);
        const res = await uploadFile(file, "banners");
        setSlideImage(res.url);
      } catch (err) {
        console.error("Görsel yükleme hatası:", err);
        alert("Görsel sunucuya yüklenirken bir hata oluştu.");
      } finally {
        setUploadingSlideImg(false);
      }
    }
  };

  const handleAddSlideSubmit = async (e) => {
    e.preventDefault();
    if (!slideTitle || !slideImage) return;

    try {
      await addSlide({
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
      alert("Afiş başarıyla yayınlandı.");
    } catch (err) {
      alert("Afiş eklenemedi: " + err.message);
    }
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
                  <p className={styles.emptyText}>Ürün ve kategori güncellemeleri başarıyla canlı API veri tabanına yansıtılmaktadır.</p>
                </div>

              </motion.div>
            )}

            {/* ── ÜRÜN YÖNETİMİ (PRODUCTS) ──────────────────── */}
            {active === 'products' && (
              <motion.div key="products" variants={contentVariants} initial="hidden" animate="visible" exit="exit">

                {/* ════ YENİ ÜRÜN EKLEME FORMU ════ */}
                <div className={styles.productFormWrapper}>
                  
                  {/* Sol: Form Paneli */}
                  <div className={styles.productFormPanel}>
                    <div className={styles.formPanelHeader}>
                      <div className={styles.formPanelIcon}><FiPlusCircle /></div>
                      <div>
                        <h3 className={styles.formPanelTitle}>Yeni Ürün Ekle</h3>
                        <p className={styles.formPanelSubtitle}>İlan sayfasındaki tüm alanları buradan yönetin</p>
                      </div>
                    </div>

                    {/* Sekme Gezgini */}
                    <div className={styles.formTabs}>
                      <button
                        type="button"
                        className={`${styles.formTab} ${formSection === 'basic' ? styles.formTabActive : ''}`}
                        onClick={() => setFormSection('basic')}
                      >
                        <FiInfo /> Temel Bilgiler
                      </button>
                      <button
                        type="button"
                        className={`${styles.formTab} ${formSection === 'detail' ? styles.formTabActive : ''}`}
                        onClick={() => setFormSection('detail')}
                      >
                        <FiAlignLeft /> Açıklama & Stok
                      </button>
                      <button
                        type="button"
                        className={`${styles.formTab} ${formSection === 'media' ? styles.formTabActive : ''}`}
                        onClick={() => setFormSection('media')}
                      >
                        <FiImage /> Görsel & Etiket
                      </button>
                    </div>

                    <form onSubmit={handleAddProductSubmit} className={styles.productForm}>

                      {/* ─── SEKME 1: Temel Bilgiler ─── */}
                      {formSection === 'basic' && (
                        <div className={styles.formSectionContent}>
                          <div className={styles.pFormGroup}>
                            <label className={styles.pFormLabel}>
                              <FiPackage className={styles.pFormLabelIcon} />
                              Ürün Adı <span className={styles.required}>*</span>
                            </label>
                            <input
                              className={styles.pFormInput}
                              type="text"
                              required
                              value={prodName}
                              onChange={e => {
                                setProdName(e.target.value);
                                if (!prodSlug) setProdSlug(autoSlug(e.target.value));
                              }}
                              placeholder="Örn: Palo Santo Tütsü Demeti"
                            />
                          </div>

                          <div className={styles.pFormRow}>
                            <div className={styles.pFormGroup}>
                              <label className={styles.pFormLabel}>
                                <FiDollarSign className={styles.pFormLabelIcon} />
                                Satış Fiyatı (₺) <span className={styles.required}>*</span>
                              </label>
                              <input
                                className={styles.pFormInput}
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={prodPrice}
                                onChange={e => setProdPrice(e.target.value)}
                                placeholder="0.00"
                              />
                            </div>
                            <div className={styles.pFormGroup}>
                              <label className={styles.pFormLabel}>
                                <FiTag className={styles.pFormLabelIcon} />
                                Eski / Üstü Çizili Fiyat (₺)
                              </label>
                              <input
                                className={styles.pFormInput}
                                type="number"
                                step="0.01"
                                min="0"
                                value={prodOldPrice}
                                onChange={e => setProdOldPrice(e.target.value)}
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          <div className={styles.pFormRow}>
                            <div className={styles.pFormGroup}>
                              <label className={styles.pFormLabel}>
                                <FiLayers className={styles.pFormLabelIcon} />
                                Kategori <span className={styles.required}>*</span>
                              </label>
                              <select
                                className={styles.pFormSelect}
                                value={prodCategory || (categories[0]?.id || '')}
                                onChange={e => { setProdCategory(e.target.value); setProdSubcategory(''); }}
                              >
                                {categories.map(c => (
                                  <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className={styles.pFormGroup}>
                              <label className={styles.pFormLabel}>
                                <FiLayers className={styles.pFormLabelIcon} />
                                Alt Kategori
                              </label>
                              <select
                                className={styles.pFormSelect}
                                value={prodSubcategory}
                                onChange={e => setProdSubcategory(e.target.value)}
                              >
                                <option value="">— Alt Kategori Yok —</option>
                                {(categories.find(c => c.id === (prodCategory || categories[0]?.id))?.children || []).map(ch => (
                                  <option key={ch.label} value={ch.label}>{ch.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className={styles.pFormRow}>
                            <div className={styles.pFormGroup}>
                              <label className={styles.pFormLabel}>
                                <FiBox className={styles.pFormLabelIcon} />
                                Stok Miktarı <span className={styles.required}>*</span>
                              </label>
                              <input
                                className={styles.pFormInput}
                                type="number"
                                min="0"
                                value={prodStock}
                                onChange={e => setProdStock(e.target.value)}
                                placeholder="Örn: 50"
                              />
                            </div>
                            <div className={styles.pFormGroup}>
                              <label className={styles.pFormLabel}>
                                <FiTag className={styles.pFormLabelIcon} />
                                Satış Birimi
                              </label>
                              <select
                                className={styles.pFormSelect}
                                value={prodUnit}
                                onChange={e => setProdUnit(e.target.value)}
                              >
                                <option value="adet">adet</option>
                                <option value="paket">paket</option>
                                <option value="gr">gr</option>
                                <option value="kg">kg</option>
                                <option value="lt">lt</option>
                                <option value="ml">ml</option>
                                <option value="set">set</option>
                              </select>
                            </div>
                          </div>

                          <div className={styles.pFormRow}>
                            <div className={styles.pFormGroup}>
                              <label className={styles.pFormLabel}>
                                <FiPercent className={styles.pFormLabelIcon} />
                                İndirim Etiketi
                                <span className={styles.pFormHint}>(Ör: %20, 3+1, Hediye)</span>
                              </label>
                              <input
                                className={styles.pFormInput}
                                type="text"
                                value={prodDiscount}
                                onChange={e => setProdDiscount(e.target.value)}
                                placeholder="Örn: %25"
                              />
                            </div>
                            <div className={styles.pFormGroup}>
                              <label className={styles.pFormLabel}>
                                <FiLink className={styles.pFormLabelIcon} />
                                URL Slug
                                <span className={styles.pFormHint}>(otomatik oluşturulur)</span>
                              </label>
                              <input
                                className={styles.pFormInput}
                                type="text"
                                value={prodSlug}
                                onChange={e => setProdSlug(e.target.value)}
                                placeholder="palo-santo-tutsu-demeti"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            className={styles.pFormNextBtn}
                            onClick={() => setFormSection('detail')}
                          >
                            Açıklama & Stok →
                          </button>
                        </div>
                      )}

                      {/* ─── SEKME 2: Açıklama & Stok ─── */}
                      {formSection === 'detail' && (
                        <div className={styles.formSectionContent}>
                          <div className={styles.pFormGroup}>
                            <label className={styles.pFormLabel}>
                              <FiZap className={styles.pFormLabelIcon} />
                              Kısa Açıklama
                              <span className={styles.pFormHint}>(Ürün sayfasında fiyatın altında görünür)</span>
                            </label>
                            <textarea
                              className={styles.pFormTextarea}
                              rows={3}
                              value={prodShortDesc}
                              onChange={e => setProdShortDesc(e.target.value)}
                              placeholder="Bu ürünün kısa ve çekici bir tanımını yazın..."
                            />
                          </div>

                          <div className={styles.pFormGroup}>
                            <label className={styles.pFormLabel}>
                              <FiAlignLeft className={styles.pFormLabelIcon} />
                              Detaylı Açıklama
                              <span className={styles.pFormHint}>("Açıklama" sekmesinde görünür, paragraflar için boş satır bırakın)</span>
                            </label>
                            <textarea
                              className={styles.pFormTextarea}
                              rows={7}
                              value={prodDescription}
                              onChange={e => setProdDescription(e.target.value)}
                              placeholder={`Ürün hakkında detaylı bilgi verin...\n\nÖzellikler, kullanım alanları, menşei vb. yazabilirsiniz.`}
                            />
                          </div>

                          <div className={styles.pFormNavRow}>
                            <button type="button" className={styles.pFormBackBtn} onClick={() => setFormSection('basic')}>← Geri</button>
                            <button type="button" className={styles.pFormNextBtn} onClick={() => setFormSection('media')}>Görsel & Etiket →</button>
                          </div>
                        </div>
                      )}

                      {/* ─── SEKME 3: Görsel & Etiketler ─── */}
                      {formSection === 'media' && (
                        <div className={styles.formSectionContent}>
                          <div className={styles.pFormGroup}>
                            <label className={styles.pFormLabel}>
                              <FiImage className={styles.pFormLabelIcon} />
                              Ürün Görseli
                            </label>
                            <div className={styles.pFormUploadArea}>
                              <input
                                type="file"
                                accept="image/*"
                                id="prod-image-upload"
                                onChange={handleImageUpload}
                                className={styles.fileInput}
                              />
                              {prodImage ? (
                                <div className={styles.pFormImagePreview}>
                                  <img src={prodImage} alt="Önizleme" />
                                  <button
                                    type="button"
                                    className={styles.pFormImageRemove}
                                    onClick={() => setProdImage('')}
                                  >
                                    <FiX /> Kaldır
                                  </button>
                                </div>
                              ) : (
                                <label htmlFor="prod-image-upload" className={styles.pFormUploadLabel}>
                                  <FiImage className={styles.pFormUploadIcon} />
                                  <span>{uploadingProdImg ? '⏳ Yükleniyor...' : 'Görsel seçmek için tıklayın'}</span>
                                  <small>PNG, JPG veya WEBP — Maks. 5MB</small>
                                </label>
                              )}
                            </div>
                          </div>

                          <div className={styles.pFormGroup}>
                            <label className={styles.pFormLabel}>
                              <FiStar className={styles.pFormLabelIcon} />
                              Ürün Etiketleri
                            </label>
                            <div className={styles.pFormTagGrid}>
                              <label className={`${styles.pFormTagItem} ${isNew ? styles.pFormTagActive : ''}`}>
                                <input type="checkbox" checked={isNew} onChange={e => setIsNew(e.target.checked)} hidden />
                                <span className={styles.pFormTagDot} style={{ background: '#4caf7d' }} />
                                <span>🆕 YENİ</span>
                                <small>Mavi rozet</small>
                              </label>
                              <label className={`${styles.pFormTagItem} ${isSale ? styles.pFormTagActive : ''}`}>
                                <input type="checkbox" checked={isSale} onChange={e => setIsSale(e.target.checked)} hidden />
                                <span className={styles.pFormTagDot} style={{ background: '#e76f51' }} />
                                <span>🔥 İNDİRİM</span>
                                <small>Turuncu rozet</small>
                              </label>
                              <label className={`${styles.pFormTagItem} ${isFeatured ? styles.pFormTagActive : ''}`}>
                                <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} hidden />
                                <span className={styles.pFormTagDot} style={{ background: 'var(--gold)' }} />
                                <span>⭐ ÖNE ÇIKAN</span>
                                <small>Ana sayfada göster</small>
                              </label>
                            </div>
                          </div>

                          <div className={styles.pFormNavRow}>
                            <button type="button" className={styles.pFormBackBtn} onClick={() => setFormSection('detail')}>← Geri</button>
                            <button
                              type="submit"
                              className={styles.pFormSubmitBtn}
                              disabled={uploadingProdImg || !prodName || !prodPrice}
                            >
                              <FiCheckCircle /> Ürünü Kaydet & Yayınla
                            </button>
                          </div>
                        </div>
                      )}

                    </form>
                  </div>

                  {/* Sağ: Canlı Önizleme */}
                  <div className={styles.productPreviewPanel}>
                    <div className={styles.previewHeader}>
                      <FiEye />
                      <span>Canlı Önizleme</span>
                      <small>İlan sayfanızda böyle görünür</small>
                    </div>

                    <div className={styles.previewCard}>
                      {/* Görsel */}
                      <div className={styles.previewImgBox}>
                        {prodImage
                          ? <img src={prodImage} alt={prodName || 'Ürün'} className={styles.previewImg} />
                          : <div className={styles.previewImgPlaceholder}><FiImage /><span>Görsel eklenmedi</span></div>
                        }
                        {isNew && <span className={styles.previewBadgeNew}>YENİ</span>}
                        {isSale && prodDiscount && <span className={styles.previewBadgeSale}>{prodDiscount}</span>}
                      </div>

                      {/* Bilgiler */}
                      <div className={styles.previewInfo}>
                        <h4 className={styles.previewName}>
                          {prodName || <span className={styles.previewPlaceholder}>Ürün Adı...</span>}
                        </h4>

                        {/* Fiyat */}
                        <div className={styles.previewPriceBlock}>
                          {prodOldPrice && (
                            <div className={styles.previewOldPrice}>
                              <span className={styles.previewStrike}>{prodOldPrice} ₺</span>
                              {prodDiscount && <span className={styles.previewDiscountBadge}>{prodDiscount}</span>}
                            </div>
                          )}
                          <div className={styles.previewPrice}>
                            {prodPrice ? `${prodPrice} ₺` : <span className={styles.previewPlaceholder}>0.00 ₺</span>}
                            {prodUnit && <span className={styles.previewUnit}>/ {prodUnit}</span>}
                          </div>
                        </div>

                        {/* Kısa Açıklama */}
                        <p className={styles.previewShortDesc}>
                          {prodShortDesc || <span className={styles.previewPlaceholder}>Kısa açıklama buraya gelecek...</span>}
                        </p>

                        {/* Stok */}
                        {prodStock && (
                          <div className={styles.previewStock}>
                            <FiZap /> Stokta {prodStock} {prodUnit}
                          </div>
                        )}

                        {/* Etiketler */}
                        <div className={styles.previewTags}>
                          {isNew && <span className={styles.previewTagNew}>🆕 Yeni</span>}
                          {isSale && <span className={styles.previewTagSale}>🔥 İndirim</span>}
                          {isFeatured && <span className={styles.previewTagFeat}>⭐ Öne Çıkan</span>}
                        </div>

                        {/* Kategori */}
                        <div className={styles.previewMeta}>
                          {(prodCategory || prodSubcategory) && (
                            <span>
                              {categories.find(c => c.id === (prodCategory || categories[0]?.id))?.label || ''}
                              {prodSubcategory && ` › ${prodSubcategory}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detaylı Açıklama Önizleme */}
                    {prodDescription && (
                      <div className={styles.previewDescBox}>
                        <div className={styles.previewDescTitle}>📖 Ürün Açıklaması</div>
                        {prodDescription.split('\n\n').map((p, i) => (
                          <p key={i} className={styles.previewDescPara}>{p}</p>
                        ))}
                      </div>
                    )}

                    {/* Slug */}
                    {(prodSlug || prodName) && (
                      <div className={styles.previewSlug}>
                        🔗 /urun/{prodSlug || autoSlug(prodName)}
                      </div>
                    )}
                  </div>
                </div>

                {/* ════ ÜRÜN LİSTESİ ════ */}
                <div className={styles.actionHeader}>
                  <h3>Sistemde Kayıtlı Ürünler ({products.length})</h3>
                </div>

                <div className={styles.tableCard}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Görsel</th>
                        <th>Ürün Adı</th>
                        <th>Fiyat</th>
                        <th>Stok</th>
                        <th>Kategori</th>
                        <th>Durum</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => {
                        const rawPrice = p.price ? parseFloat(String(p.price).replace(/[^0-9.,]/g, '').replace(',', '.')) : 0;
                        return (
                          <tr key={p.id}>
                            <td>
                              <img src={p.image || p.imageUrl || 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=500'} alt={p.name} className={styles.tableProdImg} />
                            </td>
                            <td className={styles.tableProdName}>
                              <div>{p.name}</div>
                              {p.shortDescription && <div className={styles.tableSubDesc}>{p.shortDescription.slice(0,60)}...</div>}
                            </td>
                            <td>
                              <div className={styles.tablePriceWrapper}>
                                <input
                                  type="number"
                                  step="0.01"
                                  defaultValue={rawPrice}
                                  onBlur={(e) => handlePriceUpdate(p.id, e.target.value)}
                                  className={styles.tablePriceInput}
                                />
                                <span className={styles.tablePriceEuro}>₺</span>
                              </div>
                            </td>
                            <td>
                              <span className={styles.tableStockBadge}>
                                {p.stockQuantity ?? '—'} {p.unit || 'adet'}
                              </span>
                            </td>
                            <td>{categories.find(c => c.id === p.categoryId)?.label || p.categoryId}</td>
                            <td>
                              <div className={styles.badgeRow}>
                                {p.isNew && <span className={styles.tableBadgeNew}>Yeni</span>}
                                {p.isSale && <span className={styles.tableBadgeSale}>İndirim</span>}
                                {p.isFeatured && <span className={styles.tableBadgeFeat}>Öne Çıkan</span>}
                              </div>
                            </td>
                            <td>
                              <button className={styles.tableDeleteBtn} onClick={() => {
                                if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
                                  deleteProduct(p.id).catch(err => alert('Silme hatası: ' + err.message));
                                }
                              }}>
                                <FiTrash2 /> Sil
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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
                      {categories.map(c => {
                        const catDbId = c.databaseId || c.id;
                        return (
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
                                          onClick={() => deleteSubcategory(catDbId, sub.label).catch(err => alert(err.message))} 
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
                                      addSubcategory(catDbId, input.value.trim()).catch(err => alert(err.message));
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
                                    setActive('products');
                                  }}
                                >
                                  <FiPlusCircle /> Ürün Ekle
                                </button>
                                <button className={styles.tableDeleteBtn} onClick={() => {
                                  if (confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) {
                                    deleteCategory(catDbId).catch(err => alert("Silme hatası: " + err.message));
                                  }
                                }}>
                                  <FiTrash2 /> Sil
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
                            {uploadingSlideImg ? "Yükleniyor..." : "Dosya Seç"}
                          </label>
                          {slideImage && (
                            <img src={slideImage} alt="Afiş Önizleme" className={styles.imagePreviewThumb} />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.checkboxAndSubmitRow}>
                      <div style={{ flex: 1 }} />
                      <button type="submit" className={styles.submitCardBtn} disabled={uploadingSlideImg}>
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
                            <button className={styles.tableDeleteBtn} onClick={() => {
                              if (confirm("Bu afişi silmek istediğinize emin misiniz?")) {
                                deleteSlide(s.id).catch(err => alert("Silme hatası: " + err.message));
                              }
                            }}>
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
                          <td style={{ fontWeight: 'bold', color: 'var(--gold-light)', fontSize: 12 }}>{o.id}</td>
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
                                  onClick={() => updateOrderStatus(o.id, 'Kargoda', 'shipping').catch(err => alert(err.message))}
                                >
                                  Kargoya Ver
                                </button>
                              )}
                              {o.statusCode === 'shipping' && (
                                <button 
                                  className={styles.statusUpdateBtn}
                                  onClick={() => updateOrderStatus(o.id, 'Teslim Edildi', 'delivered').catch(err => alert(err.message))}
                                >
                                  Teslim Et
                                </button>
                              )}
                              {(o.statusCode === 'delivered' || o.statusCode === 'shipped') && (
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
