import { useState, useEffect, useRef } from 'react';
import { FiAlertTriangle, FiX, FiShield, FiLoader, FiAlertCircle } from 'react-icons/fi';
import styles from './AbuseBanModal.module.css';

/**
 * Müşteri veya Sipariş kaynağı için Anti-Abuse Ban uygulama modalı.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Modal açık mı
 * @param {'customer'|'order'} props.sourceType - Müşteri mi sipariş mi
 * @param {Object} props.source - Hedef nesne (customer veya order)
 * @param {boolean} [props.allowAccountBan=true] - Hesap banına izin verilsin mi (guest siparişlerde false)
 * @param {Function} props.onClose - Modalı kapatma callback'i
 * @param {Function} props.onSubmit - Ban payload'ını backend'e gönderen callback
 */
export default function AbuseBanModal({
  open,
  sourceType = 'customer',
  source,
  allowAccountBan = true,
  onClose,
  onSubmit
}) {
  const [reason, setReason] = useState('');
  const [banAccount, setBanAccount] = useState(allowAccountBan);
  const [banPhone, setBanPhone] = useState(true);
  const [banDevices, setBanDevices] = useState(true);
  const [banIp, setBanIp] = useState(true);
  const [ipBanHours, setIpBanHours] = useState(72);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  // Modal açıldığında veya kaynak değiştiğinde state'i sıfırla
  useEffect(() => {
    if (open) {
      setReason('');
      setBanAccount(allowAccountBan);
      setBanPhone(true);
      setBanDevices(true);
      setBanIp(true);
      setIpBanHours(72);
      setError(null);
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }, [open, allowAccountBan, source]);

  // Escape tuşu ile kapatma
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onClose]);

  if (!open || !source) return null;

  const isOrder = sourceType === 'order';
  const modalTitle = isOrder ? 'Sipariş Kaynağını Engelle' : 'Kullanıcıyı Engelle';

  // Gösterilecek bilgiler (Yalnızca mevcut olanlar, tahmini/uydurma IP veya device ASLA gösterilmez)
  const displayName = source.fullName || source.customerName || 'Bilinmiyor';
  const displayEmail = source.email || source.customerEmail || 'Belirtilmedi';
  const displayPhone = source.phoneNumber || source.customerPhone || null;
  const orderNumber = source.orderNumber || (isOrder ? source.id : null);
  const orderNote = source.customerNote || source.orderCustomNote || null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError(null);

    // Double-submit guard
    if (isSubmittingRef.current || loading) return;

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError('Lütfen bir engelleme sebebi belirtin.');
      return;
    }

    if (trimmedReason.length > 1000) {
      setError('Engelleme sebebi en fazla 1000 karakter olabilir.');
      return;
    }

    // Scope kontrolü: En az biri true olmalı
    const effectiveBanAccount = allowAccountBan ? banAccount : false;
    if (!effectiveBanAccount && !banPhone && !banDevices && !banIp) {
      setError('En az bir engelleme yöntemi seçmelisiniz.');
      return;
    }

    const payload = {
      reason: trimmedReason,
      banAccount: effectiveBanAccount,
      banPhone: Boolean(banPhone),
      banDevices: Boolean(banDevices),
      banIp: Boolean(banIp),
      ipBanHours: banIp ? Number(ipBanHours) : 72
    };

    try {
      isSubmittingRef.current = true;
      setLoading(true);
      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error('Ban işlemi başarısız:', err);
      let errMsg = err.message || 'Engelleme işlemi gerçekleştirilemedi.';
      if (err.status === 403) {
        errMsg = 'Bu kullanıcı için engelleme işlemi yapmaya yetkiniz yok.';
      } else if (err.status === 404) {
        errMsg = 'Kullanıcı veya sipariş bulunamadı.';
      }
      setError(errMsg);
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="abuse-ban-modal-title"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <FiShield className={styles.titleIcon} />
            <h3 id="abuse-ban-modal-title" className={styles.title}>
              {modalTitle}
            </h3>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={loading}
            aria-label="Kapat"
          >
            <FiX />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className={styles.body}>
          {/* Hedef Bilgi Özeti */}
          <div className={styles.infoBox}>
            {orderNumber && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Sipariş No:</span>
                <span className={styles.infoValue}>#{orderNumber}</span>
              </div>
            )}
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Müşteri / Alıcı:</span>
              <span className={styles.infoValue}>{displayName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>E-posta:</span>
              <span className={styles.infoValue}>{displayEmail}</span>
            </div>
            {displayPhone && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Telefon:</span>
                <span className={styles.infoValue}>{displayPhone}</span>
              </div>
            )}
            {orderNote && (
              <div className={styles.orderNoteBox}>
                <strong>Sipariş Notu:</strong> {orderNote}
              </div>
            )}
          </div>

          {/* Sebep Alanı */}
          <div className={styles.fieldGroup}>
            <label htmlFor="abuse-reason" className={styles.fieldLabel}>
              <span>Engelleme Sebebi *</span>
              <span className={styles.charCount}>{reason.length}/1000</span>
            </label>
            <textarea
              id="abuse-reason"
              rows={3}
              className={styles.textarea}
              placeholder="Sipariş notlarında hakaret ve tekrarlanan kötüye kullanım"
              maxLength={1000}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              disabled={loading}
            />
          </div>

          {/* Ban Kapsamları (Scopes) */}
          <div className={styles.scopesContainer}>
            <h4 className={styles.scopesTitle}>Engelleme Kapsamı</h4>

            {/* Hesabı Engelle */}
            <label className={`${styles.checkboxLabel} ${!allowAccountBan ? styles.checkboxLabelDisabled : ''}`}>
              <input
                type="checkbox"
                id="scope-ban-account"
                className={styles.checkbox}
                checked={allowAccountBan ? banAccount : false}
                disabled={!allowAccountBan || loading}
                onChange={(e) => {
                  setBanAccount(e.target.checked);
                  if (error) setError(null);
                }}
              />
              <div>
                <span>Hesabı Engelle</span>
                {!allowAccountBan && (
                  <span className={styles.disabledNote}>
                    Bu sipariş misafir kullanıcıya ait olduğu için hesap engeli uygulanamaz.
                  </span>
                )}
              </div>
            </label>

            {/* Telefonu Engelle */}
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                id="scope-ban-phone"
                className={styles.checkbox}
                checked={banPhone}
                disabled={loading}
                onChange={(e) => {
                  setBanPhone(e.target.checked);
                  if (error) setError(null);
                }}
              />
              <span>Telefon Numarasını Engelle</span>
            </label>

            {/* Bilinen Cihazları Engelle */}
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                id="scope-ban-devices"
                className={styles.checkbox}
                checked={banDevices}
                disabled={loading}
                onChange={(e) => {
                  setBanDevices(e.target.checked);
                  if (error) setError(null);
                }}
              />
              <span>Bilinen Cihazları Engelle</span>
            </label>

            {/* IP Adresini Geçici Engelle */}
            <div>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  id="scope-ban-ip"
                  className={styles.checkbox}
                  checked={banIp}
                  disabled={loading}
                  onChange={(e) => {
                    setBanIp(e.target.checked);
                    if (error) setError(null);
                  }}
                />
                <span>IP Adresini Geçici Engelle</span>
              </label>

              {banIp && (
                <div className={styles.ipHoursWrap}>
                  <label htmlFor="ip-ban-hours" className={styles.selectLabel}>
                    IP Engel Süresi:
                  </label>
                  <select
                    id="ip-ban-hours"
                    className={styles.select}
                    value={ipBanHours}
                    disabled={loading}
                    onChange={(e) => setIpBanHours(Number(e.target.value))}
                  >
                    <option value={24}>24 saat</option>
                    <option value={72}>72 saat (Önerilen)</option>
                    <option value={168}>7 gün</option>
                    <option value={720}>30 gün</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Bilgilendirme Uyarısı */}
          <div className={styles.summaryAlert}>
            <FiAlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Bu işlem kullanıcının mevcut hesabını kapatabilir ve seçilen telefon/cihaz/IP bilgileriyle yeni işlem yapmasını engelleyebilir.
            </span>
          </div>

          {/* Hata Alanı */}
          {error && (
            <div className={styles.errorAlert}>
              <FiAlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Footer */}
          <div className={styles.footer}>
            <button
              type="button"
              id="btn-abuse-modal-cancel"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              id="btn-abuse-modal-submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <>
                  <FiLoader className={styles.spinner} />
                  <span>Engelleniyor...</span>
                </>
              ) : (
                <span>🚫 {isOrder ? 'Engellemeyi Uygula' : 'Kullanıcıyı Engelle'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
