import { useState, useEffect } from 'react';
import { FiTrash2, FiEdit3, FiPlus, FiGrid, FiList, FiAlertCircle } from 'react-icons/fi';
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

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, overflowY: 'auto' }}>
          <div className={styles.sectionCard} style={{ width: '90%', maxWidth: 650, margin: '40px auto', background: 'var(--bg-dark)' }}>
            <h4 style={{ color: 'var(--gold-light)', margin: '0 0 20px 0', fontSize: 18 }}>{modalMode === 'create' ? 'Yeni Ürün Ekle' : 'Ürünü Düzenle'}</h4>
            <form onSubmit={handleSave} className={styles.profileForm}>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Ürün Adı *</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className={styles.fieldInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Slug</label>
                  <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className={styles.fieldInput} placeholder="Bos birakilirsa otomatik uretilir" />
                </div>
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
                  <label className={styles.fieldLabel}>Birim</label>
                  <input type="text" value={unit} onChange={e => setUnit(e.target.value)} className={styles.fieldInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Kategori *</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={styles.fieldInput} style={{ background: 'rgba(0,0,0,0.3)', color: '#fff' }}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>İndirim Notu (Örn: %20 İndirim)</label>
                  <input type="text" value={discount} onChange={e => setDiscount(e.target.value)} className={styles.fieldInput} />
                </div>
                <div className={styles.formField} style={{ gridColumn: 'span 2' }}>
                  <label className={styles.fieldLabel}>Görsel Dosyası Yükle</label>
                  <input type="file" onChange={handleImageUpload} style={{ display: 'block', color: '#fff', fontSize: 13, marginTop: 4 }} />
                  {uploadingImg && <p style={{ color: 'var(--gold)', fontSize: 12, margin: '4px 0 0 0' }}>Yükleniyor...</p>}
                  {imageUrl && <p style={{ color: '#2ecc71', fontSize: 12, margin: '4px 0 0 0' }}>Yüklendi: {imageUrl.substring(0, 50)}...</p>}
                </div>
                <div className={styles.formField} style={{ gridColumn: 'span 2' }}>
                  <label className={styles.fieldLabel}>Kısa Açıklama</label>
                  <input type="text" value={shortDescription} onChange={e => setShortDescription(e.target.value)} className={styles.fieldInput} />
                </div>
                <div className={styles.formField} style={{ gridColumn: 'span 2' }}>
                  <label className={styles.fieldLabel}>Detaylı Açıklama</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className={styles.fieldInput} rows={3} style={{ resize: 'vertical' }} />
                </div>
                <div className={styles.formField} style={{ gridColumn: 'span 2', display: 'flex', gap: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={isNew} onChange={e => setIsNew(e.target.checked)} /> Yeni Ürün
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={isSale} onChange={e => setIsSale(e.target.checked)} /> İndirimde
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} /> Öne Çıkar
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="submit" className={styles.shopBtn}>Kaydet</button>
                <button type="button" onClick={() => setShowModal(false)} className={styles.seeAllBtn}>İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
