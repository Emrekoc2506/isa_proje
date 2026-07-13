import { useState, useEffect } from 'react';
import { FiTrendingUp, FiShoppingBag, FiUsers, FiDollarSign } from 'react-icons/fi';
import * as reportApi from '../../../services/reportApi';
import styles from '../AdminPage.module.css';

export default function DashboardSection() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportApi.getAdminDashboardSummary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Özet veriler yükleniyor...</p>;

  const cards = [
    { label: 'Toplam Ciro', value: `${summary?.totalRevenue || 0} ₺`, icon: FiDollarSign, color: 'var(--gold)' },
    { label: 'Siparişler', value: summary?.totalOrders || 0, icon: FiShoppingBag, color: '#3498db' },
    { label: 'Aktif Müşteriler', value: summary?.totalCustomers || 0, icon: FiUsers, color: '#2ecc71' },
    { label: 'Düşük Stoklu Ürünler', value: summary?.lowStockCount || 0, icon: FiTrendingUp, color: '#e05594' },
  ];

  return (
    <div>
      <div className={styles.statsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={styles.statCard} style={{ '--stat-color': card.color, padding: 20, background: 'rgba(20,10,35,0.4)', border: '1px solid var(--border-gold)', borderRadius: '8px' }}>
              <span className={styles.statIcon}><Icon /></span>
              <div className={styles.statContent}>
                <p className={styles.statValue} style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#fff' }}>{card.value}</p>
                <p className={styles.statLabel} style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>Son Aktivite</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sistem durumu normal. Canlı hub bağlantısı aktif.</p>
      </div>
    </div>
  );
}
