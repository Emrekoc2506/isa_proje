import { useState, useEffect } from 'react';
import { FiEye, FiX, FiCheck, FiXCircle, FiFileText, FiDownload, FiLoader, FiFilter } from 'react-icons/fi';
import * as orderApi from '../../../services/orderApi';
import * as bankTransferApi from '../../../services/bankTransferApi';
import { formatTurkishDate } from '../../../utils/dateUtils';
import { translateErrorMessage } from '../../../api/apiError';
import styles from '../AdminPage.module.css';
import { useTheme } from '../../../context/ThemeContext';

export default function OrdersSection() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail & Action Modal States
  const [showDetail, setShowDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Fetch orders from backend
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = { page, pageSize: 20 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const data = await orderApi.getAdminOrders(params);
      if (data && data.items) {
        setOrders(data.items);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setOrders(data);
        setTotalPages(1);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Siparişler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const handleOpenDetail = async (order) => {
    try {
      const details = await orderApi.getAdminOrderById(order.id);
      setSelectedOrder(details);
      setShowDetail(true);
    } catch (err) {
      alert("Sipariş detayları yüklenemedi: " + translateErrorMessage(err.message));
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrder?.id) return;
    setProcessingAction(true);
    try {
      await bankTransferApi.adminConfirmBankTransfer(selectedOrder.id, {
        isConfirmed: true,
        note: "Havale ödemesi yönetici tarafından onaylandı."
      });
      alert("Havale ödemesi başarıyla onaylandı (Ödeme Alındı).");
      setShowConfirmModal(false);
      // Detayı ve listeyi güncelle
      const updated = await orderApi.getAdminOrderById(selectedOrder.id);
      setSelectedOrder(updated);
      await fetchOrders();
    } catch (err) {
      alert("Ödeme onaylanırken hata oluştu: " + (translateErrorMessage(err.message) || err.message || err));
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedOrder?.id) return;
    setProcessingAction(true);
    try {
      await bankTransferApi.adminRejectBankTransfer(selectedOrder.id, rejectReason || "Banka hesabında ödeme tespit edilemedi.");
      alert("Ödeme bildirimi reddedildi.");
      setShowRejectModal(false);
      setRejectReason('');
      // Detayı ve listeyi güncelle
      const updated = await orderApi.getAdminOrderById(selectedOrder.id);
      setSelectedOrder(updated);
      await fetchOrders();
    } catch (err) {
      alert("Ödeme reddedilirken hata oluştu: " + (err.message || err));
    } finally {
      setProcessingAction(false);
    }
  };

  // Filtered Orders
  const filteredOrders = orders.filter(o => {
    const m = String(o.paymentMethod || '').toLowerCase();
    const s = String(o.paymentStatus || '').toLowerCase();

    if (methodFilter === 'BankTransfer' && m !== 'banktransfer') return false;
    if (methodFilter === 'OnlineCard' && m !== 'onlinecard') return false;

    if (statusFilter === 'Pending' && !['pending', 'unpaid', 'ödeme bekliyor'].includes(s)) return false;
    if (statusFilter === 'PendingVerification' && !['pendingverification', 'kontrol bekliyor'].includes(s)) return false;
    if (statusFilter === 'Paid' && !['paid', 'ödendi'].includes(s)) return false;
    if (statusFilter === 'Rejected' && !['rejected', 'reddedildi'].includes(s)) return false;

    return true;
  });

  const getPaymentStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'paid' || s === 'ödendi') {
      return <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71', fontWeight: 600 }}>Ödendi</span>;
    }
    if (s === 'pendingverification' || s === 'kontrol bekliyor') {
      return <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 600 }}>Kontrol Bekliyor</span>;
    }
    if (s === 'rejected' || s === 'reddedildi') {
      return <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontWeight: 600 }}>Reddedildi</span>;
    }
    return <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(230, 126, 34, 0.15)', color: '#e67e22', fontWeight: 600 }}>Ödeme Bekliyor</span>;
  };

  const getPaymentMethodBadge = (method) => {
    const m = String(method || '').toLowerCase();
    if (m === 'banktransfer') {
      return <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'rgba(201, 162, 39, 0.15)', color: 'var(--gold-light)', fontWeight: 600 }}>Havale / EFT</span>;
    }
    if (m === 'cashondelivery') {
      return <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', fontWeight: 600 }}>Kapıda Ödeme</span>;
    }
    return <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontWeight: 600 }}>Kredi Kartı</span>;
  };

  return (
    <div className={styles.sectionCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Sipariş Takibi & Havale Yönetimi</h3>

        {/* Filtre Barı */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ödeme Yöntemi:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              style={{ padding: '4px 8px', background: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border-gold)', borderRadius: 4, fontSize: 12 }}
            >
              <option value="ALL">Tümü</option>
              <option value="BankTransfer">Banka Havalesi / EFT</option>
              <option value="OnlineCard">Kredi Kartı</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ödeme Durumu:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '4px 8px', background: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border-gold)', borderRadius: 4, fontSize: 12 }}
            >
              <option value="ALL">Tümü</option>
              <option value="Pending">Ödeme Bekliyor</option>
              <option value="PendingVerification">Kontrol Bekliyor (Dekontlu)</option>
              <option value="Paid">Ödendi</option>
              <option value="Rejected">Reddedildi</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Siparişler yükleniyor...</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
            <table className={styles.table} style={{ width: '100%', minWidth: 750, borderCollapse: 'collapse', marginTop: 8 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-gold)' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Sipariş No</th>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Müşteri</th>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Tarih</th>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Tutar</th>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Yöntem</th>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Ödeme Durumu</th>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Sipariş Durumu</th>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => (
                  <tr key={o.id} style={{ borderBottom: isLight ? '1px solid var(--border-gold)' : '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: 8, color: 'var(--gold-light)', fontWeight: 600 }}>#{o.orderNumber || (o.id ? o.id.substring(0,8).toUpperCase() : '')}</td>
                    <td style={{ padding: 8, color: 'var(--text-primary)' }}>{o.customerName || o.customerEmail || 'Müşteri'}</td>
                    <td style={{ padding: 8, color: 'var(--text-secondary)', fontSize: 12 }}>{formatTurkishDate(o.createdAt)}</td>
                    <td style={{ padding: 8, color: 'var(--gold-light)', fontWeight: 600 }}>{o.totalAmount || o.grandTotal} ₺</td>
                    <td style={{ padding: 8 }}>{getPaymentMethodBadge(o.paymentMethod)}</td>
                    <td style={{ padding: 8 }}>{getPaymentStatusBadge(o.paymentStatus)}</td>
                    <td style={{ padding: 8 }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(201, 162, 39, 0.15)', color: 'var(--gold-light)' }}>
                        {o.status || o.orderStatus || 'Hazırlanıyor'}
                      </span>
                    </td>
                    <td style={{ padding: 8 }}>
                      <button onClick={() => handleOpenDetail(o.id)} className={styles.seeAllBtn} style={{ padding: '4px 8px', fontSize: 11, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiEye /> Detay
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      Filtreye uygun sipariş bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className={styles.seeAllBtn}>Geri</button>
              <span style={{ color: 'var(--text-primary)', alignSelf: 'center', fontSize: 13 }}>{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className={styles.seeAllBtn}>İleri</button>
            </div>
          )}
        </>
      )}

      {/* DETAIL MODAL */}
      {showDetail && selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, overflowY: 'auto' }}>
          <div className={styles.sectionCard} style={{ width: '90%', maxWidth: 580, margin: '40px auto', background: 'var(--bg-dark)', border: '1px solid var(--border-gold)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ color: 'var(--gold-light)', margin: 0, fontSize: 16 }}>Sipariş Detayı: #{selectedOrder.orderNumber}</h4>
              <button onClick={() => setShowDetail(false)} className={styles.iconBtn} style={{ color: 'var(--text-primary)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18 }}><FiX /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
              
              {/* Müşteri & Genel Bilgiler */}
              <div style={{ background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 6, border: isLight ? '1px solid var(--border-gold)' : '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--text-secondary)' }}>Müşteri: <strong style={{ color: 'var(--text-primary)' }}>{selectedOrder.customerName}</strong></p>
                <p style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--text-secondary)' }}>E-posta: <span style={{ color: 'var(--text-primary)' }}>{selectedOrder.customerEmail || 'Belirtilmemiş'}</span></p>
                <p style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--text-secondary)' }}>Telefon: <span style={{ color: 'var(--text-primary)' }}>{selectedOrder.customerPhone || 'Belirtilmemiş'}</span></p>
                <p style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--text-secondary)' }}>Tarih: <span style={{ color: 'var(--text-primary)' }}>{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('tr-TR') : ''}</span></p>
                <p style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--text-secondary)' }}>Ödeme Yöntemi: {getPaymentMethodBadge(selectedOrder.paymentMethod)} &nbsp; Durum: {getPaymentStatusBadge(selectedOrder.paymentStatus)}</p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Toplam Tutar: <strong style={{ color: 'var(--gold-light)' }}>{selectedOrder.totalAmount || selectedOrder.grandTotal} {selectedOrder.currency || 'TRY'}</strong></p>
              </div>

              {/* Banka Havalesi / Dekont Bölümü (Varsa) */}
              {(String(selectedOrder.paymentMethod).toLowerCase() === 'banktransfer' || selectedOrder.receiptUrl || selectedOrder.bankTransferReceipt) && (
                <div style={{
                  background: 'rgba(201, 162, 39, 0.08)',
                  border: '1.5px solid var(--gold, #c9a227)',
                  borderRadius: 8,
                  padding: 14
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h5 style={{ margin: 0, color: 'var(--gold-light)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FiFileText /> Havale / Dekont Bilgileri
                    </h5>
                    {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                  </div>

                  <p style={{ margin: '0 0 4px 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                    Gönderen: <strong style={{ color: 'var(--text-primary)' }}>{selectedOrder.bankTransferReceipt?.senderName || selectedOrder.senderName || selectedOrder.customerName || 'Belirtilmedi'}</strong>
                  </p>
                  <p style={{ margin: '0 0 8px 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                    Havale Tarihi: <strong style={{ color: 'var(--text-primary)' }}>{selectedOrder.bankTransferReceipt?.transferDate || selectedOrder.transferDate ? formatTurkishDate(selectedOrder.bankTransferReceipt?.transferDate || selectedOrder.transferDate) : formatTurkishDate(selectedOrder.createdAt)}</strong>
                  </p>

                  {selectedOrder.receiptUrl || selectedOrder.bankTransferReceipt?.fileUrl ? (
                    <div style={{ marginTop: 8 }}>
                      <a
                        href={selectedOrder.receiptUrl || selectedOrder.bankTransferReceipt?.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'var(--bg-dark)',
                          border: '1px solid var(--border-gold)',
                          color: 'var(--gold-light)',
                          padding: '6px 12px',
                          borderRadius: 4,
                          fontSize: 12,
                          textDecoration: 'none',
                          fontWeight: 600
                        }}
                      >
                        <FiDownload /> Yüklenen Dekontu Görüntüle / İndir
                      </a>
                    </div>
                  ) : (
                    <p style={{ margin: '6px 0 0 0', fontSize: 11, color: '#f87171' }}>
                      Henüz müşteri tarafından dekont dosyası yüklenmedi.
                    </p>
                  )}

                  {/* Admin Onay / Red Butonları */}
                  {String(selectedOrder.paymentStatus).toLowerCase() !== 'paid' && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 14, borderTop: '1px dashed rgba(201,162,39,0.3)', paddingTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => setShowConfirmModal(true)}
                        style={{
                          flex: 1,
                          background: '#16a34a',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        <FiCheck /> Ödeme Alındı (Onayla)
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowRejectModal(true)}
                        style={{
                          flex: 1,
                          background: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        <FiXCircle /> Ödemeyi Reddet
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Sipariş Edilen Ürünler */}
              <div>
                <h5 style={{ margin: '0 0 8px 0', color: 'var(--gold-light)', fontSize: 14 }}>Ürünler</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} style={{ borderBottom: isLight ? '1px solid var(--border-gold)' : '1px solid rgba(255,255,255,0.05)', paddingBottom: 6, marginBottom: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.productName}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{item.quantity} adet × {item.unitPrice} ₺</span>
                      </div>
                      {(item.customNote || item.note || item.personalizationNote) && (
                        <div style={{ fontSize: 11, color: 'var(--gold-light)', background: 'rgba(201, 162, 39, 0.12)', border: '1px solid rgba(201, 162, 39, 0.25)', borderRadius: 4, padding: '3px 8px', marginTop: 4 }}>
                          ✨ Kişiselleştirme Notu: <strong>{item.customNote || item.note || item.personalizationNote}</strong>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Adres Bilgileri */}
              <div>
                <h5 style={{ margin: '0 0 8px 0', color: 'var(--gold-light)', fontSize: 14 }}>Teslimat Adresi</h5>
                <div style={{ background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 6, border: isLight ? '1px solid var(--border-gold)' : '1px solid rgba(255,255,255,0.05)' }}>
                  {(() => {
                    const parseAddress = (snap) => {
                      if (!snap) return null;
                      if (typeof snap === "object") return snap;
                      try { return JSON.parse(snap); } catch { return null; }
                    };
                    const addr = parseAddress(selectedOrder.shippingAddressSnapshot) || selectedOrder.shippingAddress;
                    if (!addr) return <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 12 }}>Adres bilgisi bulunamadı.</p>;
                    return (
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.5 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{addr.fullName}</strong><br/>
                        {addr.neighborhood || addr.Neighborhood}, {addr.addressLine || addr.AddressLine}<br/>
                        {addr.district || addr.District}/{addr.city || addr.City}
                      </p>
                    );
                  })()}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CONFIRM PAYMENT MODAL */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-gold)', borderRadius: 10, padding: 24, maxWidth: 420, width: '90%', textAlign: 'center' }}>
            <h4 style={{ color: 'var(--gold-light)', margin: '0 0 12px 0' }}>Havale Ödemesini Onayla</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Bu sipariş için banka hesabına <strong>{selectedOrder?.totalAmount || selectedOrder?.grandTotal} ₺</strong> tutarının geçtiğini onaylıyor musunuz?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                disabled={processingAction}
                onClick={() => setShowConfirmModal(false)}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-gold)', color: 'var(--text-primary)', borderRadius: 6, cursor: 'pointer' }}
              >
                İptal
              </button>
              <button
                type="button"
                disabled={processingAction}
                onClick={handleConfirmPayment}
                style={{ padding: '8px 16px', background: '#16a34a', border: 'none', color: '#fff', borderRadius: 6, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {processingAction ? <><FiLoader className={styles.spinner} /> Onaylanıyor...</> : 'Ödemeyi Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT PAYMENT MODAL */}
      {showRejectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ background: 'var(--bg-dark)', border: '1px solid #dc2626', borderRadius: 10, padding: 24, maxWidth: 420, width: '90%', textAlign: 'center' }}>
            <h4 style={{ color: '#f87171', margin: '0 0 12px 0' }}>Ödeme Bildirimini Reddet</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Lütfen müşteriye iletilecek red nedenini giriniz:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Örn: Hesap hareketlerinde ödeme bulunamadı veya eksik tutar..."
              style={{ width: '100%', padding: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-gold)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, marginBottom: 16, outline: 'none', resize: 'none' }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                disabled={processingAction}
                onClick={() => setShowRejectModal(false)}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-gold)', color: 'var(--text-primary)', borderRadius: 6, cursor: 'pointer' }}
              >
                İptal
              </button>
              <button
                type="button"
                disabled={processingAction}
                onClick={handleRejectPayment}
                style={{ padding: '8px 16px', background: '#dc2626', border: 'none', color: '#fff', borderRadius: 6, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {processingAction ? <><FiLoader className={styles.spinner} /> Reddediliyor...</> : 'Bildirimi Reddet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
