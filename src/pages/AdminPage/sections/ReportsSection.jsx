import { useState, useEffect } from 'react';
import { FiDownload, FiCalendar, FiFilter, FiActivity, FiTrendingUp, FiShoppingBag } from 'react-icons/fi';
import * as reportApi from '../../../services/reportApi';
import styles from '../AdminPage.module.css';

export default function ReportsSection() {
  const [salesReport, setSalesReport] = useState(null);
  const [ordersReport, setOrdersReport] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = {
        dateFrom: dateFrom ? new Date(dateFrom).toISOString() : null,
        dateTo: dateTo ? new Date(dateTo).toISOString() : null
      };

      const [sales, ords, prods] = await Promise.all([
        reportApi.getSalesReport(params).catch(() => null),
        reportApi.getOrdersReport(params).catch(() => null),
        reportApi.getProductsReport(params).catch(() => [])
      ]);

      setSalesReport(sales);
      setOrdersReport(ords);
      setTopProducts(prods || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    loadReports();
  };

  const handleExportCsv = async () => {
    try {
      setExportLoading(true);
      const params = {
        dateFrom: dateFrom ? new Date(dateFrom).toISOString() : null,
        dateTo: dateTo ? new Date(dateTo).toISOString() : null
      };
      await reportApi.downloadOrdersCsv(params);
    } catch (err) {
      alert("Hata: Rapor indirilemedi. " + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader} style={{ marginBottom: 20 }}>
        <h3 className={styles.sectionTitle}>Satış & Analiz Raporları</h3>
        <button 
          onClick={handleExportCsv} 
          disabled={exportLoading}
          className={styles.shopBtn}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <FiDownload /> {exportLoading ? 'Dışa Aktarılıyor...' : 'Sipariş Raporunu İndir (CSV)'}
        </button>
      </div>

      {/* Tarih Filtresi */}
      <form onSubmit={handleFilter} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 24, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Başlangıç Tarihi</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={styles.fieldInput} style={{ width: 150, padding: 8 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Bitiş Tarihi</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={styles.fieldInput} style={{ width: 150, padding: 8 }} />
        </div>
        <button type="submit" className={styles.shopBtn} style={{ padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiFilter /> Filtrele
        </button>
      </form>

      {loading ? (
        <p>Raporlar yükleniyor...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Rapor Kartları */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ padding: 16, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-mid)', borderRadius: 6 }}>
              <span style={{ color: 'var(--gold-light)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><FiActivity /> Toplam Ciro</span>
              <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{salesReport?.totalRevenue || 0} ₺</span>
            </div>
            <div style={{ padding: 16, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-mid)', borderRadius: 6 }}>
              <span style={{ color: 'var(--gold-light)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><FiShoppingBag /> Toplam Sipariş</span>
              <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{ordersReport?.totalOrders || 0}</span>
            </div>
            <div style={{ padding: 16, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-mid)', borderRadius: 6 }}>
              <span style={{ color: 'var(--gold-light)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><FiTrendingUp /> Ortalama Sepet Değeri</span>
              <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{ordersReport?.averageOrderValue || 0} ₺</span>
            </div>
          </div>

          {/* En Çok Satan Ürünler */}
          <div>
            <h4 style={{ color: 'var(--gold-light)', margin: '0 0 12px 0', fontSize: 15 }}>En Çok Satan Ürünler</h4>
            <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: 8, color: 'var(--gold-light)', fontSize: 13 }}>Ürün Adı</th>
                  <th style={{ padding: 8, color: 'var(--gold-light)', fontSize: 13 }}>Satılan Adet</th>
                  <th style={{ padding: 8, color: 'var(--gold-light)', fontSize: 13 }}>Toplam Gelir</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: 8, color: '#fff', fontSize: 13 }}>{p.productName}</td>
                    <td style={{ padding: 8, color: 'var(--text-secondary)', fontSize: 13 }}>{p.soldQuantity} adet</td>
                    <td style={{ padding: 8, color: 'var(--gold-light)', fontSize: 13 }}>{p.totalRevenue} ₺</td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)' }}>Bu dönemde satış bulunmamaktadır.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
