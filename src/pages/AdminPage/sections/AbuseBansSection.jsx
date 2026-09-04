import { useState, useEffect, useCallback } from 'react';
import { FiShield, FiAlertTriangle, FiCheckCircle, FiClock, FiXCircle, FiRefreshCw, FiLoader } from 'react-icons/fi';
import * as abuseApi from '../../../services/abuseApi';
import { formatTurkishDate } from '../../../utils/dateUtils';
import styles from '../AdminPage.module.css';
import { useTheme } from '../../../context/ThemeContext';

export default function AbuseBansSection() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [activeFilter, setActiveFilter] = useState('active'); // 'active' | 'all'
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'Account' | 'Phone' | 'Device' | 'Ip'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Revoke Modal State
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);

  const fetchBans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        pageSize: 20
      };
      if (activeFilter === 'active') {
        params.activeOnly = true;
      }
      if (typeFilter !== 'ALL') {
        params.type = typeFilter;
      }

      const data = await abuseApi.getAbuseBans(params);
      if (data && data.items) {
        setBans(data.items);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setBans(data);
        setTotalPages(1);
      } else {
        setBans([]);
      }
    } catch (err) {
      console.error('Ban kayıtları yüklenemedi:', err);
      setError('Engelleme listesi yüklenirken bir sorun oluştu.');
      setBans([]);
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter, typeFilter]);

  useEffect(() => {
    fetchBans();
  }, [fetchBans]);

  const handleRevokeConfirm = async () => {
    if (!revokeTarget?.id || revoking) return;
    try {
      setRevoking(true);
      await abuseApi.revokeAbuseBan(revokeTarget.id);
      setRevokeTarget(null);
      await fetchBans();
    } catch (err) {
      alert('Engel kaldırılırken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setRevoking(false);
    }
  };

  const translateBanType = (type) => {
    const t = String(type || '').toLowerCase();
    switch (t) {
      case 'account': return 'Hesap';
      case 'phone': return 'Telefon';
      case 'device': return 'Cihaz';
      case 'ip': return 'IP Adresi';
      default: return type || 'Bilinmiyor';
    }
  };

  const getBanStatusBadge = (ban) => {
    if (ban.isRevoked || ban.status === 'Revoked' || ban.revokedAt) {
      return (
        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(107, 114, 128, 0.18)', color: '#9ca3af', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <FiCheckCircle size={11} /> Kaldırıldı
        </span>
      );
    }

    if (ban.isExpired || (ban.expiresAt && new Date(ban.expiresAt) < new Date())) {
      return (
        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <FiClock size={11} /> Süresi Doldu
        </span>
      );
    }

    return (
      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(239, 68, 68, 0.18)', color: '#f87171', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <FiXCircle size={11} /> Aktif
      </span>
    );
  };

  const isBanActive = (ban) => {
    if (ban.isRevoked || ban.status === 'Revoked' || ban.revokedAt) return false;
    if (ban.isExpired || (ban.expiresAt && new Date(ban.expiresAt) < new Date())) return false;
    return true;
  };

  return (
    <div className={styles.sectionCard}>
      {/* Üst Bar / Filtreler */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiShield style={{ color: '#e05594', fontSize: 22 }} />
          <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Güvenlik & Engellemeler (Anti-Abuse)</h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Durum Filtresi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Durum:</span>
            <select
              id="abuse-filter-status"
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '5px 10px',
                background: 'var(--bg-dark)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-gold)',
                borderRadius: 6,
                fontSize: 12,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="active">Yalnızca Aktif</option>
              <option value="all">Tümü (Geçmiş Dahil)</option>
            </select>
          </div>

          {/* Tür Filtresi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Tür:</span>
            <select
              id="abuse-filter-type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '5px 10px',
                background: 'var(--bg-dark)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-gold)',
                borderRadius: 6,
                fontSize: 12,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Tüm Türler</option>
              <option value="Account">Hesap</option>
              <option value="Phone">Telefon</option>
              <option value="Device">Cihaz</option>
              <option value="Ip">IP Adresi</option>
            </select>
          </div>

          <button
            type="button"
            onClick={fetchBans}
            className={styles.seeAllBtn}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', fontSize: 12 }}
            title="Listeyi Yenile"
          >
            <FiRefreshCw size={13} className={loading ? styles.spinner : ''} />
            Yenile
          </button>
        </div>
      </div>

      {/* Tablo */}
      {loading ? (
        <p style={{ color: 'var(--text-secondary)', padding: 20 }}>Engelleme kayıtları yükleniyor...</p>
      ) : error ? (
        <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, color: '#f87171', fontSize: 13 }}>
          {error}
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
            <table className={styles.table} style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse', marginTop: 8 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-gold)' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Tür</th>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Kullanıcı / Hedef</th>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Sebep</th>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Başlangıç</th>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Bitiş</th>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Durum</th>
                  <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {bans.map((b) => {
                  const active = isBanActive(b);
                  // Raw security identifier (IP, hash) asla gösterilmez; kullanıcı adı veya masked/type kullanılır
                  const targetLabel = b.userFullName || b.userName || b.customerName || (b.userId ? `Kullanıcı #${String(b.userId).substring(0, 8)}` : translateBanType(b.type));

                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border-gold)' }}>
                      <td style={{ padding: 10, fontWeight: 600, color: 'var(--text-primary)' }}>
                        <span style={{
                          background: 'rgba(224, 85, 148, 0.12)',
                          color: '#e05594',
                          border: '1px solid rgba(224, 85, 148, 0.3)',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12
                        }}>
                          {translateBanType(b.type)}
                        </span>
                      </td>
                      <td style={{ padding: 10, color: 'var(--text-primary)', fontSize: 13 }}>
                        {targetLabel}
                      </td>
                      <td style={{ padding: 10, color: 'var(--text-secondary)', fontSize: 12, maxWidth: 220, wordBreak: 'break-word' }}>
                        {b.reason || 'Sebep belirtilmedi'}
                      </td>
                      <td style={{ padding: 10, color: 'var(--text-secondary)', fontSize: 12 }}>
                        {b.createdAt ? formatTurkishDate(b.createdAt) : '-'}
                      </td>
                      <td style={{ padding: 10, color: 'var(--text-secondary)', fontSize: 12 }}>
                        {b.expiresAt ? formatTurkishDate(b.expiresAt) : 'Süresiz'}
                      </td>
                      <td style={{ padding: 10 }}>
                        {getBanStatusBadge(b)}
                      </td>
                      <td style={{ padding: 10 }}>
                        {active ? (
                          <button
                            type="button"
                            onClick={() => setRevokeTarget(b)}
                            title="Engeli Kaldır"
                            style={{
                              background: 'rgba(46, 204, 113, 0.12)',
                              border: '1px solid rgba(46, 204, 113, 0.35)',
                              color: '#2ecc71',
                              borderRadius: 6,
                              padding: '5px 10px',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(46, 204, 113, 0.25)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(46, 204, 113, 0.12)';
                            }}
                          >
                            Engeli Kaldır
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {bans.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                      Kayıtlı güvenlik engeli bulunmamaktadır.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Sayfalama */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className={styles.seeAllBtn}
              >
                Geri
              </button>
              <span style={{ color: 'var(--text-primary)', alignSelf: 'center', fontSize: 13 }}>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className={styles.seeAllBtn}
              >
                İleri
              </button>
            </div>
          )}
        </>
      )}

      {/* REVOKE ONAY MODALI */}
      {revokeTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1200
        }}>
          <div style={{
            background: 'var(--bg-dark)',
            border: '1px solid var(--border-gold)',
            borderRadius: 10,
            padding: 24,
            maxWidth: 420,
            width: '90%',
            textAlign: 'center'
          }}>
            <FiAlertTriangle size={32} style={{ color: '#f39c12', marginBottom: 12 }} />
            <h4 style={{ color: 'var(--gold-light)', margin: '0 0 10px 0' }}>Engeli Kaldır</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              Bu güvenlik engelini ({translateBanType(revokeTarget.type)}) kaldırmak istediğinize emin misiniz?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                disabled={revoking}
                onClick={() => setRevokeTarget(null)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid var(--border-gold)',
                  color: 'var(--text-primary)',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                İptal
              </button>
              <button
                type="button"
                id="btn-confirm-revoke-ban"
                disabled={revoking}
                onClick={handleRevokeConfirm}
                style={{
                  padding: '8px 16px',
                  background: '#16a34a',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 6,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {revoking ? (
                  <>
                    <FiLoader className={styles.spinner} /> Kaldırılıyor...
                  </>
                ) : (
                  'Evet, Engeli Kaldır'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
