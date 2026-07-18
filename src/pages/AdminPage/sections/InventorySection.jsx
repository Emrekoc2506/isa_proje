import { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCheck, FiSave } from 'react-icons/fi';
import * as productApi from '../../../services/productApi';
import styles from '../AdminPage.module.css';

export default function InventorySection() {
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Stock edit states
  const [editingId, setEditingId] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadInventory = async () => {
    try {
      setLoading(true);
      // Fetch products list and low stock products list in parallel
      const [allRes, lowRes] = await Promise.all([
        productApi.getAdminProducts({ page: 1, pageSize: 100 }),
        productApi.getAdminLowStockProducts()
      ]);
      
      setProducts(allRes.items || []);
      setLowStockProducts(lowRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleUpdateStock = async (id) => {
    const stockQuantity = parseInt(newStock);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      alert("Lütfen geçerli bir stok adedi girin.");
      return;
    }

    try {
      setUpdatingId(id);
      await productApi.updateAdminProductStock(id, {
        stockQuantity,
        note: "Stok ekranından hızlı stok guncelleme"
      });
      setEditingId(null);
      await loadInventory();
    } catch (err) {
      alert("Stok güncellenemedi: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <p>Envanter yükleniyor...</p>;

  const displayedProducts = filterLowStock ? lowStockProducts : products;

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Stok & Envanter Yönetimi</h3>
        <button 
          onClick={() => setFilterLowStock(f => !f)} 
          className={styles.seeAllBtn}
          style={{
            background: filterLowStock ? 'rgba(224, 85, 148, 0.15)' : 'rgba(255,255,255,0.05)',
            borderColor: filterLowStock ? '#e05594' : 'var(--border-mid)',
            color: filterLowStock ? '#e05594' : '#fff'
          }}
        >
          <FiAlertTriangle /> {filterLowStock ? 'Tüm Ürünleri Göster' : 'Kritik Stok Uyarısı (≤ 3)'}
        </button>
      </div>

      <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-gold)' }}>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Ürün Adı</th>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Mevcut Stok</th>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Durum</th>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Stok Güncelle</th>
          </tr>
        </thead>
        <tbody>
          {displayedProducts.map(p => {
            const isCritical = p.stockQuantity <= 3;
            return (
              <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: 8, color: '#fff' }}>{p.name}</td>
                <td style={{ padding: 8, fontWeight: 600, color: isCritical ? '#e05594' : '#2ecc71' }}>
                  {p.stockQuantity} Adet
                </td>
                <td style={{ padding: 8 }}>
                  {isCritical ? (
                    <span style={{ fontSize: 11, background: 'rgba(224,85,148,0.15)', color: '#e05594', padding: '2px 8px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <FiAlertTriangle /> Düşük Stok!
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, background: 'rgba(46,204,113,0.15)', color: '#2ecc71', padding: '2px 8px', borderRadius: 4 }}>
                      Normal
                    </span>
                  )}
                </td>
                <td style={{ padding: 8 }}>
                  {editingId === p.id ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input 
                        type="number" 
                        value={newStock} 
                        onChange={e => setNewStock(e.target.value)} 
                        className={styles.fieldInput} 
                        style={{ width: 80, padding: '6px 8px', fontSize: 13, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid var(--border-gold)' }} 
                        min="0"
                      />
                      <button 
                        onClick={() => handleUpdateStock(p.id)} 
                        disabled={updatingId === p.id}
                        className={styles.shopBtn}
                        style={{ padding: '6px 12px', fontSize: 12 }}
                      >
                        {updatingId === p.id ? '...' : <FiSave />}
                      </button>
                      <button 
                        onClick={() => setEditingId(null)} 
                        className={styles.seeAllBtn}
                        style={{ padding: '6px 12px', fontSize: 12 }}
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setEditingId(p.id); setNewStock(p.stockQuantity); }} 
                      className={styles.seeAllBtn}
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      Stok Güncelle
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {displayedProducts.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Gereksinimleri karşılayan ürün bulunamadı.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
