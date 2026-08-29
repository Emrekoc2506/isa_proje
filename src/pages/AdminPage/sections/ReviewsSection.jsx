import { useState, useEffect, useCallback } from 'react';
import { FiCheck, FiX, FiTrash2, FiStar, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import * as reviewApi from '../../../services/reviewApi';
import { formatTurkishDate } from '../../../utils/dateUtils';
import styles from '../AdminPage.module.css';

const STATUS_MAP = {
  pending: { label: 'Bekliyor', color: '#f1c40f' },
  approved: { label: 'Onaylı', color: '#2ecc71' },
  rejected: { label: 'Reddedildi', color: '#e05594' },
};

function StarRating({ rating }) {
  return (
    <span style={{ color: 'var(--gold)', display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <FiStar key={i} size={14} fill={i < rating ? 'var(--gold)' : 'none'} />
      ))}
    </span>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [processing, setProcessing] = useState(new Set());

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reviewApi.getPendingReviews();
      setReviews(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setError(err.message);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApprove = async (id) => {
    setProcessing(prev => new Set(prev).add(id));
    try {
      await reviewApi.approveReview(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: true, status: 'approved' } : r));
    } catch (err) {
      alert("Onaylanamadı: " + err.message);
    } finally {
      setProcessing(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const handleReject = async (id) => {
    setProcessing(prev => new Set(prev).add(id));
    try {
      await reviewApi.rejectReview(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: false, status: 'rejected' } : r));
    } catch (err) {
      alert("Reddedilemedi: " + err.message);
    } finally {
      setProcessing(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
    setProcessing(prev => new Set(prev).add(id));
    try {
      await reviewApi.deleteAdminReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert("Silinemedi: " + err.message);
    } finally {
      setProcessing(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const filteredReviews = filter === 'all'
    ? reviews
    : reviews.filter(r => (r.status || (r.isApproved ? 'approved' : r.isApproved === false ? 'rejected' : 'pending')) === filter);

  if (loading) return <p className={styles.emptyText}>Yorumlar yükleniyor...</p>;

  return (
    <div>
      <div className={styles.actionHeader}>
        <h3 style={{ color: 'var(--gold-light)', margin: 0, fontFamily: 'var(--font-heading)' }}>
          Yorum Moderasyonu
        </h3>
        <button onClick={fetchReviews} className={styles.seeAllBtn}>
          <FiRefreshCw /> Yenile
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(224,85,148,0.1)', border: '1px solid rgba(224,85,148,0.3)', borderRadius: 8, padding: '12px 16px', color: '#e05594', marginBottom: 16 }}>
          <FiAlertCircle />
          <span style={{ fontSize: 13 }}>{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'all', label: 'Tümü' },
          { key: 'pending', label: 'Bekleyenler' },
          { key: 'approved', label: 'Onaylı' },
          { key: 'rejected', label: 'Reddedilen' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={styles.seeAllBtn}
            style={{
              background: filter === tab.key ? 'rgba(201,162,39,0.15)' : undefined,
              borderColor: filter === tab.key ? 'var(--border-gold)' : undefined,
              color: filter === tab.key ? 'var(--gold-light)' : undefined,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Ürün</th>
              <th>Kullanıcı</th>
              <th>Puan</th>
              <th>Yorum</th>
              <th>Tarih</th>
              <th>Durum</th>
              <th style={{ textAlign: 'center' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.map(r => {
              const isProcessing = processing.has(r.id);
              const statusKey = r.status || (r.isApproved ? 'approved' : r.isApproved === false ? 'rejected' : 'pending');
              const status = STATUS_MAP[statusKey] || STATUS_MAP.pending;

              return (
                <tr key={r.id}>
                  <td>
                    <div className={styles.tableProdName}>{r.productName || '—'}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{r.userName || 'Anonim'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <StarRating rating={r.rating || 0} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.rating}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: 300 }}>
                      {r.title && <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, marginBottom: 2 }}>{r.title}</div>}
                      <div style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>{r.comment || r.body || '—'}</div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {formatTurkishDate(r.createdAt)}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      background: `${status.color}15`,
                      color: status.color,
                      border: `1px solid ${status.color}30`,
                    }}>
                      {status.label}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      {statusKey === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(r.id)}
                            disabled={isProcessing}
                            className={styles.seeAllBtn}
                            style={{ color: '#2ecc71', borderColor: 'rgba(46,204,113,0.3)' }}
                            title="Onayla"
                          >
                            <FiCheck /> {isProcessing ? '...' : 'Onayla'}
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            disabled={isProcessing}
                            className={styles.seeAllBtn}
                            style={{ color: '#e05594', borderColor: 'rgba(224,85,148,0.3)' }}
                            title="Reddet"
                          >
                            <FiX /> Reddet
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={isProcessing}
                        className={styles.seeAllBtn}
                        style={{ color: '#e05594' }}
                        title="Sil"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredReviews.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  {filter === 'pending' ? 'Onay bekleyen yorum bulunmamaktadır.' : 'Henüz yorum bulunmamaktadır.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
