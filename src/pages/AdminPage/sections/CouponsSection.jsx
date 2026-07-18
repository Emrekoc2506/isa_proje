import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import * as couponApi from '../../../services/couponApi';
import styles from '../AdminPage.module.css';

export default function CouponsSection() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [isPercentage, setIsPercentage] = useState(true);
  const [expiryDate, setExpiryDate] = useState('');
  const [maxUses, setMaxUses] = useState('');

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const data = await couponApi.getAdminCoupons();
      setCoupons(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      await couponApi.createAdminCoupon({
        code: code.toUpperCase().trim(),
        discountAmount: isPercentage ? 0 : parseFloat(discountAmount) || 0,
        discountPercentage: isPercentage ? parseFloat(discountPercentage) || 0 : 0,
        isPercentage,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        isActive: true
      });
      setShowModal(false);
      fetchCoupons();
    } catch (err) {
      alert("Kupon oluşturulamadı: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Bu kuponu silmek istediğinize emin misiniz?")) {
      try {
        await couponApi.deleteAdminCoupon(id);
        fetchCoupons();
      } catch (err) {
        alert("Kupon silinemedi: " + err.message);
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await couponApi.updateAdminCouponStatus(id, !currentStatus);
      fetchCoupons();
    } catch (err) {
      alert("Kupon durumu güncellenemedi: " + err.message);
    }
  };

  if (loading) return <p>Yükleniyor...</p>;

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Kupon Yönetimi</h3>
        <button onClick={() => { setShowModal(true); setCode(''); setDiscountAmount(''); setDiscountPercentage(''); setIsPercentage(true); setExpiryDate(''); setMaxUses(''); }} className={styles.shopBtn}>
          <FiPlus /> Yeni Kupon Ekle
        </button>
      </div>

      <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-gold)' }}>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Kupon Kodu</th>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>İndirim Türü</th>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Değer</th>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Son Kullanma Tarihi</th>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Max Kullanım</th>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Durum</th>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map(c => (
            <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: 8, color: '#fff', fontWeight: 600 }}>{c.code}</td>
              <td style={{ padding: 8, color: 'var(--text-secondary)' }}>{c.isPercentage ? 'Yüzdelik' : 'Tutar'}</td>
              <td style={{ padding: 8, color: 'var(--gold-light)' }}>{c.isPercentage ? `%${c.discountPercentage}` : `${c.discountAmount} ₺`}</td>
              <td style={{ padding: 8, color: 'var(--text-secondary)' }}>{c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('tr-TR') : 'Sınırsız'}</td>
              <td style={{ padding: 8, color: 'var(--text-secondary)' }}>{c.maxUses || 'Sınırsız'}</td>
              <td style={{ padding: 8 }}>
                <button 
                  onClick={() => handleToggleStatus(c.id, c.isActive)}
                  className={styles.seeAllBtn}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, color: c.isActive ? '#2ecc71' : 'var(--text-muted)' }}
                >
                  {c.isActive ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                  {c.isActive ? 'Aktif' : 'Pasif'}
                </button>
              </td>
              <td style={{ padding: 8 }}>
                <button onClick={() => handleDelete(c.id)} className={styles.seeAllBtn} style={{ color: '#e05594' }}>
                  <FiTrash2 /> Sil
                </button>
              </td>
            </tr>
          ))}
          {coupons.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Henüz indirim kuponu oluşturulmamıştır.</td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className={styles.sectionCard} style={{ width: '90%', maxWidth: 450, background: 'var(--bg-dark)' }}>
            <h4 style={{ color: 'var(--gold-light)', margin: '0 0 20px 0', fontSize: 16 }}>Yeni Kupon Ekle</h4>
            <form onSubmit={handleAdd} className={styles.profileForm}>
              <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr', gap: 12 }}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Kupon Kodu *</label>
                  <input type="text" required value={code} onChange={e => setCode(e.target.value)} className={styles.fieldInput} placeholder="Örn: MISTIK20" style={{ textTransform: 'uppercase' }} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>İndirim Türü</label>
                  <select value={isPercentage ? "percent" : "amount"} onChange={e => setIsPercentage(e.target.value === 'percent')} className={styles.fieldInput} style={{ background: 'rgba(0,0,0,0.3)', color: '#fff' }}>
                    <option value="percent">Yüzdelik İndirim (%)</option>
                    <option value="amount">Sabit Tutar İndirimi (₺)</option>
                  </select>
                </div>
                {isPercentage ? (
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>İndirim Yüzdesi (%) *</label>
                    <input type="number" required value={discountPercentage} onChange={e => setDiscountPercentage(e.target.value)} className={styles.fieldInput} placeholder="Örn: 20" />
                  </div>
                ) : (
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>İndirim Tutarı (₺) *</label>
                    <input type="number" step="0.01" required value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} className={styles.fieldInput} placeholder="Örn: 50" />
                  </div>
                )}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Son Kullanma Tarihi</label>
                  <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className={styles.fieldInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Maksimum Kullanım Limiti</label>
                  <input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} className={styles.fieldInput} placeholder="Sınırsız ise boş bırakın" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="submit" className={styles.shopBtn}>Oluştur</button>
                <button type="button" onClick={() => setShowModal(false)} className={styles.seeAllBtn}>İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
