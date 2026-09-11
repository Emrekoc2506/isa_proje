import { useState } from 'react';
import {
  FiZap,
  FiPlay,
  FiCheckCircle,
  FiAlertCircle,
  FiHardDrive,
  FiRefreshCw,
  FiInfo,
  FiLayers,
  FiShield,
  FiX,
  FiCheck,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { reoptimizeMedia } from '../../../services/mediaApi';
import styles from '../AdminPage.module.css';

/**
 * Formats raw bytes into human-readable B, KB, MB, GB format.
 */
export function formatBytes(bytes) {
  if (bytes == null || isNaN(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${parseFloat(val.toFixed(2))} ${sizes[i]}`;
}

export default function MediaOptimizationSection() {
  const [batchSize, setBatchSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [dryRunResult, setDryRunResult] = useState(null);
  const [liveResult, setLiveResult] = useState(null);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 1. Dry-run analizi
  const handleDryRun = async () => {
    if (loading || isOptimizing) return;
    setError(null);
    setLoading(true);
    try {
      const data = await reoptimizeMedia({ dryRun: true, batchSize });
      setDryRunResult(data);
      // Yeni analiz yapıldığında eski canlı sonuç sıfırlanır
      setLiveResult(null);
    } catch (err) {
      setError(err?.message || 'Medya analizi sırasında bir hata oluştu.');
      setDryRunResult(null);
    } finally {
      setLoading(false);
    }
  };

  // 2. Gerçek optimizasyon başlatma onayı
  const handleOpenConfirm = () => {
    if (!dryRunResult || loading || isOptimizing) return;
    setShowConfirmModal(true);
  };

  // 3. Gerçek optimizasyon çalıştırma
  const handleExecuteLiveOptimization = async () => {
    setShowConfirmModal(false);
    if (loading || isOptimizing) return;

    setError(null);
    setIsOptimizing(true);
    try {
      const data = await reoptimizeMedia({ dryRun: false, batchSize });
      setLiveResult(data);
    } catch (err) {
      setError(err?.message || 'Medya optimizasyonu gerçekleştirilemedi.');
      setLiveResult(null);
    } finally {
      setIsOptimizing(false);
    }
  };

  const isBusy = loading || isOptimizing;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      {/* ── BAŞLIK BÖLÜMÜ ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(201,162,39,0.2), rgba(201,162,39,0.05))',
              border: '1px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-light)',
            }}
          >
            <FiZap size={22} />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Medya Optimizasyonu
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
              Eski ürün, kategori ve banner görsellerini modern WebP formatına dönüştürerek disk alanından tasarruf edin.
            </p>
          </div>
        </div>
      </div>

      {/* ── BİLGİLENDİRME KARTI ── */}
      <div
        style={{
          background: 'rgba(201,162,39,0.06)',
          border: '1px solid rgba(201,162,39,0.25)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          display: 'flex',
          gap: 14,
          alignItems: 'flex-start',
        }}
      >
        <FiInfo size={20} style={{ color: 'var(--gold-light)', marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>
          <strong>Güvenli İki Aşamalı İşlem:</strong>
          <br />
          1. Önce <strong>"Eski Görselleri Analiz Et"</strong> butonuna basarak potansiyel tasarrufu ve optimize edilecek dosyaları test (dry-run) edin.
          <br />
          2. Analiz sonuçları incelendikten sonra <strong>"Optimizasyonu Başlat"</strong> butonu aktif hale gelir. Orijinal dosyalar korunur.
        </div>
      </div>

      {/* ── KONTROL PANELİ ── */}
      <div
        style={{
          background: 'var(--bg-card, rgba(255, 255, 255, 0.03))',
          border: '1px solid var(--border-gold)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Batch Size Seçimi */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiLayers size={18} style={{ color: 'var(--gold-light)' }} />
          <label htmlFor="batchSizeSelect" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Paket Boyutu (Batch Size):
          </label>
          <select
            id="batchSizeSelect"
            value={batchSize}
            disabled={isBusy}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            style={{
              background: 'var(--bg-mid)',
              border: '1px solid var(--border-gold)',
              borderRadius: 8,
              padding: '6px 12px',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
              cursor: isBusy ? 'not-allowed' : 'pointer',
            }}
          >
            <option value={10}>10 görsel</option>
            <option value={25}>25 görsel (Önerilen)</option>
            <option value={50}>50 görsel</option>
            <option value={100}>100 görsel</option>
          </select>
        </div>

        {/* Butonlar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {/* Dry Run Butonu */}
          <button
            type="button"
            id="btn-dry-run"
            onClick={handleDryRun}
            disabled={isBusy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              background: 'var(--bg-mid, rgba(255, 255, 255, 0.05))',
              border: '1px solid var(--border-gold)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: isBusy ? 'not-allowed' : 'pointer',
              opacity: isBusy ? 0.6 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            <FiRefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Analiz Ediliyor...' : 'Eski Görselleri Analiz Et'}
          </button>

          {/* Gerçek Optimizasyon Butonu */}
          <button
            type="button"
            id="btn-live-optimize"
            onClick={handleOpenConfirm}
            disabled={!dryRunResult || isBusy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: !dryRunResult || isBusy
                ? 'rgba(255, 255, 255, 0.05)'
                : 'linear-gradient(135deg, var(--gold-light, #d4af37), var(--gold, #c9a227))',
              border: !dryRunResult || isBusy ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
              borderRadius: 8,
              color: !dryRunResult || isBusy ? 'var(--text-secondary)' : '#1a1005',
              fontSize: 13,
              fontWeight: 700,
              cursor: !dryRunResult || isBusy ? 'not-allowed' : 'pointer',
              opacity: !dryRunResult || isBusy ? 0.6 : 1,
              boxShadow: !dryRunResult || isBusy ? 'none' : '0 2px 10px rgba(201,162,39,0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            <FiPlay size={15} style={{ animation: isOptimizing ? 'spin 1s linear infinite' : 'none' }} />
            {isOptimizing ? 'Optimize Ediliyor...' : 'Optimizasyonu Başlat'}
          </button>
        </div>
      </div>

      {/* ── HATA ALANI ── */}
      {error && (
        <div
          role="alert"
          style={{
            background: 'rgba(231, 76, 60, 0.12)',
            border: '1px solid rgba(231, 76, 60, 0.35)',
            borderRadius: 10,
            padding: '14px 18px',
            marginBottom: 20,
            color: '#e74c3c',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
          }}
        >
          <FiAlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* ── DRY RUN SONUÇLARI KARTI ── */}
      {dryRunResult && (
        <div
          id="dry-run-report"
          style={{
            background: 'var(--bg-card, rgba(255, 255, 255, 0.03))',
            border: '1px solid rgba(201,162,39,0.35)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiShield size={18} style={{ color: 'var(--gold-light)' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Dry-Run Analiz Sonucu (Simülasyon)
              </h3>
            </div>
            <span
              style={{
                fontSize: 11,
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(201,162,39,0.15)',
                color: 'var(--gold-light)',
                fontWeight: 600,
              }}
            >
              Henüz Değişiklik Yapılmadı
            </span>
          </div>

          {/* Metrik Kartları */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <StatCard label="Taranan" value={dryRunResult.totalScanned ?? 0} />
            <StatCard label="Optimize Edilecek" value={dryRunResult.wouldOptimize ?? 0} highlight />
            <StatCard label="Zaten Optimize" value={dryRunResult.alreadyOptimized ?? 0} />
            <StatCard label="Atlanan" value={dryRunResult.skipped ?? 0} />
            <StatCard label="Başarısız" value={dryRunResult.failed ?? 0} isError={dryRunResult.failed > 0} />
          </div>

          {/* Boyut ve Tasarruf Özeti */}
          <div
            style={{
              background: 'var(--bg-mid, rgba(255, 255, 255, 0.02))',
              border: '1px solid var(--border-gold)',
              borderRadius: 10,
              padding: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Önceki Tahmini Boyut</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                {formatBytes(dryRunResult.estimatedBytesBefore)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Sonraki Tahmini Boyut</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                {formatBytes(dryRunResult.estimatedBytesAfter)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Tahmini Kazanç</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#2ecc71', marginTop: 4 }}>
                {formatBytes(
                  Math.max(
                    0,
                    (dryRunResult.estimatedBytesBefore || 0) - (dryRunResult.estimatedBytesAfter || 0)
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CANLI OPTİMİZASYON RAPORU ── */}
      {liveResult && (
        <div
          id="live-optimization-report"
          style={{
            background: 'var(--bg-card, rgba(255, 255, 255, 0.03))',
            border: '1px solid rgba(46, 204, 113, 0.4)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiCheckCircle size={20} style={{ color: '#2ecc71' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Optimizasyon Başarıyla Tamamlandı
              </h3>
            </div>
            <span
              style={{
                fontSize: 11,
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(46, 204, 113, 0.15)',
                color: '#2ecc71',
                fontWeight: 600,
              }}
            >
              Canlı İşlem
            </span>
          </div>

          {/* Metrik Kartları */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <StatCard label="Taranan" value={liveResult.totalScanned ?? liveResult.scanned ?? 0} />
            <StatCard
              label="Optimize Edilen"
              value={liveResult.optimized ?? liveResult.wouldOptimize ?? 0}
              highlight
            />
            <StatCard label="Zaten Optimize" value={liveResult.alreadyOptimized ?? 0} />
            <StatCard label="Atlanan" value={liveResult.skipped ?? 0} />
            <StatCard label="Başarısız" value={liveResult.failed ?? 0} isError={liveResult.failed > 0} />
          </div>

          {/* Boyut ve Tasarruf Özeti */}
          <div
            style={{
              background: 'var(--bg-mid, rgba(255, 255, 255, 0.02))',
              border: '1px solid var(--border-gold)',
              borderRadius: 10,
              padding: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Önceki Tahmini Boyut</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                {formatBytes(liveResult.estimatedBytesBefore)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Sonraki Tahmini Boyut</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                {formatBytes(liveResult.estimatedBytesAfter)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Kazanç</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#2ecc71', marginTop: 4 }}>
                {formatBytes(
                  Math.max(
                    0,
                    (liveResult.estimatedBytesBefore || 0) - (liveResult.estimatedBytesAfter || 0)
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ONAY MODALI (CONFIRMATION MODAL) ── */}
      <AnimatePresence>
        {showConfirmModal && (
          <div
            id="optimization-confirm-modal"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                background: 'var(--bg-dark, #0d0614)',
                border: '1px solid var(--border-gold)',
                borderRadius: 14,
                maxWidth: 480,
                width: '100%',
                padding: 24,
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(201,162,39,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gold-light)',
                  }}
                >
                  <FiAlertCircle size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Optimizasyon Onayı
                </h3>
              </div>

              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                  margin: '0 0 24px 0',
                }}
              >
                Bu işlem eski ürün, kategori ve banner görsellerinin optimize edilmiş yeni sürümlerini oluşturacaktır. Orijinal dosyalar silinmeyecektir. Devam etmek istiyor musunuz?
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  id="btn-cancel-optimize"
                  onClick={() => setShowConfirmModal(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    background: 'transparent',
                    border: '1px solid var(--border-gold)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  id="btn-confirm-optimize"
                  onClick={handleExecuteLiveOptimization}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, var(--gold-light, #d4af37), var(--gold, #c9a227))',
                    border: 'none',
                    color: '#1a1005',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Evet, Başlat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, highlight, isError }) {
  return (
    <div
      style={{
        background: 'var(--bg-mid, rgba(255, 255, 255, 0.02))',
        border: highlight
          ? '1px solid var(--gold-light)'
          : isError
          ? '1px solid #e74c3c'
          : '1px solid var(--border-gold)',
        borderRadius: 8,
        padding: '12px 14px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: highlight ? 'var(--gold-light)' : isError ? '#e74c3c' : 'var(--text-primary)',
        }}
      >
        {value}
      </div>
    </div>
  );
}
