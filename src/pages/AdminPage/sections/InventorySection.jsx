import { useState, useEffect, useRef } from 'react';
import { FiAlertTriangle, FiCheck, FiSave, FiChevronDown, FiChevronUp, FiBox, FiSearch, FiX } from 'react-icons/fi';
import * as productApi from '../../../services/productApi';
import { getSafeStockQuantity } from '../../../utils/stockUtils';
import { useProducts } from '../../../context/ProductContext';
import { useTheme } from '../../../context/ThemeContext';
import styles from '../AdminPage.module.css';

export default function InventorySection() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Optional ProductContext hook access (safe for isolated component testing)
  let refreshProducts = null;
  try {
    const prodCtx = useProducts();
    refreshProducts = prodCtx?.refreshProducts;
  } catch {
    // Component used outside ProductProvider in isolated test
  }

  // Per-row editing state maps: { [id]: value }
  const [editingIds, setEditingIds] = useState({});
  const [stockValues, setStockValues] = useState({});
  const [updatingIds, setUpdatingIds] = useState({});
  const [successIds, setSuccessIds] = useState({});
  const [errorMsgs, setErrorMsgs] = useState({});
  const [expandedVariants, setExpandedVariants] = useState({});
  const isUpdatingStockRef = useRef({});

  const loadInventory = async () => {
    try {
      setLoading(true);
      const [allRes, lowRes] = await Promise.all([
        productApi.getAdminProducts({ page: 1, pageSize: 500 }).catch(() => ({ items: [] })),
        productApi.getAdminLowStockProducts().catch(() => [])
      ]);

      const itemsList = Array.isArray(allRes) ? allRes : (allRes?.items || []);
      setProducts(itemsList);
      setLowStockProducts(Array.isArray(lowRes) ? lowRes : []);
    } catch (err) {
      console.error("Envanter yükleme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleStartEdit = (id, currentStock) => {
    setEditingIds(prev => ({ ...prev, [id]: true }));
    setStockValues(prev => ({ ...prev, [id]: String(currentStock ?? 0) }));
    setErrorMsgs(prev => ({ ...prev, [id]: null }));
  };

  const handleCancelEdit = (id) => {
    setEditingIds(prev => ({ ...prev, [id]: false }));
    setErrorMsgs(prev => ({ ...prev, [id]: null }));
  };

  const handleUpdateStock = async (id, isVariant = false, productId = null) => {
    if (isUpdatingStockRef.current[id] || updatingIds[id]) return;

    const rawVal = stockValues[id];
    const stockQuantity = parseInt(rawVal, 10);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      setErrorMsgs(prev => ({ ...prev, [id]: 'Lütfen geçerli (0 veya büyük) bir stok adedi girin.' }));
      return;
    }

    try {
      isUpdatingStockRef.current[id] = true;
      setUpdatingIds(prev => ({ ...prev, [id]: true }));
      setErrorMsgs(prev => ({ ...prev, [id]: null }));

      if (isVariant && productId) {
        await productApi.updateAdminProductVariantStock(productId, id, {
          stockQuantity,
          note: "Envanter ekranından varyant stok güncelleme"
        });
      } else {
        await productApi.updateAdminProductStock(id, {
          stockQuantity,
          note: "Envanter ekranından hızlı stok güncelleme"
        });
      }

      // Re-fetch backend DB state to ensure 100% persistence alignment
      await loadInventory();
      if (refreshProducts) {
        refreshProducts().catch(() => null);
      }

      setEditingIds(prev => ({ ...prev, [id]: false }));
      setSuccessIds(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setSuccessIds(prev => ({ ...prev, [id]: false }));
      }, 3000);
    } catch (err) {
      console.error("Stok güncellenemedi:", err);
      const msg = err?.status === 403
        ? "Bu işlem için yetki gereklidir."
        : (err?.message || "Stok güncellenemedi. Lütfen tekrar deneyin.");
      setErrorMsgs(prev => ({ ...prev, [id]: msg }));
    } finally {
      isUpdatingStockRef.current[id] = false;
      setUpdatingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const toggleVariants = (productId) => {
    setExpandedVariants(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  if (loading) return <p style={{ color: 'var(--text-secondary)', padding: 20 }}>Envanter yükleniyor...</p>;

  const baseProducts = filterLowStock ? lowStockProducts : products;
  const displayedProducts = baseProducts.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (p.name || p.Name || '').toLowerCase().includes(q);
    const skuMatch = (p.sku || p.Sku || '').toLowerCase().includes(q);
    const idMatch = String(p.id || '').toLowerCase().includes(q);
    return nameMatch || skuMatch || idMatch;
  });

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Stok & Envanter Yönetimi</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: 260 }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-light)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Ürün adı veya SKU ara..."
              style={{
                width: '100%',
                padding: '8px 32px 8px 36px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-gold, rgba(201, 162, 39, 0.3))',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                title="Aramayı Temizle"
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => setFilterLowStock(prev => !prev)}
            className={styles.seeAllBtn}
            style={{
              background: filterLowStock ? 'rgba(224, 85, 148, 0.2)' : 'rgba(255,255,255,0.05)',
              borderColor: filterLowStock ? '#e05594' : 'var(--border-mid)',
              color: filterLowStock ? '#e05594' : '#fff'
            }}
          >
            <FiAlertTriangle /> {filterLowStock ? 'Tüm Ürünleri Göster' : 'Kritik Stok Uyarısı (≤ 3)'}
          </button>
        </div>
      </div>

      <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-gold)' }}>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Görsel</th>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Ürün Adı</th>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Mevcut Stok</th>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Durum</th>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Stok İşlemi</th>
          </tr>
        </thead>
        <tbody>
          {displayedProducts.map(p => {
            const currentStock = getSafeStockQuantity(p);
            const isCritical = currentStock <= 3;
            const isEditing = Boolean(editingIds[p.id]);
            const isUpdating = Boolean(updatingIds[p.id]);
            const isSuccess = Boolean(successIds[p.id]);
            const errorMsg = errorMsgs[p.id];
            const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
            const isVariantExpanded = Boolean(expandedVariants[p.id]);
            const imgUrl = p.imageUrl || p.ImageUrl || p.image || p.Image || "https://images.unsplash.com/photo-1602928321679-560bb453f190?w=100";

            return (
              <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: 8 }}>
                  <img
                    src={imgUrl}
                    alt={p.name || ''}
                    style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(201,162,39,0.3)' }}
                  />
                </td>
                <td style={{ padding: '12px 8px', color: isLight ? '#111827' : '#fff' }}>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <a
                      href={`/urun/${p.slug || p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ürün sayfasına git (Yeni Sekmede Açılır)"
                      style={{ color: isLight ? '#111827' : '#ffffff', textDecoration: 'none', transition: 'color 0.2s', fontWeight: 600 }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--gold-light, #c9a227)'}
                      onMouseLeave={e => e.currentTarget.style.color = isLight ? '#111827' : '#ffffff'}
                    >
                      {p.name}
                    </a>
                    {p.isNew && <span style={{ fontSize: 9, background: 'rgba(52,152,219,0.15)', color: '#3498db', padding: '2px 6px', borderRadius: 4 }}>YENİ</span>}
                    {p.isSale && <span style={{ fontSize: 9, background: 'rgba(224,85,148,0.15)', color: '#e05594', padding: '2px 6px', borderRadius: 4 }}>İNDİRİM</span>}
                    {hasVariants && (
                      <button
                        onClick={() => toggleVariants(p.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--gold-light)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11
                        }}
                      >
                        <FiBox /> ({p.variants.length} Varyant)
                        {isVariantExpanded ? <FiChevronUp /> : <FiChevronDown />}
                      </button>
                    )}
                  </div>
                  {p.sku && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>SKU: {p.sku}</span>}
                  {errorMsg && (
                    <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>
                      ⚠️ {errorMsg}
                    </div>
                  )}
                </td>

                <td style={{ padding: '12px 8px', fontWeight: 700, color: isCritical ? '#e05594' : '#2ecc71' }}>
                  {currentStock} Adet
                </td>

                <td style={{ padding: '12px 8px' }}>
                  {isCritical ? (
                    <span style={{ fontSize: 11, background: 'rgba(224,85,148,0.15)', color: '#e05594', padding: '3px 8px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <FiAlertTriangle /> Düşük Stok!
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, background: 'rgba(46,204,113,0.15)', color: '#2ecc71', padding: '3px 8px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <FiCheck /> Normal
                    </span>
                  )}
                </td>

                <td style={{ padding: '12px 8px' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="number"
                        value={stockValues[p.id] ?? ''}
                        onChange={e => setStockValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                        className={styles.fieldInput}
                        style={{ width: 90, padding: '6px 8px', fontSize: 13, background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid var(--border-gold)', borderRadius: 6 }}
                        min="0"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateStock(p.id)}
                        disabled={isUpdating}
                        title="Kaydet"
                        aria-label="Kaydet"
                        className={styles.shopBtn}
                        style={{ padding: '6px 12px', fontSize: 12 }}
                      >
                        {isUpdating ? '...' : <FiSave />}
                      </button>
                      <button
                        onClick={() => handleCancelEdit(p.id)}
                        className={styles.seeAllBtn}
                        style={{ padding: '6px 12px', fontSize: 12 }}
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => handleStartEdit(p.id, currentStock)}
                        className={styles.seeAllBtn}
                        style={{ padding: '6px 12px', fontSize: 12 }}
                      >
                        Stok Güncelle
                      </button>
                      {isSuccess && (
                        <span style={{ color: '#2ecc71', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <FiCheck /> Güncellendi
                        </span>
                      )}
                    </div>
                  )}

                  {/* Varyantlar Açılmışsa Alt Liste */}
                  {hasVariants && isVariantExpanded && (
                    <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: '2px solid var(--border-gold)' }}>
                      {p.variants.map(v => {
                        const vStock = getSafeStockQuantity(v);
                        const isVEditing = Boolean(editingIds[v.id]);
                        const isVUpdating = Boolean(updatingIds[v.id]);
                        const isVSuccess = Boolean(successIds[v.id]);
                        return (
                          <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: 600, color: '#fff' }}>{v.name}:</span>
                            <span>{vStock} adet</span>
                            {isVEditing ? (
                              <div style={{ display: 'inline-flex', gap: 4 }}>
                                <input
                                  type="number"
                                  value={stockValues[v.id] ?? ''}
                                  onChange={e => setStockValues(prev => ({ ...prev, [v.id]: e.target.value }))}
                                  style={{ width: 60, padding: '2px 6px', fontSize: 12, background: '#000', color: '#fff', border: '1px solid var(--gold)' }}
                                  min="0"
                                />
                                <button onClick={() => handleUpdateStock(v.id, true, p.id)} disabled={isVUpdating} title="Kaydet" aria-label="Kaydet" style={{ padding: '2px 6px', fontSize: 11 }}>
                                  {isVUpdating ? '...' : 'Kaydet'}
                                </button>
                                <button onClick={() => handleCancelEdit(v.id)} style={{ padding: '2px 6px', fontSize: 11 }}>
                                  İptal
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(v.id, vStock)}
                                style={{ background: 'none', border: '1px underline', color: 'var(--gold-light)', cursor: 'pointer', fontSize: 11 }}
                              >
                                Düzenle
                              </button>
                            )}
                            {isVSuccess && <span style={{ color: '#2ecc71', fontSize: 11 }}>✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}

          {displayedProducts.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Gereksinimleri karşılayan ürün bulunamadı.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
