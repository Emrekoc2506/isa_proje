import { useState, useEffect } from 'react';
import { 
  FiTrash2, FiEdit3, FiPlus, FiGrid, FiList, FiAlertCircle, FiLock, FiUnlock,
  FiTag, FiDollarSign, FiImage, FiSliders, FiChevronLeft, FiChevronRight, FiCheck, FiUploadCloud, FiBox, FiFileText
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import * as productApi from '../../../services/productApi';
import * as categoryApi from '../../../services/categoryApi';
import { uploadFile } from '../../../services/fileApi';
import styles from '../AdminPage.module.css';

const STEPS = [
  { id: 1, label: "Genel", icon: FiTag, color: "#6366f1" },
  { id: 2, label: "Fiyat & Stok", icon: FiDollarSign, color: "#16a34a" },
  { id: 3, label: "Görsel", icon: FiImage, color: "#10b981" },
  { id: 4, label: "Detaylar", icon: FiSliders, color: "#f59e0b" }
];

export default function ProductsSection({ onSelectProductForVariants }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Edit / Create Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentId, setCurrentId] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedMainCatId, setSelectedMainCatId] = useState('');
  const [selectedSubCatId, setSelectedSubCatId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [isSale, setIsSale] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('adet');
  const [discount, setDiscount] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [modalStep, setModalStep] = useState(1); // Sihirbaz Adım Lojiği
  const [statusUpdatingId, setStatusUpdatingId] = useState(null); // Ürün durum güncelleme yükleniyor state'i

  // Validation States
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formGeneralError, setFormGeneralError] = useState('');

  // Ana ve Alt Kategori Hesaplama
  const mainCategories = categories.filter(c => !c.parentCategoryId && !c.parentId);
  const displayMainCategories = mainCategories.length > 0 ? mainCategories : categories;

  const availableSubCategories = selectedMainCatId
    ? categories.filter(c => {
        const parent = c.parentCategoryId || c.parentId;
        return parent && String(parent) === String(selectedMainCatId);
      })
    : [];

  const handleMainCategoryChange = (mainId) => {
    setSelectedMainCatId(mainId);
    setSelectedSubCatId('');
    setCategoryId(mainId);
    setFieldErrors(prev => ({ ...prev, categoryId: '' }));
  };

  const handleSubCategoryChange = (subId) => {
    setSelectedSubCatId(subId);
    setCategoryId(subId || selectedMainCatId);
    setFieldErrors(prev => ({ ...prev, categoryId: '' }));
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productApi.getAdminProducts({ page, pageSize: 10 });
      setProducts(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryApi.getAdminCategories();
      setCategories(data || []);
      if (data?.length > 0 && !categoryId) {
        const firstId = data[0].id;
        setSelectedMainCatId(firstId);
        setCategoryId(firstId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [page]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setCurrentId(null);
    setName('');
    setPrice('');
    setOldPrice('');
    setStockQuantity('');
    const firstCat = categories[0]?.id || '';
    setSelectedMainCatId(firstCat);
    setSelectedSubCatId('');
    setCategoryId(firstCat);
    setImageUrl('');
    setIsNew(false);
    setIsSale(false);
    setIsFeatured(false);
    setShortDescription('');
    setDescription('');
    setUnit('adet');
    setDiscount('');
    setSlug('');
    setIsActive(true);
    setModalStep(1);
    setFieldErrors({});
    setFormGeneralError('');
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setModalMode('edit');
    setCurrentId(p.id);
    setName(p.name || '');
    setPrice(p.price || '');
    setOldPrice(p.oldPrice || '');
    setStockQuantity(p.stockQuantity || 0);

    const targetCatId = p.categoryId || '';
    setCategoryId(targetCatId);

    const matchedCat = categories.find(c => String(c.id) === String(targetCatId));
    const parentIdOfCat = matchedCat?.parentCategoryId || matchedCat?.parentId;

    if (parentIdOfCat) {
      setSelectedMainCatId(String(parentIdOfCat));
      setSelectedSubCatId(String(targetCatId));
    } else {
      setSelectedMainCatId(String(targetCatId));
      setSelectedSubCatId('');
    }

    setImageUrl(p.imageUrl || '');
    setIsNew(p.isNew || false);
    setIsSale(p.isSale || false);
    setIsFeatured(p.isFeatured || false);
    setShortDescription(p.shortDescription || '');
    setDescription(p.description || '');
    setUnit(p.unit || 'adet');
    setDiscount(p.discount || '');
    setSlug(p.slug || '');
    setIsActive(p.isActive ?? true);
    setModalStep(1);
    setFieldErrors({});
    setFormGeneralError('');
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImg(true);
      const response = await uploadFile(file, 'product');
      if (response && response.url) {
        setImageUrl(response.url);
      }
    } catch (err) {
      alert("Görsel yüklenemedi: " + err.message);
    } finally {
      setUploadingImg(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!name || !name.trim()) {
      errors.name = "Ürün adı zorunludur.";
    }
    if (!categoryId) {
      errors.categoryId = "Lütfen bir kategori seçiniz.";
    }
    const parsedPrice = parseFloat(price);
    if (price === '' || price == null || isNaN(parsedPrice) || parsedPrice < 0) {
      errors.price = "Fiyat 0 veya daha büyük geçerli bir sayı olmalıdır.";
    }
    const parsedStock = parseInt(stockQuantity, 10);
    if (stockQuantity === '' || stockQuantity == null || isNaN(parsedStock) || parsedStock < 0) {
      errors.stockQuantity = "Stok miktarı 0 veya daha büyük bir sayı olmalıdır.";
    }
    if (!shortDescription || !shortDescription.trim()) {
      errors.shortDescription = "Kısa açıklama zorunludur.";
    }
    if (!description || !description.trim()) {
      errors.description = "Detaylı açıklama zorunludur.";
    }
    if (oldPrice && !isNaN(parseFloat(oldPrice)) && parseFloat(oldPrice) < 0) {
      errors.oldPrice = "Eski fiyat 0'dan küçük olamaz.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setFormGeneralError('');

    if (!validateForm()) {
      return;
    }

    if (submitting) return;

    const cleanName = name.trim();
    const payload = {
      name: cleanName,
      price: parseFloat(price) || 0,
      oldPrice: oldPrice ? parseFloat(oldPrice) : null,
      stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : 0,
      categoryId: categoryId,
      imageUrl: imageUrl || null,
      imageUrls: imageUrl ? [imageUrl] : [],
      isNew,
      isSale,
      isFeatured,
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      unit: unit || 'adet',
      discount: discount || null,
      slug: (slug || cleanName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || ('urun-' + Date.now()),
      isActive
    };

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await productApi.createAdminProduct(payload);
      } else {
        await productApi.updateAdminProduct(currentId, payload);
      }
      setShowModal(false);
      fetchProducts();
      alert(modalMode === 'create' ? "Ürün başarıyla oluşturuldu!" : "Ürün başarıyla güncellendi!");
    } catch (err) {
      console.error("Ürün kaydetme hatası:", err);
      if (err.errors) {
        const mappedErrors = {};
        Object.entries(err.errors).forEach(([k, v]) => {
          const keyLower = k.toLowerCase();
          const msg = Array.isArray(v) ? v.join(', ') : String(v);
          if (keyLower.includes('name')) mappedErrors.name = msg;
          else if (keyLower.includes('category')) mappedErrors.categoryId = msg;
          else if (keyLower.includes('price')) mappedErrors.price = msg;
          else if (keyLower.includes('stock')) mappedErrors.stockQuantity = msg;
          else if (keyLower.includes('shortdescription')) mappedErrors.shortDescription = msg;
          else if (keyLower.includes('description')) mappedErrors.description = msg;
        });
        setFieldErrors(mappedErrors);
      }
      setFormGeneralError(err.message || 'Ürün kaydedilemedi. Lütfen zorunlu alanları kontrol ediniz.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
      try {
        await productApi.deleteAdminProduct(id);
        fetchProducts();
      } catch (err) {
        alert(err.message || 'Ürün silinemedi.');
      }
    }
  };

  const handleToggleProductStatus = async (product) => {
    try {
      setStatusUpdatingId(product.id);
      const nextActive = !product.isActive;
      await productApi.updateAdminProductStatus(product.id, nextActive);
      fetchProducts();
    } catch (err) {
      alert("Ürün gizlilik durumu değiştirilemedi: " + err.message);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div>
      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ color: 'var(--gold-light)', fontSize: 20, fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Ürün Yönetimi
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0 0' }}>
            {products.length} ürün • Mağazada listelenen tüm ürün kataloğunuz
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, var(--gold-light, #c9a227), var(--gold-dark, #a07820))', color: '#000', border: 'none', borderRadius: 10, padding: '12px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 20px rgba(201,162,39,0.4)', transition: 'transform 0.15s ease' }}
        >
          <FiPlus size={18} /> Yeni Ürün Ekle
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(201,162,39,0.2)', borderTopColor: 'var(--gold-light)', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,162,39,0.15)', borderRadius: 16 }}>
          <FiBox size={48} style={{ color: 'var(--gold-light, #c9a227)', opacity: 0.7, marginBottom: 16 }} />
          <h4 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: 16, fontWeight: 700 }}>Henüz Ürün Eklenmemiş</h4>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 24px 0', fontSize: 14 }}>Mağazanızda satılacak ilk ürününüzü hemen oluşturun.</p>
          <button
            onClick={handleOpenCreate}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, var(--gold-light, #c9a227), var(--gold-dark, #a07820))', color: '#000', border: 'none', borderRadius: 10, padding: '14px 28px', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 20px rgba(201,162,39,0.4)' }}
          >
            <FiPlus size={18} /> İlk Ürünü Ekleyin
          </button>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-gold)' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Görsel</th>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Ürün Adı</th>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Fiyat</th>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Stok</th>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: 8 }}>
                      <img src={p.imageUrl || "https://images.unsplash.com/photo-1602928321679-560bb453f190?w=100"} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                    </td>
                    <td style={{ padding: 8, color: '#fff' }}>
                      {p.name}
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        {p.isNew && <span style={{ fontSize: 9, background: 'rgba(52,152,219,0.15)', color: '#3498db', padding: '2px 6px', borderRadius: 4 }}>YENİ</span>}
                        {p.isSale && <span style={{ fontSize: 9, background: 'rgba(224,85,148,0.15)', color: '#e05594', padding: '2px 6px', borderRadius: 4 }}>İNDİRİM</span>}
                      </div>
                    </td>
                    <td style={{ padding: 8, color: 'var(--gold-light)' }}>{p.price} ₺</td>
                    <td style={{ padding: 8, color: p.stockQuantity <= 3 ? '#e05594' : '#2ecc71' }}>{p.stockQuantity} Adet</td>
                    <td style={{ padding: 8 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          onClick={() => handleToggleProductStatus(p)} 
                          disabled={statusUpdatingId === p.id}
                          className={styles.seeAllBtn} 
                          style={{ 
                            padding: '4px 8px', 
                            fontSize: 11, 
                            color: p.isActive ? '#2ecc71' : '#e05594', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 4,
                            background: p.isActive ? 'rgba(46, 204, 113, 0.1)' : 'rgba(224, 85, 148, 0.1)',
                            opacity: statusUpdatingId === p.id ? 0.5 : 1
                          }}
                          title={p.isActive ? "Sitede Görünür (Gizlemek için Tıkla)" : "Sitede Gizli (Göstermek için Tıkla)"}
                        >
                          {p.isActive ? <FiUnlock size={11} /> : <FiLock size={11} />}
                          <span>{p.isActive ? 'Açık' : 'Gizli'}</span>
                        </button>

                        <button onClick={() => handleOpenEdit(p)} className={styles.seeAllBtn} style={{ padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FiEdit3 /> Düzenle
                        </button>
                        <button onClick={() => onSelectProductForVariants(p)} className={styles.seeAllBtn} style={{ padding: '4px 8px', fontSize: 11, color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FiGrid /> Varyantlar
                        </button>
                        <button onClick={() => handleDelete(p.id)} className={styles.seeAllBtn} style={{ padding: '4px 8px', fontSize: 11, color: '#e05594', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FiTrash2 /> Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className={styles.seeAllBtn}>Geri</button>
              <span style={{ color: '#fff', alignSelf: 'center', fontSize: 13 }}>{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className={styles.seeAllBtn}>İleri</button>
            </div>
          )}
        </>
      )}

      {/* CREATE / EDIT MODAL (Sihirbaz Form Tasarımı) */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, overflowY: 'auto', backdropFilter: 'blur(8px)' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={styles.sectionCard} 
              style={{ width: '90%', maxWidth: 650, margin: '40px auto', background: 'var(--bg-dark)', border: '1px solid rgba(201, 162, 39, 0.15)', boxShadow: '0 15px 40px rgba(0,0,0,0.6)', padding: 0, borderRadius: 16, overflow: 'hidden' }}
            >
              {/* Mesh Gradient Header */}
              <div style={{
                background: 'linear-gradient(135deg, #059669 0%, #1d4ed8 50%, #4f46e5 100%)',
                padding: '24px 24px',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', filter: 'blur(25px)' }} />
                <div style={{ position: 'absolute', bottom: -30, left: '15%', width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(18px)' }} />
                
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 20, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  {modalMode === 'create' ? <FiPlus size={11} /> : <FiEdit3 size={11} />} {modalMode === 'create' ? 'Yeni Ürün Ekle' : 'Ürünü Düzenle'}
                </div>
                
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                  Ürününüzü Oluşturalım
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 12, opacity: 0.85, lineHeight: 1.4 }}>
                  Sadece birkaç adımda profesyonel bir ürün oluşturun ve mağazada listeleyin.
                </p>

                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.2)', border: 'none', width: 28, height: 28, borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
                >
                  ✕
                </button>
              </div>

              {/* Step indicator (Progress Bar) */}
              <div style={{ 
                margin: '20px 24px 0 24px', 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: 12, 
                padding: '16px 20px', 
                position: 'relative' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '18px', left: '20px', right: '20px', height: 2, background: 'rgba(255, 255, 255, 0.05)', zIndex: 1 }} />
                  <div style={{ 
                    position: 'absolute', 
                    top: '18px', 
                    left: '20px', 
                    width: `${((modalStep - 1) / (STEPS.length - 1)) * 88}%`, 
                    height: 2, 
                    background: 'linear-gradient(90deg, #10b981, #3b82f6)', 
                    zIndex: 2, 
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
                  }} />
                  
                  {STEPS.map((s) => {
                    const StepIcon = s.icon;
                    const isCompleted = modalStep > s.id;
                    const isActive = modalStep === s.id;
                    
                    return (
                      <div 
                        key={s.id} 
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, cursor: 'pointer' }}
                        onClick={() => {
                          if (s.id < modalStep || (s.id === modalStep + 1 && (modalStep === 1 ? name.trim() : modalStep === 2 ? (price && stockQuantity) : true))) {
                            setModalStep(s.id);
                          }
                        }}
                      >
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: isCompleted ? 'linear-gradient(135deg, #10b981, #059669)' : isActive ? 'var(--bg-dark)' : 'rgba(255, 255, 255, 0.04)',
                          border: isActive ? '2px solid #3b82f6' : isCompleted ? 'none' : '2px solid rgba(255,255,255,0.05)',
                          color: isCompleted ? '#fff' : isActive ? '#3b82f6' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isActive ? '0 0 10px rgba(59, 130, 246, 0.3)' : 'none',
                          transition: 'all 0.3s ease'
                        }}>
                          {isCompleted ? <FiCheck size={16} /> : <StepIcon size={16} />}
                        </div>
                        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: 9, color: isActive ? '#3b82f6' : 'var(--text-muted)', fontWeight: isActive ? '600' : 'normal' }}>
                            Adım {s.id}
                          </span>
                          <span style={{ fontSize: 11, color: isActive ? '#fff' : 'var(--text-secondary)', fontWeight: isActive ? '600' : 'normal', marginTop: 2 }}>
                            {s.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSave} style={{ padding: 24 }} className={styles.profileForm}>
                
                {formGeneralError && (
                  <div style={{ background: 'rgba(224, 85, 148, 0.15)', border: '1px solid #e05594', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ff6b9d', fontSize: 13 }}>
                    {formGeneralError}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {/* ADIM 1: GENEL BİLGİLER */}
                  {modalStep === 1 && (
                    <motion.div 
                      key="step1"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Section 1: Temel Bilgiler */}
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(201, 162, 39, 0.1)', border: '1px solid rgba(201, 162, 39, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-light)' }}>
                            <FiFileText size={16} />
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#fff' }}>Temel Bilgiler</span>
                            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Ürünün adını ve kategorisini belirtin</span>
                          </div>
                        </div>

                        <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr', gap: 12 }}>
                          <div className={styles.formField}>
                            <label className={styles.fieldLabel}>Ürün Adı *</label>
                            <input type="text" required value={name} onChange={e => { setName(e.target.value); setFieldErrors(prev => ({ ...prev, name: '' })); }} className={styles.fieldInput} placeholder="Örn: Ametist Doğal Taş Kolye" />
                            {fieldErrors.name && <span style={{ color: '#e05594', fontSize: 11, marginTop: 4, display: 'block' }}>{fieldErrors.name}</span>}
                          </div>
                          <div className={styles.formField}>
                            <label className={styles.fieldLabel}>Kategori *</label>
                            <select 
                              value={selectedMainCatId} 
                              onChange={e => handleMainCategoryChange(e.target.value)} 
                              className={styles.fieldInput} 
                              style={{ background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                            >
                              <option value="">Kategori Seçin</option>
                              {displayMainCategories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            {fieldErrors.categoryId && <span style={{ color: '#e05594', fontSize: 11, marginTop: 4, display: 'block' }}>{fieldErrors.categoryId}</span>}
                          </div>

                          <div className={styles.formField}>
                            <label className={styles.fieldLabel}>Alt Kategori</label>
                            <select 
                              value={selectedSubCatId} 
                              onChange={e => handleSubCategoryChange(e.target.value)} 
                              className={styles.fieldInput} 
                              disabled={availableSubCategories.length === 0}
                              style={{ 
                                background: availableSubCategories.length === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.3)', 
                                color: availableSubCategories.length === 0 ? 'var(--text-muted)' : '#fff',
                                opacity: availableSubCategories.length === 0 ? 0.5 : 1
                              }}
                            >
                              <option value="">
                                {availableSubCategories.length === 0 
                                  ? (selectedMainCatId ? 'Alt kategori bulunmuyor' : 'Önce Kategori Seçin') 
                                  : 'Alt Kategori Seçin (İsteğe Bağlı)'}
                              </option>
                              {availableSubCategories.map(sc => (
                                <option key={sc.id} value={sc.id}>└ {sc.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Birim & Yayın Detayları */}
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(201, 162, 39, 0.1)', border: '1px solid rgba(201, 162, 39, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-light)' }}>
                            <FiTag size={16} />
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#fff' }}>Birim & Yayın Detayları</span>
                            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Mağaza içi arama ve birim etiketleri</span>
                          </div>
                        </div>

                        <div className={styles.formGrid} style={{ gap: 12 }}>
                          <div className={styles.formField}>
                            <label className={styles.fieldLabel}>Birim (Örn: Adet, Gram)</label>
                            <input type="text" value={unit} onChange={e => setUnit(e.target.value)} className={styles.fieldInput} placeholder="Adet" />
                          </div>
                          <div className={styles.formField}>
                            <label className={styles.fieldLabel}>Takma Ad (Slug)</label>
                            <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className={styles.fieldInput} placeholder="Boş bırakılırsa otomatik üretilir" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ADIM 2: FİYAT & STOK */}
                  {modalStep === 2 && (
                    <motion.div 
                      key="step2"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Section 1: Fiyatlandırma */}
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(201, 162, 39, 0.1)', border: '1px solid rgba(201, 162, 39, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-light)' }}>
                            <FiDollarSign size={16} />
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#fff' }}>Fiyatlandırma</span>
                            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Fiyat değerleri ve indirimler</span>
                          </div>
                        </div>

                        <div className={styles.formGrid} style={{ gap: 12 }}>
                          <div className={styles.formField}>
                            <label className={styles.fieldLabel}>Fiyat (₺) *</label>
                            <input type="number" step="0.01" required value={price} onChange={e => { setPrice(e.target.value); setFieldErrors(prev => ({ ...prev, price: '' })); }} className={styles.fieldInput} placeholder="0.00" />
                            {fieldErrors.price && <span style={{ color: '#e05594', fontSize: 11, marginTop: 4, display: 'block' }}>{fieldErrors.price}</span>}
                          </div>
                          <div className={styles.formField}>
                            <label className={styles.fieldLabel}>Eski Fiyat (₺)</label>
                            <input type="number" step="0.01" value={oldPrice} onChange={e => { setOldPrice(e.target.value); setFieldErrors(prev => ({ ...prev, oldPrice: '' })); }} className={styles.fieldInput} placeholder="0.00" />
                            {fieldErrors.oldPrice && <span style={{ color: '#e05594', fontSize: 11, marginTop: 4, display: 'block' }}>{fieldErrors.oldPrice}</span>}
                          </div>
                          <div className={styles.formField} style={{ gridColumn: 'span 2' }}>
                            <label className={styles.fieldLabel}>İndirim Notu (Örn: %20 İndirim)</label>
                            <input type="text" value={discount} onChange={e => setDiscount(e.target.value)} className={styles.fieldInput} placeholder="Sadece İndirim seçeneğinde görünür" />
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Envanter */}
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(201, 162, 39, 0.1)', border: '1px solid rgba(201, 162, 39, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-light)' }}>
                            <FiBox size={16} />
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#fff' }}>Envanter</span>
                            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Stok miktarı ve takibi</span>
                          </div>
                        </div>

                        <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr', gap: 12 }}>
                          <div className={styles.formField}>
                            <label className={styles.fieldLabel}>Stok Adedi *</label>
                            <input type="number" required value={stockQuantity} onChange={e => { setStockQuantity(e.target.value); setFieldErrors(prev => ({ ...prev, stockQuantity: '' })); }} className={styles.fieldInput} placeholder="0" />
                            {fieldErrors.stockQuantity && <span style={{ color: '#e05594', fontSize: 11, marginTop: 4, display: 'block' }}>{fieldErrors.stockQuantity}</span>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ADIM 3: GÖRSEL YÜKLE */}
                  {modalStep === 3 && (
                    <motion.div 
                      key="step3"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(201, 162, 39, 0.1)', border: '1px solid rgba(201, 162, 39, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-light)' }}>
                            <FiImage size={16} />
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#fff' }}>Ürün Görseli</span>
                            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Müşterilerin liste sayfalarında göreceği ana resim</span>
                          </div>
                        </div>

                        {!imageUrl ? (
                          <div 
                            style={{
                              border: '2px dashed rgba(201, 162, 39, 0.25)',
                              borderRadius: 12,
                              padding: '40px 20px',
                              textAlign: 'center',
                              background: 'rgba(0, 0, 0, 0.2)',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'border-color 0.2s',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 12
                            }}
                            onClick={() => document.getElementById('imageFileInput').click()}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(201, 162, 39, 0.25)'}
                          >
                            <input 
                              id="imageFileInput"
                              type="file" 
                              accept="image/*"
                              onChange={handleImageUpload} 
                              style={{ display: 'none' }} 
                            />
                            <FiUploadCloud size={36} style={{ color: 'var(--gold-light)' }} />
                            <div>
                              <span style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', fontWeight: 600 }}>Görsel yüklemek için tıklayın</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginTop: 4 }}>Tavsiye edilen: Kare (1:1) JPG, PNG, WEBP</span>
                            </div>
                            
                            {uploadingImg && (
                              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(18,9,31,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
                                <span style={{ color: 'var(--gold-light)', fontSize: 13, fontWeight: 'bold' }}>Görsel Yükleniyor...</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{
                            border: '1px solid rgba(201, 162, 39, 0.2)',
                            borderRadius: 12,
                            padding: 16,
                            background: 'rgba(0, 0, 0, 0.3)',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                          }}>
                            <img src={imageUrl} alt="Ürün" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8, background: 'rgba(0,0,0,0.1)' }} />
                            <button 
                              type="button" 
                              onClick={() => setImageUrl('')}
                              style={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                background: '#e05594',
                                color: '#fff',
                                border: 'none',
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 'bold',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                                transition: 'transform 0.2s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                              title="Görseli Kaldır"
                            >
                              ✕
                            </button>
                            <span style={{ color: '#2ecc71', fontSize: 12, marginTop: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <FiCheck /> Görsel başarıyla yüklendi
                            </span>
                          </div>
                        )}

                        <div style={{ marginTop: 20 }}>
                          <label className={styles.fieldLabel}>Alternatif: Görsel Web Adresi (URL)</label>
                          <input 
                            type="text" 
                            value={imageUrl} 
                            onChange={e => setImageUrl(e.target.value)} 
                            className={styles.fieldInput} 
                            placeholder="Örn: https://example.com/resim.jpg" 
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ADIM 4: DETAYLAR VE SEÇENEKLER */}
                  {modalStep === 4 && (
                    <motion.div 
                      key="step4"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Section 1: Açıklamalar */}
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(201, 162, 39, 0.1)', border: '1px solid rgba(201, 162, 39, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-light)' }}>
                            <FiFileText size={16} />
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#fff' }}>Açıklamalar</span>
                            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Kart ve detay açıklama metinleri</span>
                          </div>
                        </div>

                        <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr', gap: 12 }}>
                          <div className={styles.formField}>
                            <label className={styles.fieldLabel}>Kısa Açıklama *</label>
                            <input type="text" required value={shortDescription} onChange={e => { setShortDescription(e.target.value); setFieldErrors(prev => ({ ...prev, shortDescription: '' })); }} className={styles.fieldInput} placeholder="Ürün kartında listelenen kısa özet metin" />
                            {fieldErrors.shortDescription && <span style={{ color: '#e05594', fontSize: 11, marginTop: 4, display: 'block' }}>{fieldErrors.shortDescription}</span>}
                          </div>
                          <div className={styles.formField}>
                            <label className={styles.fieldLabel}>Detaylı Açıklama *</label>
                            <textarea required value={description} onChange={e => { setDescription(e.target.value); setFieldErrors(prev => ({ ...prev, description: '' })); }} className={styles.fieldInput} rows={3} style={{ resize: 'vertical' }} placeholder="Ürün detay sayfasındaki tam açıklama" />
                            {fieldErrors.description && <span style={{ color: '#e05594', fontSize: 11, marginTop: 4, display: 'block' }}>{fieldErrors.description}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Seçenekler (iOS Switch UI) */}
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(201, 162, 39, 0.1)', border: '1px solid rgba(201, 162, 39, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-light)' }}>
                            <FiSliders size={16} />
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#fff' }}>Yayın Seçenekleri</span>
                            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Ürünün sitedeki etiketlerini ve durumunu açın</span>
                          </div>
                        </div>

                        {/* iOS Style switches */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          {[
                            { label: "Yeni Ürün", sub: "Ürüne 'YENİ' rozeti ekler", checked: isNew, set: setIsNew },
                            { label: "İndirimde", sub: "İndirim rozeti ve indirim notu gösterilir", checked: isSale, set: setIsSale },
                            { label: "Öne Çıkar", sub: "Ana sayfada vitrine yerleştirilir", checked: isFeatured, set: setIsFeatured },
                            { label: "Satışa Açık", sub: "Müşteriler bu ürünü sipariş edebilir", checked: isActive, set: setIsActive }
                          ].map((t, idx) => (
                            <div key={idx} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: 12, 
                              background: 'rgba(0,0,0,0.15)', 
                              border: '1px solid rgba(255,255,255,0.03)', 
                              borderRadius: 10 
                            }}>
                              <div style={{ paddingRight: 8 }}>
                                <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff' }}>{t.label}</span>
                                <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{t.sub}</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => t.set(!t.checked)}
                                style={{
                                  width: 40,
                                  height: 22,
                                  borderRadius: 11,
                                  background: t.checked ? '#2ecc71' : 'rgba(255,255,255,0.08)',
                                  border: 'none',
                                  position: 'relative',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s ease',
                                  padding: 0,
                                  flexShrink: 0
                                }}
                              >
                                <div style={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: '50%',
                                  background: '#fff',
                                  position: 'absolute',
                                  top: 2,
                                  left: t.checked ? 20 : 2,
                                  transition: 'left 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                                }} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Sihirbaz Navigasyon Butonları */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {/* Sol Taraf: İptal ve Geri Butonları */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)} 
                      className={styles.seeAllBtn}
                      style={{ padding: '10px 18px', fontSize: 13, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
                    >
                      İptal
                    </button>
                    {modalStep > 1 && (
                      <button 
                        type="button" 
                        onClick={() => setModalStep(s => s - 1)} 
                        className={styles.seeAllBtn}
                        style={{ padding: '10px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', color: '#fff' }}
                      >
                        <FiChevronLeft size={16} /> Geri
                      </button>
                    )}
                  </div>

                  {/* Sağ Taraf: İleri (Adım 1-3) veya Ürünü Kaydet (Yalnızca Adım 4) */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {modalStep < 4 ? (
                      <button 
                        type="button" 
                        onClick={() => {
                          if (modalStep === 1 && !name.trim()) {
                            alert("Lütfen ürün adını doldurun.");
                            return;
                          }
                          if (modalStep === 2 && (price === "" || price == null || isNaN(parseFloat(price)))) {
                            alert("Lütfen geçerli bir fiyat girin.");
                            return;
                          }
                          setModalStep(s => s + 1);
                        }} 
                        className={styles.seeAllBtn}
                        style={{ padding: '10px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, var(--gold-light), var(--gold-dark))', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                      >
                        İleri <FiChevronRight size={16} />
                      </button>
                    ) : (
                      <button 
                        type="submit" 
                        className={styles.shopBtn}
                        style={{ padding: '10px 24px', fontSize: 13, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, var(--gold-light), var(--gold-dark))', color: '#000', borderRadius: 8, cursor: 'pointer', boxShadow: '0 4px 15px rgba(201,162,39,0.3)' }}
                      >
                        <FiCheck size={16} /> {modalMode === 'create' ? 'Ürünü Kaydet' : 'Değişiklikleri Kaydet'}
                      </button>
                    )}
                  </div>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
