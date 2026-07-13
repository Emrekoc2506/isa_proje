import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import * as bannerApi from '../../../services/bannerApi';
import { uploadFile } from '../../../services/fileApi';
import styles from '../AdminPage.module.css';

export default function BannersSection() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [image, setImage] = useState('');
  const [imageMobile, setImageMobile] = useState('');
  const [cta, setCta] = useState('');
  const [href, setHref] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [uploadingImg, setUploadingImg] = useState(false);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const data = await bannerApi.getAdminBanners();
      setBanners(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImg(type);
      const response = await uploadFile(file, 'banner');
      if (response && response.url) {
        if (type === 'desktop') setImage(response.url);
        else setImageMobile(response.url);
      }
    } catch (err) {
      alert("Görsel yüklenemedi: " + err.message);
    } finally {
      setUploadingImg(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!image) {
      alert("Lütfen desktop görseli yükleyin.");
      return;
    }

    try {
      await bannerApi.createAdminBanner({
        title,
        subtitle,
        image,
        imageMobile: imageMobile || image,
        cta: cta || "Keşfet",
        href: href || "/urunler",
        sortOrder: parseInt(sortOrder) || 0,
        isActive: true
      });
      setShowModal(false);
      fetchBanners();
    } catch (err) {
      alert("Banner oluşturulamadı: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Bu afişi silmek istediğinize emin misiniz?")) {
      try {
        await bannerApi.deleteAdminBanner(id);
        fetchBanners();
      } catch (err) {
        alert("Afiş silinemedi: " + err.message);
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await bannerApi.updateAdminBannerStatus(id, !currentStatus);
      fetchBanners();
    } catch (err) {
      alert("Durum güncellenemedi: " + err.message);
    }
  };

  if (loading) return <p>Yükleniyor...</p>;

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Afiş / İlan Yönetimi</h3>
        <button onClick={() => { setShowModal(true); setTitle(''); setSubtitle(''); setImage(''); setImageMobile(''); setCta(''); setHref(''); setSortOrder('0'); }} className={styles.shopBtn}>
          <FiPlus /> Yeni Afiş Ekle
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 16 }}>
        {banners.map(b => (
          <div key={b.id} style={{ border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-md)', padding: 12, background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <img src={b.image} alt={b.title} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4 }} />
            <div>
              <h4 style={{ color: '#fff', margin: '4px 0' }}>{b.title || "Başlıksız İlan"}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '2px 0' }}>Link: {b.href}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button 
                onClick={() => handleToggleStatus(b.id, b.isActive)} 
                className={styles.seeAllBtn}
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: b.isActive ? '#2ecc71' : 'var(--text-muted)' }}
              >
                {b.isActive ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                {b.isActive ? 'Aktif' : 'Pasif'}
              </button>
              <button onClick={() => handleDelete(b.id)} className={styles.seeAllBtn} style={{ color: '#e05594' }}>
                <FiTrash2 /> Sil
              </button>
            </div>
          </div>
        ))}
        {banners.length === 0 && <p className={styles.emptyText}>Henüz afiş eklenmemiştir.</p>}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className={styles.sectionCard} style={{ width: '90%', maxWidth: 450, background: 'var(--bg-dark)' }}>
            <h4 style={{ color: 'var(--gold-light)', margin: '0 0 20px 0', fontSize: 16 }}>Yeni Afiş Ekle</h4>
            <form onSubmit={handleAdd} className={styles.profileForm}>
              <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr', gap: 12 }}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Başlık</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={styles.fieldInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Alt Başlık</label>
                  <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} className={styles.fieldInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Desktop Görseli *</label>
                  <input type="file" onChange={e => handleImageUpload(e, 'desktop')} style={{ color: '#fff', fontSize: 13 }} />
                  {uploadingImg === 'desktop' && <p style={{ color: 'var(--gold)', fontSize: 12 }}>Yükleniyor...</p>}
                  {image && <p style={{ color: '#2ecc71', fontSize: 12 }}>Yüklendi: {image.substring(0, 30)}...</p>}
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Mobil Görseli (Opsiyonel)</label>
                  <input type="file" onChange={e => handleImageUpload(e, 'mobile')} style={{ color: '#fff', fontSize: 13 }} />
                  {uploadingImg === 'mobile' && <p style={{ color: 'var(--gold)', fontSize: 12 }}>Yükleniyor...</p>}
                  {imageMobile && <p style={{ color: '#2ecc71', fontSize: 12 }}>Yüklendi: {imageMobile.substring(0, 30)}...</p>}
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Buton Metni (CTA)</label>
                  <input type="text" value={cta} onChange={e => setCta(e.target.value)} className={styles.fieldInput} placeholder="Keşfet" />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Yönlendirme Linki (Href)</label>
                  <input type="text" value={href} onChange={e => setHref(e.target.value)} className={styles.fieldInput} placeholder="/urunler" />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Sıralama (Öncelik)</label>
                  <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className={styles.fieldInput} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="submit" className={styles.shopBtn}>Ekle</button>
                <button type="button" onClick={() => setShowModal(false)} className={styles.seeAllBtn}>İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
