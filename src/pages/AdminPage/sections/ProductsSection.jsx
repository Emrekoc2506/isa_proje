import { useState, useEffect } from 'react';
import { FiTrash2, FiEdit3, FiPlus, FiGrid, FiList, FiAlertCircle, FiLock, FiUnlock } from 'react-icons/fi';
import * as productApi from '../../../services/productApi';
import * as categoryApi from '../../../services/categoryApi';
import { uploadFile } from '../../../services/fileApi';
import styles from '../AdminPage.module.css';

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
      if (data?.length > 0) setCategoryId(data[0].id);
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
    if (categories.length > 0) setCategoryId(categories[0].id);
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
    setModalStep(1); // Adımı sıfırla
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setModalMode('edit');
    setCurrentId(p.id);
    setName(p.name || '');
    setPrice(p.price || '');
    setOldPrice(p.oldPrice || '');
    setStockQuantity(p.stockQuantity || 0);
    setCategoryId(p.categoryId || '');
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
    setModalStep(1); // Adımı sıfırla
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

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      price: parseFloat(price),
      oldPrice: oldPrice ? parseFloat(oldPrice) : null,
      stockQuantity: stockQuantity ? parseInt(stockQuantity) : 0,
      categoryId,
      imageUrl: imageUrl || null,
      isNew,
      isSale,
      isFeatured,
      shortDescription: shortDescription || null,
      description: description || null,
      unit,
      discount: discount || null,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      isActive
    };

    try {
      if (modalMode === 'create') {
        await productApi.createAdminProduct(payload);
      } else {
        await productApi.updateAdminProduct(currentId, payload);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      alert(err.message || 'Ürün kaydedilemedi.');
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
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Ürün Yönetimi</h3>
        <button onClick={handleOpenCreate} className={styles.shopBtn}>
          <FiPlus /> Yeni Ürün Ekle
        </button>
      </div>

      {loading ? (
        <p>Yükleniyor...</p>
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
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, overflowY: 'auto' }}>
          <div className={styles.sectionCard} style={{ width: '90%', maxWidth: 600, margin: '40px auto', background: 'var(--bg-dark)', border: '1px solid rgba(201, 162, 39, 0.15)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h4 style={{ color: 'var(--gold-light)', margin: 0, fontSize: 18 }}>
                {modalMode === 'create' ? 'Yeni Ürün Ekle' : 'Ürünü Düzenle'}
              </h4>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}
              >
                ✕
              </button>
            </div>

            {/* Adım Göstergesi (Progress Bar - ozel_hoca CreateListing esintili) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, position: 'relative', padding: '0 8px' }}>
              <div style={{ position: 'absolute', top: '35%', left: 0, right: 0, height: 2, background: 'rgba(255, 255, 255, 0.05)', zIndex: 1 }} />
              <div style={{ 
                position: 'absolute', 
                top: '35%', 
                left: 0, 
                width: `${((modalStep - 1) / (STEPS.length - 1)) * 100}%`, 
                height: 2, 
                background: 'var(--gold)', 
                zIndex: 2, 
                transition: 'width 0.3s ease' 
              }} />
              
              {[
                { id: 1, label: "Genel" },
                { id: 2, label: "Fiyat & Stok" },
                { id: 3, label: "Görsel" },
                { id: 4, label: "Detaylar" }
              ].map((s) => {
                const isCompleted = modalStep > s.id;
                const isActive = modalStep === s.id;
                return (
                  <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, position: 'relative' }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: isCompleted ? 'var(--gold)' : isActive ? 'var(--bg-dark)' : 'rgba(255, 255, 255, 0.08)',
                      border: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                      color: isCompleted ? '#000' : isActive ? 'var(--gold-light)' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: 12,
                      transition: 'all 0.3s ease'
                    }}>
                      {isCompleted ? '✓' : s.id}
                    </div>
                    <span style={{ fontSize: 9, color: isActive ? 'var(--gold-light)' : 'var(--text-muted)', marginTop: 6, fontWeight: isActive ? 'bold' : 'normal' }}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSave} className={styles.profileForm}>
              
              {/* ADIM 1: GENEL BİLGİLER */}
              {modalStep === 1 && (
                <div className={styles.formGrid}>
                  <div className={styles.formField} style={{ gridColumn: 'span 2' }}>
                    <label className={styles.fieldLabel}>Ürün Adı *</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className={styles.fieldInput} />
                  </div>
                  <div className={styles.formField} style={{ gridColumn: 'span 2' }}>
                    <label className={styles.fieldLabel}>Kategori *</label>
                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={styles.fieldInput} style={{ background: 'rgba(0,0,0,0.3)', color: '#fff' }}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Birim (Örn: Adet, Gram)</label>
                    <input type="text" value={unit} onChange={e => setUnit(e.target.value)} className={styles.fieldInput} />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Takma Ad (Slug)</label>
                    <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className={styles.fieldInput} placeholder="Boş bırakılırsa otomatik üretilir" />
                  </div>
                </div>
              )}

              {/* ADIM 2: FİYAT & STOK */}
              {modalStep === 2 && (
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Fiyat (₺) *</label>
                    <input type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} className={styles.fieldInput} />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Eski Fiyat (₺)</label>
                    <input type="number" step="0.01" value={oldPrice} onChange={e => setOldPrice(e.target.value)} className={styles.fieldInput} />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Stok Adedi *</label>
                    <input type="number" required value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} className={styles.fieldInput} />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>İndirim Notu (Örn: %20 İndirim)</label>
                    <input type="text" value={discount} onChange={e => setDiscount(e.target.value)} className={styles.fieldInput} />
                  </div>
                </div>
              )}

              {/* ADIM 3: GÖRSEL YÜKLE */}
              {modalStep === 3 && (
                <div className={styles.formGrid}>
                  <div className={styles.formField} style={{ gridColumn: 'span 2' }}>
                    <label className={styles.fieldLabel} style={{ marginBottom: 10 }}>Ürün Görseli</label>
                    
                    {!imageUrl ? (
                      <div 
                        style={{
                          border: '2px dashed rgba(201, 162, 39, 0.25)',
                          borderRadius: 8,
                          padding: '30px 20px',
                          textAlign: 'center',
                          background: 'rgba(0, 0, 0, 0.2)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'border-color 0.2s'
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
                        <div style={{ fontSize: 32, color: 'var(--gold-light)', marginBottom: 8 }}>📷</div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', fontWeight: 500 }}>Görsel yüklemek için tıklayın</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Tavsiye edilen: Kare (1:1) JPG, PNG, WEBP</span>
                        
                        {uploadingImg && (
                          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                            <span style={{ color: 'var(--gold-light)', fontSize: 12, fontWeight: 'bold' }}>Görsel Yükleniyor...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        border: '1px solid rgba(201, 162, 39, 0.2)',
                        borderRadius: 8,
                        padding: 12,
                        background: 'rgba(0, 0, 0, 0.3)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}>
                        <img src={imageUrl} alt="Ürün" style={{ width: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 4, background: 'rgba(0,0,0,0.1)' }} />
                        <button 
                          type="button" 
                          onClick={() => setImageUrl('')}
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            background: '#e05594',
                            color: '#fff',
                            border: 'none',
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                          }}
                          title="Görseli Kaldır"
                        >
                          ✕
                        </button>
                        <span style={{ color: '#2ecc71', fontSize: 11, marginTop: 8, fontWeight: 500 }}>✓ Görsel başarıyla eşleştirildi</span>
                      </div>
                    )}

                    <div style={{ marginTop: 12 }}>
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
                </div>
              )}

              {/* ADIM 4: DETAYLAR VE SEÇENEKLER */}
              {modalStep === 4 && (
                <div className={styles.formGrid}>
                  <div className={styles.formField} style={{ gridColumn: 'span 2' }}>
                    <label className={styles.fieldLabel}>Kısa Açıklama</label>
                    <input type="text" value={shortDescription} onChange={e => setShortDescription(e.target.value)} className={styles.fieldInput} placeholder="Kartlarda görünecek kısa özet" />
                  </div>
                  <div className={styles.formField} style={{ gridColumn: 'span 2' }}>
                    <label className={styles.fieldLabel}>Detaylı Açıklama</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className={styles.fieldInput} rows={3} style={{ resize: 'vertical' }} placeholder="Ürün detay sayfasındaki uzun açıklama" />
                  </div>
                  <div className={styles.formField} style={{ gridColumn: 'span 2', display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                      <input type="checkbox" checked={isNew} onChange={e => setIsNew(e.target.checked)} /> Yeni Ürün
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                      <input type="checkbox" checked={isSale} onChange={e => setIsSale(e.target.checked)} /> İndirimde
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                      <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} /> Öne Çıkar
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                      <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> Satışa Açık
                    </label>
                  </div>
                </div>
              )}

              {/* BUTONLAR (Sihirbaz Navigasyonu) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {modalStep > 1 ? (
                  <button 
                    type="button" 
                    onClick={() => setModalStep(s => s - 1)} 
                    className={styles.seeAllBtn}
                    style={{ padding: '8px 16px', fontSize: 13 }}
                  >
                    ← Geri
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className={styles.seeAllBtn}
                    style={{ padding: '8px 16px', fontSize: 13 }}
                  >
                    İptal
                  </button>
                )}

                {modalStep < 4 ? (
                  <button 
                    type="button" 
                    onClick={() => {
                      // Temel Validasyonlar
                      if (modalStep === 1 && !name.trim()) {
                        alert("Lütfen ürün adını doldurun.");
                        return;
                      }
                      if (modalStep === 2 && (!price || !stockQuantity)) {
                        alert("Lütfen fiyat ve stok alanlarını doldurun.");
                        return;
                      }
                      setModalStep(s => s + 1);
                    }} 
                    className={styles.shopBtn}
                    style={{ padding: '8px 16px', fontSize: 13 }}
                  >
                    İleri →
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    className={styles.shopBtn}
                    style={{ padding: '8px 24px', fontSize: 13, fontWeight: 'bold' }}
                  >
                    ✓ Kaydet
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
