import styles from './CheckoutPage.module.css'; // Re-use styling
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiPackage, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import * as orderApi from '../../services/orderApi';
import logoImage from '../../assets/images/logo.png';

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderNumber || !email) return;

    setLoading(true);
    setErrorMsg('');
    setOrder(null);

    try {
      const data = await orderApi.trackGuestOrder({ orderNumber: orderNumber.trim(), email: email.trim() });
      setOrder(data);
    } catch (err) {
      setErrorMsg(err.message || 'Sipariş bulunamadı. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.emptyContainer} style={{ minHeight: '100vh', padding: '120px 20px' }}>
      <div className={styles.wrapper} style={{ maxWidth: 600, width: '100%' }}>
        <a href="/" className={styles.logoLink} style={{ marginBottom: 20 }}>
          <img src={logoImage} alt="mysticvelora" className={styles.logoImg} />
          <span className={styles.brandName}>mysticvelora</span>
        </a>

        <motion.div 
          className={styles.card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', background: 'rgba(20, 10, 35, 0.75)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: 32, boxSizing: 'border-box' }}
        >
          <div className={styles.content} style={{ width: '100%' }}>
            <FiPackage className={styles.spinner} style={{ animation: 'none', fontSize: 56 }} />
            <h2 className={styles.title}>Sipariş Takibi</h2>
            <p className={styles.sub}>Misafir siparişinizin güncel durumunu sorgulamak için bilgilerinizi girin.</p>

            {errorMsg && (
              <div className={styles.warningsBox} style={{ borderColor: '#e05594', color: '#e05594', width: '100%', boxSizing: 'border-box', marginBottom: 16 }}>
                <FiAlertTriangle /> <span>{errorMsg}</span>
              </div>
            )}

            {!order ? (
              <form onSubmit={handleTrack} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input 
                    type="text" 
                    required 
                    value={orderNumber}
                    onChange={e => setOrderNumber(e.target.value)}
                    placeholder="Sipariş Numarası (Örn: ISH-2026...)"
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-gold)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-light)',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ position: 'relative', width: '100%' }}>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="E-posta Adresiniz"
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-gold)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-light)',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className={styles.btn}
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8 }}
                >
                  {loading && <FiLoader className={styles.spinner} style={{ margin: 0, fontSize: 16 }} />}
                  Sorgula
                </button>
              </form>
            ) : (
              // Display Tracked Order Details
              <div style={{ width: '100%', textAlign: 'left' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20 }}>
                  <h4 style={{ margin: '0 0 10px 0', color: 'var(--gold-light)' }}>Sipariş: #{order.orderNumber}</h4>
                  <p style={{ margin: '0 0 6px 0', color: 'var(--text-secondary)', fontSize: 13 }}>Tarih: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('tr-TR') : ''}</p>
                  <p style={{ margin: '0 0 6px 0', color: 'var(--text-secondary)', fontSize: 13 }}>Toplam Tutar: <strong>{order.totalAmount || order.grandTotal} {order.currency || 'TRY'}</strong></p>
                  <p style={{ margin: '0 0 6px 0', color: 'var(--text-secondary)', fontSize: 13 }}>Kargo Yöntemi: {order.shippingMethodCode}</p>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>Sipariş Durumu: <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{order.statusText || 'Sipariş Verildi'}</span></p>
                  <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>Ödeme Durumu: <span style={{ color: order.paymentStatus === 'Paid' ? '#2ecc71' : '#f1c40f', fontWeight: 600 }}>{order.paymentStatus === 'Paid' ? 'Ödendi' : 'Bekliyor / Başarısız'}</span></p>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <h5 style={{ margin: '0 0 8px 0', color: 'var(--text-light)', fontSize: 14 }}>Ürünler</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(order.items || []).map((item, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{item.productName}</span>
                        <span style={{ color: 'var(--text-light)' }}>{item.quantity} adet × {item.unitPrice} ₺</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={() => setOrder(null)} className={styles.btnOutline} style={{ width: '100%' }}>
                  Yeni Sorgulama Yap
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
