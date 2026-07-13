import { useState, useEffect } from 'react';
import { FiToggleLeft, FiToggleRight, FiMail, FiPhone, FiCalendar } from 'react-icons/fi';
import * as customerApi from '../../../services/customerApi';
import styles from '../AdminPage.module.css';

export default function CustomersSection() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerApi.getAdminCustomers();
      setCustomers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await customerApi.updateAdminCustomerStatus(id, !currentStatus);
      fetchCustomers();
    } catch (err) {
      alert("Kullanıcı durumu güncellenemedi: " + err.message);
    }
  };

  if (loading) return <p>Müşteri listesi yükleniyor...</p>;

  return (
    <div className={styles.sectionCard}>
      <h3 className={styles.sectionTitle}>Müşteri Hesapları</h3>

      <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-gold)' }}>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Müşteri Adı</th>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>E-posta</th>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Telefon</th>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Kayıt Tarihi</th>
            <th style={{ padding: '12px 8px', color: 'var(--gold-light)' }}>Hesap Durumu</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: 8, color: '#fff', fontWeight: 600 }}>{c.fullName}</td>
              <td style={{ padding: 8, color: 'var(--text-secondary)' }}><FiMail style={{ display: 'inline', marginRight: 4, opacity: 0.7 }} /> {c.email}</td>
              <td style={{ padding: 8, color: 'var(--text-secondary)' }}><FiPhone style={{ display: 'inline', marginRight: 4, opacity: 0.7 }} /> {c.phoneNumber || 'Yok'}</td>
              <td style={{ padding: 8, color: 'var(--text-secondary)' }}><FiCalendar style={{ display: 'inline', marginRight: 4, opacity: 0.7 }} /> {c.createdAt ? new Date(c.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</td>
              <td style={{ padding: 8 }}>
                <button 
                  onClick={() => handleToggleStatus(c.id, c.isActive)}
                  className={styles.seeAllBtn}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, color: c.isActive ? '#2ecc71' : 'var(--text-muted)' }}
                >
                  {c.isActive ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                  {c.isActive ? 'Aktif' : 'Pasif'}
                </button>
              </td>
            </tr>
          ))}
          {customers.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Sistemde kayıtlı müşteri bulunmamaktadır.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
