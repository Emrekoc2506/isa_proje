import { useState, useEffect } from 'react';
import { FiEye, FiX } from 'react-icons/fi';
import * as orderApi from '../../../services/orderApi';
import styles from '../AdminPage.module.css';

export default function OrdersSection() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal States
  const [showDetail, setShowDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getAdminOrders({ page, pageSize: 10 });
      setOrders(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const handleOpenDetail = async (orderId) => {
    try {
      const details = await orderApi.getAdminOrderById(orderId);
      setSelectedOrder(details);
      setShowDetail(true);
    } catch (err) {
      alert("Sipariş detayları yüklenemedi: " + err.message);
    }
  };

  return (
    <div className={styles.sectionCard}>
      <h3 className={styles.sectionTitle}>Sipariş Takibi</h3>

      {loading ? (
        <p>Siparişler yükleniyor...</p>
      ) : (
        <>
          <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-gold)' }}>
                <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Sipariş No</th>
                <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Müşteri</th>
                <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Tarih</th>
                <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Tutar</th>
                <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Ödeme Durumu</th>
                <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Durum</th>
                <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: 8, color: 'var(--gold-light)', fontWeight: 600 }}>#{o.orderNumber || o.id.substring(0,8).toUpperCase()}</td>
                  <td style={{ padding: 8, color: '#fff' }}>{o.customerName || 'Misafir Müşteri'}</td>
                  <td style={{ padding: 8, color: 'var(--text-secondary)' }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('tr-TR') : ''}</td>
                  <td style={{ padding: 8, color: '#fff' }}>{o.totalAmount || o.grandTotal} {o.currency || 'TRY'}</td>
                  <td style={{ padding: 8, color: o.paymentStatus === 'Paid' ? '#2ecc71' : '#f1c40f' }}>{o.paymentStatus === 'Paid' ? 'Ödendi' : 'Bekliyor'}</td>
                  <td style={{ padding: 8, color: 'var(--gold)' }}>{o.statusText || 'Sipariş Verildi'}</td>
                  <td style={{ padding: 8 }}>
                    <button onClick={() => handleOpenDetail(o.id)} className={styles.seeAllBtn} style={{ padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiEye /> Detay
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Henüz sipariş bulunmamaktadır.</td>
                </tr>
              )}
            </tbody>
          </table>

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

      {/* DETAIL MODAL */}
      {showDetail && selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, overflowY: 'auto' }}>
          <div className={styles.sectionCard} style={{ width: '90%', maxWidth: 550, margin: '40px auto', background: 'var(--bg-dark)', border: '1px solid var(--border-gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h4 style={{ color: 'var(--gold-light)', margin: 0, fontSize: 16 }}>Sipariş Detayı: #{selectedOrder.orderNumber}</h4>
              <button onClick={() => setShowDetail(false)} className={styles.iconBtn} style={{ color: '#fff' }}><FiX /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--text-secondary)' }}>Müşteri: <strong style={{ color: '#fff' }}>{selectedOrder.customerName}</strong></p>
                <p style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--text-secondary)' }}>E-posta: {selectedOrder.customerEmail || 'Belirtilmemiş'}</p>
                <p style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--text-secondary)' }}>Telefon: {selectedOrder.customerPhone || 'Belirtilmemiş'}</p>
                <p style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--text-secondary)' }}>Tarih: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('tr-TR') : ''}</p>
                <p style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--text-secondary)' }}>Kargo Metodu: {selectedOrder.shippingMethodCode || 'Standart'}</p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Toplam Tutar: <strong style={{ color: 'var(--gold-light)' }}>{selectedOrder.totalAmount || selectedOrder.grandTotal} {selectedOrder.currency || 'TRY'}</strong></p>
              </div>

              <div>
                <h5 style={{ margin: '0 0 8px 0', color: 'var(--gold-light)', fontSize: 14 }}>Ürünler</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                      <span style={{ color: '#fff' }}>{item.productName}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.quantity} adet × {item.unitPrice} ₺</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 style={{ margin: '0 0 8px 0', color: 'var(--gold-light)', fontSize: 14 }}>Adres Bilgileri</h5>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ margin: '0 0 4px 0', color: '#fff', fontSize: 13, fontWeight: 600 }}>Teslimat Adresi:</p>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 12 }}>
                    {selectedOrder.shippingAddress?.fullName}<br/>
                    {selectedOrder.shippingAddress?.neighborhood}, {selectedOrder.shippingAddress?.addressLine}<br/>
                    {selectedOrder.shippingAddress?.district}/{selectedOrder.shippingAddress?.city}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
