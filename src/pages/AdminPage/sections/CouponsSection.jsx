import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiTrash2, FiToggleLeft, FiToggleRight,
  FiX, FiTag, FiSliders, FiCalendar, FiHash, FiPercent,
  FiDollarSign, FiCheck
} from 'react-icons/fi';
import * as couponApi from '../../../services/couponApi';
import { useTheme } from '../../../context/ThemeContext';
import styles from '../AdminPage.module.css';

function FormField({ label, type = "text", value, onChange, placeholder, required = false, isLight, min, max, step, icon: Icon, children }) {
  const [focused, setFocused] = useState(false);
  const inputId = `input_${label.replace(/\s+/g, '_').toLowerCase()}`;

  const labelStyle = {
    display: 'block',
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 700,
    color: isLight ? '#0c1929' : 'var(--gold-light, #e2c267)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  };

  const commonStyle = {
    width: '100%',
    background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.6)',
    color: isLight ? '#0c1929' : '#ffffff',
    border: focused
      ? '1px solid #c9a227'
      : (isLight ? '1px solid rgba(201, 162, 39, 0.4)' : '1px solid rgba(251, 191, 36, 0.2)'),
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 14,
    fontWeight: 500,
    outline: 'none',
    boxShadow: focused ? '0 0 0 3px rgba(201,162,39,0.2)' : 'none',
    transition: 'all 0.2s ease-in-out',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={inputId} style={labelStyle}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children ? (
        children(inputId, commonStyle, setFocused)
      ) : (
        <div style={{ position: 'relative' }}>
          {Icon && (
            <Icon
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: isLight ? '#64748b' : 'var(--gold-light)',
                pointerEvents: 'none'
              }}
            />
          )}
          <input
            id={inputId}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            min={min}
            max={max}
            step={step}
            style={{
              ...commonStyle,
              paddingLeft: Icon ? 38 : 14
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>
      )}
    </div>
  );
}

export default function CouponsSection() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
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

  const openCreateModal = () => {
    setCode('');
    setDiscountAmount('');
    setDiscountPercentage('');
    setIsPercentage(true);
    setExpiryDate('');
    setMaxUses('');
    setModalStep(1);
    setShowModal(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      alert('Lütfen kupon kodunu yazın.');
      return;
    }
    if (isPercentage && !discountPercentage) {
      alert('Lütfen indirim yüzdesini yazın.');
      return;
    }
    if (!isPercentage && !discountAmount) {
      alert('Lütfen indirim tutarını yazın.');
      return;
    }

    setSaving(true);
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
    } finally {
      setSaving(false);
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

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(201,162,39,0.2)', borderTopColor: 'var(--gold-light)', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div>
      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ color: isLight ? '#0c1929' : 'var(--gold-light)', fontSize: 20, fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Kupon Yönetimi
          </h3>
          <p style={{ color: isLight ? '#475569' : 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0 0' }}>
            {coupons.length} aktif / pasif kupon • Müşterilerinizin kullanabileceği özel indirim kodları
          </p>
        </div>
        <button
          onClick={openCreateModal}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #c9a227, #967412)', color: '#ffffff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 15px rgba(201,162,39,0.35)' }}
        >
          <FiPlus size={16} style={{ color: '#ffffff' }} />
          <span style={{ color: '#ffffff' }}>Yeni Kupon Ekle</span>
        </button>
      </div>

      {/* ── COUPONS TABLE ── */}
      <div className={styles.sectionCard} style={{ overflowX: 'auto', padding: 0 }}>
        <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid var(--border-gold)', background: isLight ? '#f1f5f9' : 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '14px 16px', color: isLight ? '#0c1929' : 'var(--gold-light)', fontWeight: 700 }}>Kupon Kodu</th>
              <th style={{ padding: '14px 16px', color: isLight ? '#0c1929' : 'var(--gold-light)', fontWeight: 700 }}>İndirim Türü</th>
              <th style={{ padding: '14px 16px', color: isLight ? '#0c1929' : 'var(--gold-light)', fontWeight: 700 }}>Değer</th>
              <th style={{ padding: '14px 16px', color: isLight ? '#0c1929' : 'var(--gold-light)', fontWeight: 700 }}>Son Kullanma</th>
              <th style={{ padding: '14px 16px', color: isLight ? '#0c1929' : 'var(--gold-light)', fontWeight: 700 }}>Max Kullanım</th>
              <th style={{ padding: '14px 16px', color: isLight ? '#0c1929' : 'var(--gold-light)', fontWeight: 700 }}>Durum</th>
              <th style={{ padding: '14px 16px', color: isLight ? '#0c1929' : 'var(--gold-light)', fontWeight: 700 }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.id} style={{ borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px', color: isLight ? '#0c1929' : '#fff', fontWeight: 700 }}>{c.code}</td>
                <td style={{ padding: '12px 16px', color: isLight ? '#334155' : 'var(--text-secondary)' }}>{c.isPercentage ? 'Yüzdelik' : 'Tutar'}</td>
                <td style={{ padding: '12px 16px', color: isLight ? '#0284c7' : 'var(--gold-light)', fontWeight: 700 }}>{c.isPercentage ? `%${c.discountPercentage}` : `${c.discountAmount} ₺`}</td>
                <td style={{ padding: '12px 16px', color: isLight ? '#475569' : 'var(--text-secondary)' }}>{c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('tr-TR') : 'Sınırsız'}</td>
                <td style={{ padding: '12px 16px', color: isLight ? '#475569' : 'var(--text-secondary)' }}>{c.maxUses || 'Sınırsız'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button 
                    onClick={() => handleToggleStatus(c.id, c.isActive)}
                    className={styles.seeAllBtn}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: c.isActive ? '#16a34a' : '#64748b', fontWeight: 600, padding: '4px 8px', borderRadius: 6, background: c.isActive ? 'rgba(22,163,74,0.1)' : 'rgba(100,116,139,0.1)' }}
                  >
                    {c.isActive ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                    {c.isActive ? 'Aktif' : 'Pasif'}
                  </button>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => handleDelete(c.id)} className={styles.seeAllBtn} style={{ color: '#dc2626', background: 'rgba(220,38,38,0.1)', padding: '6px 12px', borderRadius: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiTrash2 size={14} /> Sil
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: isLight ? '#64748b' : 'var(--text-muted)' }}>Henüz indirim kuponu oluşturulmamıştır.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          CREATE COUPON WIZARD MODAL (BILLBOARD TEMASINA UYUMLU)
      ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 2000, overflowY: 'auto', backdropFilter: 'blur(10px)', padding: '24px 16px' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                width: '100%',
                maxWidth: 620,
                margin: '24px auto',
                background: isLight ? '#ffffff' : 'var(--bg-dark, #12091F)',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(201,162,39,0.25)',
                borderRadius: 18,
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                overflow: 'hidden'
              }}
            >
              {/* ─── HEADER (GECE/GÜNDÜZ HAREKETLİ ARKA PLAN) ─── */}
              <div
                style={{
                  background: isLight
                    ? 'linear-gradient(180deg, #4bbfe8 0%, #62cff0 40%, #7dd9f5 100%)'
                    : 'linear-gradient(180deg, rgba(18, 9, 31, 0.97), rgba(10, 5, 18, 0.97))',
                  padding: '28px 32px 24px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* GECE MODU ANİMASYONLARI */}
                {!isLight && (
                  <>
                    <div className={styles.sidebarMoon} style={{ top: 12, right: 55, transform: 'scale(0.75)' }}>
                      <div className={styles.sidebarMoonHole} style={{ width: 6, height: 6, top: 10, left: 5 }} />
                      <div className={styles.sidebarMoonHole} style={{ width: 4, height: 4, top: 18, left: 14 }} />
                    </div>
                    {[...Array(10)].map((_, i) => (
                      <svg
                        key={i}
                        className={styles.sidebarStar}
                        viewBox="0 0 20 20"
                        style={{
                          top: `${Math.floor((i * 37 + 11) % 85)}%`,
                          left: `${Math.floor((i * 53 + 7) % 85)}%`,
                          width: `${7 + (i % 4) * 2}px`,
                          animationDelay: `${(i * 0.35).toFixed(2)}s`,
                          animationDuration: `${2 + (i % 3) * 0.5}s`
                        }}
                      >
                        <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
                      </svg>
                    ))}
                  </>
                )}

                {/* GÜNDÜZ MODU ANİMASYONLARI */}
                {isLight && (
                  <>
                    <div className={styles.sidebarSun} style={{ top: 8, right: 45, width: 50, height: 50 }} />
                    <div className={styles.sidebarCloudShape} style={{ top: '15%', left: '10%', transform: 'scale(0.5)' }}>
                      <div className={styles.sidebarCloudBase} />
                      <div className={styles.sidebarCloudBump1} />
                      <div className={styles.sidebarCloudBump2} />
                    </div>
                  </>
                )}

                {/* KAPAT BUTONU (X) */}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: isLight ? '#0c1929' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  <FiX size={18} />
                </button>

                {/* BAŞLIK & ALT BAŞLIK */}
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: isLight ? 'rgba(255,255,255,0.65)' : 'rgba(201,162,39,0.15)', border: isLight ? '1px solid rgba(255,255,255,0.9)' : '1px solid rgba(201,162,39,0.3)', marginBottom: 8 }}>
                    <FiTag size={13} style={{ color: isLight ? '#0c1929' : 'var(--gold-light)' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isLight ? '#0c1929' : 'var(--gold-light)' }}>İNDİRİM KUPONU</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: isLight ? '#0c1929' : '#ffffff', fontFamily: 'var(--font-heading)' }}>
                    YENİ KUPON EKLE
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, color: isLight ? '#1e293b' : 'var(--text-secondary)', opacity: 0.9 }}>
                    Müşterilerinizin alışverişlerinde kullanabileceği indirim kuponunu tanımlayın
                  </p>
                </div>
              </div>

              {/* ─── ADIM SEKMELERİ (WIZARD STEPS) ─── */}
              <div style={{ display: 'flex', borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)', background: isLight ? '#f8fafc' : 'rgba(0,0,0,0.2)' }}>
                <button
                  type="button"
                  onClick={() => setModalStep(1)}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: modalStep === 1 ? '3px solid #c9a227' : '3px solid transparent',
                    color: modalStep === 1 ? (isLight ? '#0c1929' : 'var(--gold-light)') : (isLight ? '#64748b' : 'var(--text-secondary)'),
                    fontWeight: modalStep === 1 ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: modalStep === 1 ? 'linear-gradient(135deg, #c9a227, #967412)' : (isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                    1
                  </div>
                  <span>Kupon Bilgileri & Oran</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalStep(2)}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: modalStep === 2 ? '3px solid #c9a227' : '3px solid transparent',
                    color: modalStep === 2 ? (isLight ? '#0c1929' : 'var(--gold-light)') : (isLight ? '#64748b' : 'var(--text-secondary)'),
                    fontWeight: modalStep === 2 ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: modalStep === 2 ? 'linear-gradient(135deg, #c9a227, #967412)' : (isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                    2
                  </div>
                  <span>Kullanım Şartları & Limitler</span>
                </button>
              </div>

              {/* ─── FORM İÇERİĞİ ─── */}
              <form onSubmit={handleAdd}>
                <div style={{ padding: '24px 28px' }}>
                  {modalStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FormField
                        label="Kupon Kodu"
                        placeholder="ÖRN: MISTIK20"
                        required
                        isLight={isLight}
                        icon={FiTag}
                      >
                        {(inputId, commonStyle, setFocused) => (
                          <input
                            id={inputId}
                            type="text"
                            required
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase())}
                            placeholder="ÖRN: MISTIK20"
                            style={{
                              ...commonStyle,
                              paddingLeft: 38,
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              fontWeight: 700
                            }}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                          />
                        )}
                      </FormField>

                      <FormField
                        label="İndirim Türü"
                        isLight={isLight}
                        icon={isPercentage ? FiPercent : FiDollarSign}
                      >
                        {(inputId, commonStyle, setFocused) => (
                          <select
                            id={inputId}
                            value={isPercentage ? "percent" : "amount"}
                            onChange={e => setIsPercentage(e.target.value === 'percent')}
                            style={{
                              ...commonStyle,
                              paddingLeft: 38,
                              cursor: 'pointer'
                            }}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                          >
                            <option value="percent" style={{ color: '#0c1929', background: '#ffffff' }}>Yüzdelik İndirim (%)</option>
                            <option value="amount" style={{ color: '#0c1929', background: '#ffffff' }}>Sabit Tutar İndirimi (₺)</option>
                          </select>
                        )}
                      </FormField>

                      {isPercentage ? (
                        <FormField
                          label="İndirim Yüzdesi (%)"
                          type="number"
                          value={discountPercentage}
                          onChange={e => setDiscountPercentage(e.target.value)}
                          placeholder="Örn: 20"
                          required
                          min="1"
                          max="100"
                          isLight={isLight}
                          icon={FiPercent}
                        />
                      ) : (
                        <FormField
                          label="İndirim Tutarı (₺)"
                          type="number"
                          step="0.01"
                          value={discountAmount}
                          onChange={e => setDiscountAmount(e.target.value)}
                          placeholder="Örn: 50"
                          required
                          min="1"
                          isLight={isLight}
                          icon={FiDollarSign}
                        />
                      )}
                    </motion.div>
                  )}

                  {modalStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FormField
                        label="Son Kullanma Tarihi"
                        type="date"
                        value={expiryDate}
                        onChange={e => setExpiryDate(e.target.value)}
                        isLight={isLight}
                        icon={FiCalendar}
                      />

                      <FormField
                        label="Maksimum Kullanım Limiti"
                        type="number"
                        min="1"
                        value={maxUses}
                        onChange={e => setMaxUses(e.target.value)}
                        placeholder="Sınırsız kullanım için boş bırakın"
                        isLight={isLight}
                        icon={FiHash}
                      />

                      <div style={{ padding: '14px 16px', borderRadius: 10, background: isLight ? '#f1f5f9' : 'rgba(251,191,36,0.08)', border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(251,191,36,0.2)', marginTop: 8 }}>
                        <p style={{ margin: 0, fontSize: 12, color: isLight ? '#334155' : 'var(--gold-light)', lineHeight: 1.5 }}>
                          💡 <strong>Bilgi:</strong> Kupon oluşturulduktan sonra aktiflik durumunu tablodaki düğmeden dilediğiniz zaman değiştirebilirsiniz.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* ─── FOOTER (BUTONLAR) ─── */}
                <div style={{ padding: '18px 28px', background: isLight ? '#f8fafc' : 'rgba(0,0,0,0.3)', borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 10,
                      background: 'none',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.2)',
                      color: isLight ? '#475569' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    İptal
                  </button>

                  <div style={{ display: 'flex', gap: 12 }}>
                    {modalStep === 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!code.trim()) { alert('Lütfen kupon kodunu yazın.'); return; }
                          if (isPercentage && !discountPercentage) { alert('Lütfen indirim yüzdesini yazın.'); return; }
                          if (!isPercentage && !discountAmount) { alert('Lütfen indirim tutarını yazın.'); return; }
                          setModalStep(2);
                        }}
                        style={{
                          padding: '10px 24px',
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, #c9a227, #967412)',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                          boxShadow: '0 4px 15px rgba(201,162,39,0.35)'
                        }}
                      >
                        İleri
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setModalStep(1)}
                          style={{
                            padding: '10px 18px',
                            borderRadius: 10,
                            background: 'none',
                            border: isLight ? '1px solid #cbd5e1' : '1px solid var(--border-gold)',
                            color: isLight ? '#0c1929' : 'var(--gold-light)',
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: 'pointer'
                          }}
                        >
                          Geri
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          style={{
                            padding: '10px 24px',
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #c9a227, #967412)',
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: saving ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 15px rgba(201,162,39,0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <FiCheck size={16} />
                          {saving ? 'Kaydediliyor...' : 'Kuponu Oluştur'}
                        </button>
                      </>
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
