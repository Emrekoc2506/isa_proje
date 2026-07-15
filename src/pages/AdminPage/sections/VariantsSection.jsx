import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiEdit3, FiArrowLeft } from 'react-icons/fi';
import * as productApi from '../../../services/productApi';
import styles from '../AdminPage.module.css';

export default function VariantsSection({ product, onBack }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit / Create States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentId, setCurrentId] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [priceOverride, setPriceOverride] = useState('');
  const [oldPriceOverride, setOldPriceOverride] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');

  const fetchVariants = async () => {
    try {
      setLoading(true);
      // Fetch full product details including variants
      const data = await productApi.getAdminProductById(product.id);
      setVariants(data.variants || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, [product]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setCurrentId(null);
    setName('');
    setSku('');
    setBarcode('');
    setPriceOverride('');
    setOldPriceOverride('');
    setStockQuantity('');
    setShowModal(true);
  };

  const handleOpenEdit = (v) => {
    setModalMode('edit');
    setCurrentId(v.id);
    setName(v.name || '');
    setSku(v.sku || '');
    setBarcode(v.barcode || '');
    setPriceOverride(v.priceOverride || '');
    setOldPriceOverride(v.oldPriceOverride || '');
    setStockQuantity(v.stockQuantity || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      sku,
      barcode: barcode || null,
      priceOverride: priceOverride === '' ? null : parseFloat(priceOverride),
      oldPriceOverride: oldPriceOverride === '' ? null : parseFloat(oldPriceOverride),
      stockQuantity: parseInt(stockQuantity) || 0,
      isActive: true,
      imageUrl: null
    };

    try {
      if (modalMode === 'create') {
        await productApi.createAdminProductVariant(product.id, payload);
      } else {
        await productApi.updateAdminProductVariant(product.id, currentId, payload);
      }
      setShowModal(false);
      fetchVariants();
    } catch (err) {
      alert(err.message || 'Varyant kaydedilemedi.');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Bu varyantı silmek istediğinize emin misiniz?')) {
      try {
        await productApi.deleteAdminProductVariant(product.id, id);
        fetchVariants();
      } catch (err) {
        alert(err.message || 'Varyant silinemedi.');
      }
    }
  };

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} className={styles.seeAllBtn} style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiArrowLeft /> Geri
          </button>
          <h3 className={styles.sectionTitle} style={{ margin: 0, border: 'none', padding: 0 }}>
            "{product.name}" Varyantları
          </h3>
        </div>
        <button onClick={handleOpenCreate} className={styles.shopBtn}>
          <FiPlus /> Yeni Varyant Ekle
        </button>
      </div>

      {loading ? (
        <p>Varyantlar yükleniyor...</p>
      ) : (
        <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-gold)' }}>
              <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Seçenek Adı</th>
              <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>SKU</th>
              <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Barkod</th>
              <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Varyant Fiyatı</th>
              <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Stok</th>
              <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {variants.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: 8, color: '#fff' }}>{v.name}</td>
                <td style={{ padding: 8, color: 'var(--text-secondary)' }}>{v.sku}</td>
                <td style={{ padding: 8, color: 'var(--text-secondary)' }}>{v.barcode || '—'}</td>
                <td style={{ padding: 8, color: 'var(--gold-light)' }}>{v.priceOverride ? `${v.priceOverride} ₺` : 'Ana Fiyat'}</td>
                <td style={{ padding: 8, color: v.stockQuantity <= 3 ? '#e05594' : '#2ecc71' }}>{v.stockQuantity} Adet</td>
                <td style={{ padding: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleOpenEdit(v)} className={styles.seeAllBtn} style={{ padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiEdit3 /> Düzenle
                    </button>
                    <button onClick={() => handleDelete(v.id)} className={styles.seeAllBtn} style={{ padding: '4px 8px', fontSize: 11, color: '#e05594', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiTrash2 /> Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {variants.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Bu ürünün henüz varyantı bulunmamaktadır.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className={styles.sectionCard} style={{ width: '90%', maxWidth: 450, background: 'var(--bg-dark)' }}>
            <h4 style={{ color: 'var(--gold-light)', margin: '0 0 20px 0', fontSize: 16 }}>{modalMode === 'create' ? 'Yeni Varyant Ekle' : 'Varyantı Düzenle'}</h4>
            <form onSubmit={handleSave} className={styles.profileForm}>
              <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Varyant Adı (Örn: Gümüş, Altın) *</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className={styles.fieldInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>SKU *</label>
                  <input type="text" required value={sku} onChange={e => setSku(e.target.value)} className={styles.fieldInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Barkod (Opsiyonel)</label>
                  <input type="text" value={barcode} onChange={e => setBarcode(e.target.value)} className={styles.fieldInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Varyant Fiyatı (₺ - Boş bırakılırsa ana ürün fiyatı geçerlidir)</label>
                  <input type="number" step="0.01" value={priceOverride} onChange={e => setPriceOverride(e.target.value)} className={styles.fieldInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Eski Varyant Fiyatı (₺ - İndirim göstermek için)</label>
                  <input type="number" step="0.01" value={oldPriceOverride} onChange={e => setOldPriceOverride(e.target.value)} className={styles.fieldInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Stok Miktarı *</label>
                  <input type="number" required value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} className={styles.fieldInput} />
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
