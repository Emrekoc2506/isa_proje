import { useState, useEffect, useCallback } from 'react';
import {
  FiTrendingUp, FiShoppingBag, FiUsers, FiDollarSign,
  FiRefreshCw, FiAlertTriangle, FiStar, FiUserPlus,
  FiPackage, FiActivity, FiEye, FiCalendar, FiClock
} from 'react-icons/fi';
import { MdOutlineLocalShipping } from 'react-icons/md';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import * as reportApi from '../../../services/reportApi';
import { useNotifications } from '../../../context/NotificationContext';
import styles from '../AdminPage.module.css';

// ─── Renk paleti ───────────────────────────────────────────
const GOLD = '#C9A227';
const GOLD_LIGHT = '#E5B93A';
const BLUE = '#3b82f6';
const GREEN = '#22c55e';
const RED = '#ef4444';
const PURPLE = '#a855f7';
const ORANGE = '#f97316';
const PIE_COLORS = [GOLD, BLUE, GREEN, PURPLE, ORANGE, RED, '#06b6d4', '#ec4899'];

// ─── Son 7 gün tarih etiketleri ────────────────────────────
function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' }),
      iso: d.toISOString().slice(0, 10),
    });
  }
  return days;
}

// ─── Yardımcı: Kaç gün önceydi ─────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins} dakika önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} saat önce`;
  return `${Math.floor(hrs / 24)} gün önce`;
}

// ─── Metrik Kartı Bileşeni ─────────────────────────────────
function MetricCard({ label, value, sub, icon: Icon, color, loading }) {
  return (
    <div className={styles.dashMetricCard} style={{ '--mc-color': color }}>
      <div className={styles.dashMetricIcon} style={{ background: `${color}22`, color }}>
        <Icon size={22} />
      </div>
      <div className={styles.dashMetricContent}>
        <div className={styles.dashMetricValue}>
          {loading ? <span className={styles.dashSkeleton} style={{ width: 60, height: 28 }} /> : value}
        </div>
        <div className={styles.dashMetricLabel}>{label}</div>
        {sub && <div className={styles.dashMetricSub}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Özel Tooltip ─────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(20,10,40,0.97)', border: '1px solid #C9A22740',
      borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#fff'
    }}>
      <div style={{ marginBottom: 4, color: GOLD_LIGHT, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i}>{p.name}: <strong style={{ color: p.color }}>{p.value}</strong></div>
      ))}
    </div>
  );
}

// ─── Ana Dashboard Bileşeni ────────────────────────────────
export default function DashboardSection({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [salesReport, setSalesReport] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { notifications } = useNotifications?.() || {};

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().slice(0, 10);

      const [summ, custs, recent, prods, sales, revs] = await Promise.allSettled([
        reportApi.getAdminDashboardSummary(),
        reportApi.getCustomersReport(),
        reportApi.getRecentOrders(5),
        reportApi.getProductsReport({ dateFrom: `${weekAgoStr}T00:00:00Z` }),
        reportApi.getSalesReport({ dateFrom: `${todayStr}T00:00:00Z` }),
        reportApi.getReviewsReport(),
      ]);

      setSummary(summ.status === 'fulfilled' ? summ.value : null);
      setCustomers(custs.status === 'fulfilled' ? (custs.value || []) : []);
      setRecentOrders(recent.status === 'fulfilled' ? (recent.value?.items || []) : []);
      setTopProducts(prods.status === 'fulfilled' ? (prods.value || []).slice(0, 5) : []);
      setSalesReport(sales.status === 'fulfilled' ? sales.value : null);
      setReviews(revs.status === 'fulfilled' ? (revs.value?.items || []) : []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // 60 saniyede bir otomatik güncelle
  useEffect(() => {
    const iv = setInterval(() => fetchAll(true), 60000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  // ─── Hesaplanan Metrikler ─────────────────────────────
  const totalCustomers = customers.length;
  const today = new Date().toISOString().slice(0, 10);
  const registeredToday = customers.filter(c =>
    c.createdAt?.slice(0, 10) === today
  ).length;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const registeredThisWeek = customers.filter(c =>
    c.createdAt && new Date(c.createdAt) >= weekAgo
  ).length;
  const pendingReviews = reviews.filter(r => !r.isApproved && !r.isDeleted).length;
  const lowStockCount = summary?.lowStockCount || 0;
  const todayCiro = salesReport?.totalRevenue || 0;
  const totalCiro = summary?.totalRevenue || 0;
  const totalOrders = summary?.totalOrders || 0;
  const recentCustomers = [...customers]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // ─── Sipariş Grafiği Verisi ────────────────────────────
  const last7Days = getLast7Days();
  const orderChartData = last7Days.map(day => ({
    name: day.label,
    Siparişler: recentOrders.filter(o => o.createdAt?.slice(0, 10) === day.iso).length,
  }));

  // ─── Kategori Pasta Grafiği ───────────────────────────
  const categoryMap = {};
  topProducts.forEach(p => {
    const cat = p.categoryName || 'Diğer';
    categoryMap[cat] = (categoryMap[cat] || 0) + (p.soldQuantity || 1);
  });
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // ─── Aktivite Akışı ───────────────────────────────────
  const activityFeed = [
    ...recentOrders.slice(0, 3).map(o => ({
      icon: FiShoppingBag,
      color: GOLD,
      text: `${o.customerName || 'Müşteri'} sipariş verdi`,
      sub: `${o.totalAmount || o.grandTotal || 0} ₺`,
      time: o.createdAt,
    })),
    ...recentCustomers.slice(0, 2).map(c => ({
      icon: FiUserPlus,
      color: GREEN,
      text: `${c.email || c.name || 'Yeni üye'} kaydoldu`,
      sub: 'Yeni kayıt',
      time: c.createdAt,
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);

  return (
    <div className={styles.dashboardRoot}>
      {/* ── Başlık ─────────────────────────────────── */}
      <div className={styles.dashHeader}>
        <div>
          <h2 className={styles.dashTitle}>🎛️ Canlı Kontrol Paneli</h2>
          {lastUpdated && (
            <span className={styles.dashUpdated}>
              <FiClock size={12} /> Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}
            </span>
          )}
        </div>
        <button
          className={styles.dashRefreshBtn}
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          title="Verileri yenile"
        >
          <FiRefreshCw size={15} className={refreshing ? styles.spinning : ''} />
          {refreshing ? 'Yenileniyor...' : 'Yenile'}
        </button>
      </div>

      {/* ── 6 Metrik Kartı ─────────────────────────── */}
      <div className={styles.dashMetricsGrid}>
        <MetricCard label="Toplam Ciro" value={`${totalCiro} ₺`} sub="Tüm zamanlar" icon={FiDollarSign} color={GOLD} loading={loading} />
        <MetricCard label="Bugünkü Ciro" value={`${todayCiro} ₺`} sub="Bugün" icon={FiTrendingUp} color={ORANGE} loading={loading} />
        <MetricCard label="Toplam Sipariş" value={totalOrders} sub="Tüm zamanlar" icon={FiShoppingBag} color={BLUE} loading={loading} />
        <MetricCard label="Toplam Üye" value={totalCustomers} sub={`+${registeredThisWeek} bu hafta`} icon={FiUsers} color={GREEN} loading={loading} />
        <MetricCard label="Bugün Kayıt" value={registeredToday} sub="Yeni kayıt" icon={FiUserPlus} color={PURPLE} loading={loading} />
        <MetricCard label="Onay Bekleyen Yorum" value={pendingReviews} sub={lowStockCount > 0 ? `⚠️ ${lowStockCount} düşük stok` : 'Stok normal'} icon={FiStar} color={pendingReviews > 0 ? RED : GREEN} loading={loading} />
      </div>

      {/* ── İkinci Satır: Grafik + En Çok Satanlar ─── */}
      <div className={styles.dashRow2}>
        {/* Bar Grafik – Son 7 Gün Sipariş */}
        <div className={styles.dashCard}>
          <div className={styles.dashCardHeader}>
            <span className={styles.dashCardTitle}><FiActivity /> Son 7 Günlük Sipariş</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={orderChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Siparişler" fill={GOLD} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* En Çok Satanlar */}
        <div className={styles.dashCard}>
          <div className={styles.dashCardHeader}>
            <span className={styles.dashCardTitle}><FiPackage /> En Çok Satanlar (Bu Hafta)</span>
          </div>
          {topProducts.length === 0 ? (
            <p className={styles.dashEmpty}>Bu dönem için veri yok.</p>
          ) : (
            <div className={styles.dashTopList}>
              {topProducts.map((p, i) => (
                <div key={i} className={styles.dashTopRow}>
                  <span className={styles.dashTopRank} style={{ background: i === 0 ? GOLD : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.08)' }}>
                    {i + 1}
                  </span>
                  <span className={styles.dashTopName}>{p.productName}</span>
                  <span className={styles.dashTopStat}>{p.soldQuantity || 0} adet</span>
                  <span className={styles.dashTopRevenue}>{p.totalRevenue || 0} ₺</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Üçüncü Satır: Son Siparişler + Son Kayıtlar ─── */}
      <div className={styles.dashRow2}>
        {/* Son Siparişler */}
        <div className={styles.dashCard}>
          <div className={styles.dashCardHeader}>
            <span className={styles.dashCardTitle}><FiShoppingBag /> Son Siparişler</span>
            {onNavigate && (
              <button className={styles.dashViewAll} onClick={() => onNavigate('orders')}>
                Tümünü Gör <FiEye size={12} />
              </button>
            )}
          </div>
          {recentOrders.length === 0 ? (
            <p className={styles.dashEmpty}>Henüz sipariş bulunmamaktadır.</p>
          ) : (
            <div className={styles.dashOrderList}>
              {recentOrders.map((o, i) => (
                <div key={i} className={styles.dashOrderRow}>
                  <div className={styles.dashOrderAvatar}>
                    {(o.customerName || 'M')[0].toUpperCase()}
                  </div>
                  <div className={styles.dashOrderInfo}>
                    <div className={styles.dashOrderName}>{o.customerName || 'Misafir Müşteri'}</div>
                    <div className={styles.dashOrderMeta}>#{o.orderNumber || o.id?.slice(0, 8).toUpperCase()}</div>
                  </div>
                  <div className={styles.dashOrderRight}>
                    <div className={styles.dashOrderAmount}>{o.totalAmount || o.grandTotal || 0} ₺</div>
                    <div className={styles.dashOrderTime}>{timeAgo(o.createdAt)}</div>
                  </div>
                  <div className={styles.dashOrderStatus} style={{
                    background: o.paymentStatus === 'Paid' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                    color: o.paymentStatus === 'Paid' ? GREEN : '#eab308',
                  }}>
                    {o.paymentStatus === 'Paid' ? 'Ödendi' : 'Bekliyor'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Son Kayıt Olan Üyeler */}
        <div className={styles.dashCard}>
          <div className={styles.dashCardHeader}>
            <span className={styles.dashCardTitle}><FiUserPlus /> Son Kayıt Olan Üyeler</span>
            {onNavigate && (
              <button className={styles.dashViewAll} onClick={() => onNavigate('customers')}>
                Tümünü Gör <FiEye size={12} />
              </button>
            )}
          </div>
          {recentCustomers.length === 0 ? (
            <p className={styles.dashEmpty}>Henüz üye bulunmamaktadır.</p>
          ) : (
            <div className={styles.dashOrderList}>
              {recentCustomers.map((c, i) => (
                <div key={i} className={styles.dashOrderRow}>
                  <div className={styles.dashOrderAvatar} style={{ background: 'rgba(34,197,94,0.2)', color: GREEN }}>
                    {(c.email || c.name || 'U')[0].toUpperCase()}
                  </div>
                  <div className={styles.dashOrderInfo}>
                    <div className={styles.dashOrderName}>{c.name || c.email?.split('@')[0] || 'Kullanıcı'}</div>
                    <div className={styles.dashOrderMeta}>{c.email || ''}</div>
                  </div>
                  <div className={styles.dashOrderRight}>
                    <div className={styles.dashOrderTime}>{timeAgo(c.createdAt)}</div>
                    <div className={styles.dashOrderStatus} style={{
                      background: c.isActive !== false ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: c.isActive !== false ? GREEN : RED,
                    }}>
                      {c.isActive !== false ? 'Aktif' : 'Pasif'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Dördüncü Satır: Aktivite Akışı + Uyarılar ─── */}
      <div className={styles.dashRow2}>
        {/* Canlı Aktivite Akışı */}
        <div className={styles.dashCard}>
          <div className={styles.dashCardHeader}>
            <span className={styles.dashCardTitle}><FiActivity /> Canlı Aktivite Akışı</span>
            <span className={styles.dashLiveBadge}>● CANLI</span>
          </div>
          {activityFeed.length === 0 ? (
            <p className={styles.dashEmpty}>Sistem durumu normal. Aktivite bekleniyor...</p>
          ) : (
            <div className={styles.dashActivityList}>
              {activityFeed.map((ev, i) => {
                const Icon = ev.icon;
                return (
                  <div key={i} className={styles.dashActivityRow}>
                    <div className={styles.dashActivityIcon} style={{ color: ev.color, background: `${ev.color}20` }}>
                      <Icon size={14} />
                    </div>
                    <div className={styles.dashActivityContent}>
                      <div className={styles.dashActivityText}>{ev.text}</div>
                      <div className={styles.dashActivitySub}>{ev.sub}</div>
                    </div>
                    <div className={styles.dashActivityTime}>{timeAgo(ev.time)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Uyarılar & Aksiyonlar */}
        <div className={styles.dashCard}>
          <div className={styles.dashCardHeader}>
            <span className={styles.dashCardTitle}><FiAlertTriangle /> Dikkat Gerektiren</span>
          </div>
          <div className={styles.dashAlertList}>
            {lowStockCount > 0 ? (
              <div className={styles.dashAlert} style={{ borderColor: RED, background: 'rgba(239,68,68,0.07)' }}>
                <FiAlertTriangle color={RED} size={16} />
                <div>
                  <div style={{ color: RED, fontWeight: 600, fontSize: 13 }}>Düşük Stok Uyarısı</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {lowStockCount} ürün kritik stok seviyesinde
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.dashAlert} style={{ borderColor: GREEN, background: 'rgba(34,197,94,0.07)' }}>
                <MdOutlineLocalShipping color={GREEN} size={16} />
                <div>
                  <div style={{ color: GREEN, fontWeight: 600, fontSize: 13 }}>Stok Durumu Normal</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Tüm ürünler yeterli stokta
                  </div>
                </div>
              </div>
            )}
            {pendingReviews > 0 ? (
              <div className={styles.dashAlert} style={{ borderColor: ORANGE, background: 'rgba(249,115,22,0.07)' }}>
                <FiStar color={ORANGE} size={16} />
                <div>
                  <div style={{ color: ORANGE, fontWeight: 600, fontSize: 13 }}>Onay Bekleyen Yorumlar</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {pendingReviews} yorum inceleme bekliyor
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.dashAlert} style={{ borderColor: GREEN, background: 'rgba(34,197,94,0.07)' }}>
                <FiStar color={GREEN} size={16} />
                <div>
                  <div style={{ color: GREEN, fontWeight: 600, fontSize: 13 }}>Tüm Yorumlar Onaylı</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Bekleyen yorum yok
                  </div>
                </div>
              </div>
            )}
            <div className={styles.dashAlert} style={{ borderColor: BLUE, background: 'rgba(59,130,246,0.07)' }}>
              <FiUsers color={BLUE} size={16} />
              <div>
                <div style={{ color: BLUE, fontWeight: 600, fontSize: 13 }}>Bu Hafta Kayıt</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {registeredThisWeek} yeni üye bu hafta katıldı
                </div>
              </div>
            </div>
            <div className={styles.dashAlert} style={{ borderColor: PURPLE, background: 'rgba(168,85,247,0.07)' }}>
              <FiCalendar color={PURPLE} size={16} />
              <div>
                <div style={{ color: PURPLE, fontWeight: 600, fontSize: 13 }}>Bugün Kayıt</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {registeredToday > 0 ? `${registeredToday} kişi bugün kayıt oldu` : 'Bugün kayıt yok'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
