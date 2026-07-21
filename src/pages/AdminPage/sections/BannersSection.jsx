import { useState, useEffect, useCallback } from 'react';
import {
  FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiTag, FiImage,
  FiSliders, FiCheck, FiUploadCloud, FiChevronLeft, FiChevronRight,
  FiFileText, FiStar, FiGrid, FiVideo, FiDollarSign, FiEdit2,
  FiAlignLeft, FiList, FiEye, FiX
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import * as bannerApi from '../../../services/bannerApi';
import { uploadFile } from '../../../services/fileApi';
import styles from '../AdminPage.module.css';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Genel',      icon: FiTag       },
  { id: 2, label: 'Görseller',  icon: FiImage     },
  { id: 3, label: 'İçerik',     icon: FiAlignLeft },
  { id: 4, label: 'Özellikler', icon: FiList      },
  { id: 5, label: 'Teknik',     icon: FiGrid      },
];

const EMPTY_FORM = {
  title: '', subtitle: '', image: '', imageMobile: '', cta: '',
  href: '', sortOrder: '0', price: '', videoUrl: '',
  description: '', quote: '',
  sections: [],           // [{title, body}]
  features: [],           // [{title, desc}]
  specs: [],              // [{key, value}]
};

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const card = {
  background: 'rgba(255,255,255,0.01)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: 20,
};
const sectionHead = (icon, title, sub) => ({ icon, title, sub });

const inputStyle = {
  width: '100%',
  background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 13,
  padding: '10px 12px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-body, inherit)',
  transition: 'border-color 0.2s',
};
const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: '600',
  color: 'var(--text-secondary, #aaa)',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};
const goldIconBox = {
  width: 32, height: 32, borderRadius: 8,
  background: 'rgba(201,162,39,0.1)',
  border: '1px solid rgba(201,162,39,0.25)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--gold-light, #c9a227)', flexShrink: 0,
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function SectionBlock({ icon: Icon, title, sub, children }) {
  return (
    <div style={{ ...card, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={goldIconBox}><Icon size={16} /></div>
        <div>
          <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#fff' }}>{title}</span>
          {sub && <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted,#666)', marginTop: 2 }}>{sub}</span>}
        </div>
      </div>
      {children}
    </div>
  );
}

function FieldInput({ label, value, onChange, type = 'text', placeholder = '', prefix, style = {}, rows }) {
  const [focused, setFocused] = useState(false);
  const commonStyle = {
    ...inputStyle,
    borderColor: focused ? 'rgba(201,162,39,0.4)' : 'rgba(255,255,255,0.08)',
    ...style,
  };
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={labelStyle}>{label}</label>}
      {prefix ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ ...commonStyle, width: 'auto', borderRight: 'none', borderRadius: '8px 0 0 8px', color: 'var(--gold-light)', padding: '10px 10px', minWidth: 32 }}>{prefix}</span>
          <input
            type={type} value={value} onChange={onChange} placeholder={placeholder}
            style={{ ...commonStyle, borderRadius: '0 8px 8px 0', flex: 1 }}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          />
        </div>
      ) : rows ? (
        <textarea
          value={value} onChange={onChange} placeholder={placeholder} rows={rows}
          style={{ ...commonStyle, resize: 'vertical', lineHeight: 1.5 }}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        />
      ) : (
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder}
          style={commonStyle}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        />
      )}
    </div>
  );
}

function UploadDropzone({ label, value, onFile, onClear, uploading, id }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={labelStyle}>{label}</label>}
      {!value ? (
        <div
          onClick={() => document.getElementById(id)?.click()}
          style={{
            border: '2px dashed rgba(201,162,39,0.25)', borderRadius: 10,
            padding: '24px 16px', textAlign: 'center',
            background: 'rgba(0,0,0,0.2)', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            position: 'relative', transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,162,39,0.5)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(201,162,39,0.25)'}
        >
          <input id={id} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
          <FiUploadCloud size={24} style={{ color: 'var(--gold-light)' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: '600' }}>
            Tıkla ve görsel yükle
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>PNG, JPG, WEBP — Maks. 10 MB</span>
          {uploading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(18,9,31,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
              <span style={{ color: 'var(--gold-light)', fontSize: 12, fontWeight: 'bold' }}>Yükleniyor...</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ border: '1px solid rgba(201,162,39,0.2)', borderRadius: 10, padding: '10px 14px', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <img src={value} alt="" style={{ height: 56, borderRadius: 6, maxWidth: 180, objectFit: 'cover' }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: '#2ecc71', fontSize: 11 }}>✓ Yüklendi</span>
            <button type="button" onClick={onClear} style={{ background: 'rgba(224,85,148,0.15)', border: '1px solid rgba(224,85,148,0.3)', color: '#e05594', padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>Kaldır</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function BannersSection() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  // Rich content stored locally keyed by banner ID
  const [richContent, setRichContent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bannerRichContent') || '{}'); }
    catch { return {}; }
  });

  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [uploadingImg, setUploadingImg] = useState(false);
  const [saving, setSaving] = useState(false);

  // Preview banner
  const [previewBanner, setPreviewBanner] = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bannerApi.getAdminBanners();
      setBanners(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const setVal = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const openModal = () => {
    setForm({ ...EMPTY_FORM });
    setModalStep(1);
    setShowModal(true);
  };

  const saveRich = (id, data) => {
    const updated = { ...richContent, [id]: data };
    setRichContent(updated);
    localStorage.setItem('bannerRichContent', JSON.stringify(updated));
  };

  // ── Image upload ─────────────────────────────────────────────────────────────
  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingImg(type);
      const resp = await uploadFile(file, 'banner');
      if (resp?.url) setVal(type === 'desktop' ? 'image' : 'imageMobile', resp.url);
    } catch (err) { alert('Görsel yüklenemedi: ' + err.message); }
    finally { setUploadingImg(false); }
  };

  // ── Feature list ──────────────────────────────────────────────────────────────
  const addFeature = () => setForm(f => ({ ...f, features: [...f.features, { title: '', desc: '' }] }));
  const updateFeature = (i, key, val) => setForm(f => {
    const copy = [...f.features];
    copy[i] = { ...copy[i], [key]: val };
    return { ...f, features: copy };
  });
  const removeFeature = (i) => setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));

  // ── Specs table ───────────────────────────────────────────────────────────────
  const addSpec = () => setForm(f => ({ ...f, specs: [...f.specs, { key: '', value: '' }] }));
  const updateSpec = (i, key, val) => setForm(f => {
    const copy = [...f.specs];
    copy[i] = { ...copy[i], [key]: val };
    return { ...f, specs: copy };
  });
  const removeSpec = (i) => setForm(f => ({ ...f, specs: f.specs.filter((_, idx) => idx !== i) }));

  // ── Sections ─────────────────────────────────────────────────────────────────
  const addSection = () => setForm(f => ({ ...f, sections: [...f.sections, { title: '', body: '' }] }));
  const updateSection = (i, key, val) => setForm(f => {
    const copy = [...f.sections];
    copy[i] = { ...copy[i], [key]: val };
    return { ...f, sections: copy };
  });
  const removeSection = (i) => setForm(f => ({ ...f, sections: f.sections.filter((_, idx) => idx !== i) }));

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.image) { alert('Lütfen masaüstü görseli yükleyin.'); return; }

    setSaving(true);
    try {
      const created = await bannerApi.createAdminBanner({
        title: form.title,
        subtitle: form.subtitle,
        image: form.image,
        imageMobile: form.imageMobile || form.image,
        cta: form.cta || 'Keşfet',
        href: form.href || '/urunler',
        sortOrder: parseInt(form.sortOrder) || 0,
        isActive: true,
      });

      // Save rich content locally using the returned ID (or a timestamp fallback)
      const id = created?.id || `local_${Date.now()}`;
      saveRich(id, {
        price: form.price,
        videoUrl: form.videoUrl,
        description: form.description,
        quote: form.quote,
        sections: form.sections,
        features: form.features,
        specs: form.specs,
      });

      setShowModal(false);
      fetchBanners();
    } catch (err) {
      alert('İlan oluşturulamadı: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Step validation ───────────────────────────────────────────────────────────
  const validateStep = (step) => {
    if (step === 1 && !form.title.trim()) { alert('Lütfen ilan başlığını yazın.'); return false; }
    if (step === 2 && !form.image) { alert('Lütfen masaüstü görseli yükleyin.'); return false; }
    return true;
  };

  // ── Toggle / Delete ───────────────────────────────────────────────────────────
  const handleToggleStatus = async (id, current) => {
    try { await bannerApi.updateAdminBannerStatus(id, !current); fetchBanners(); }
    catch (err) { alert('Durum güncellenemedi: ' + err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu ilanı silmek istediğinize emin misiniz?')) return;
    try { await bannerApi.deleteAdminBanner(id); fetchBanners(); }
    catch (err) { alert('İlan silinemedi: ' + err.message); }
  };

  // ── Preview modal ─────────────────────────────────────────────────────────────
  const getBannerRich = (b) => richContent[b.id] || {};

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
          <h3 style={{ color: 'var(--gold-light)', fontSize: 20, fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Afiş / İlan Yönetimi
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0 0' }}>
            {banners.length} ilan • Sitede görünecek kampanya ve ürün afişleri
          </p>
        </div>
        <button
          onClick={openModal}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, var(--gold-light), var(--gold-dark))', color: '#000', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 15px rgba(201,162,39,0.3)' }}
        >
          <FiPlus size={16} /> Yeni İlan Ekle
        </button>
      </div>

      {/* ── BANNERS GRID ── */}
      {banners.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', ...card }}>
          <FiImage size={40} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>Henüz ilan eklenmemiştir.</p>
          <button onClick={openModal} style={{ marginTop: 16, background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.3)', color: 'var(--gold-light)', borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer' }}>
            İlk İlanı Oluştur
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {banners.map(b => {
            const rich = getBannerRich(b);
            return (
              <div key={b.id} style={{ ...card, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Banner Image */}
                <div style={{ position: 'relative' }}>
                  <img src={b.image} alt={b.title} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <span style={{ background: b.isActive ? 'rgba(46,204,113,0.9)' : 'rgba(200,60,60,0.9)', color: '#fff', fontSize: 10, padding: '3px 8px', borderRadius: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {b.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  {rich.price && (
                    <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
                      <span style={{ background: 'rgba(201,162,39,0.9)', color: '#000', fontSize: 13, padding: '4px 10px', borderRadius: 8, fontWeight: 700 }}>
                        ₺{rich.price}
                      </span>
                    </div>
                  )}
                </div>

                {/* Banner Info */}
                <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h4 style={{ color: '#fff', margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{b.title || 'Başlıksız İlan'}</h4>
                  {b.subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0, lineHeight: 1.4 }}>{b.subtitle}</p>}

                  {/* Rich content badges */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {rich.features?.length > 0 && <span style={{ fontSize: 10, background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)', color: '#818cf8', padding: '2px 8px', borderRadius: 10 }}>✦ {rich.features.length} Özellik</span>}
                    {rich.specs?.length > 0 && <span style={{ fontSize: 10, background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#22d3ee', padding: '2px 8px', borderRadius: 10 }}>⊞ {rich.specs.length} Teknik</span>}
                    {rich.videoUrl && <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '2px 8px', borderRadius: 10 }}>▶ Video</span>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button onClick={() => setPreviewBanner({ ...b, rich })} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', borderRadius: 7, padding: '7px 0', fontSize: 12, cursor: 'pointer' }}>
                      <FiEye size={13} /> Önizle
                    </button>
                    <button onClick={() => handleToggleStatus(b.id, b.isActive)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: b.isActive ? 'rgba(46,204,113,0.07)' : 'rgba(255,255,255,0.04)', border: `1px solid ${b.isActive ? 'rgba(46,204,113,0.2)' : 'rgba(255,255,255,0.06)'}`, color: b.isActive ? '#2ecc71' : 'var(--text-muted)', borderRadius: 7, padding: '7px 0', fontSize: 12, cursor: 'pointer' }}>
                      {b.isActive ? <FiToggleRight size={13} /> : <FiToggleLeft size={13} />}
                      {b.isActive ? 'Aktif' : 'Pasif'}
                    </button>
                    <button onClick={() => handleDelete(b.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'rgba(224,85,148,0.07)', border: '1px solid rgba(224,85,148,0.2)', color: '#e05594', borderRadius: 7, padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}>
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          CREATE WIZARD MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 2000, overflowY: 'auto', backdropFilter: 'blur(10px)', padding: '24px 16px' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ width: '100%', maxWidth: 620, background: 'var(--bg-dark, #12091F)', border: '1px solid rgba(201,162,39,0.12)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.7)', marginBottom: 24 }}
            >
              {/* ─── HEADER ─── */}
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #2d1b69 100%)', padding: '28px 28px 24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -60, right: -60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', filter: 'blur(20px)' }} />
                <div style={{ position: 'absolute', bottom: -40, left: '5%', width: 100, height: 100, borderRadius: '50%', background: 'rgba(201,162,39,0.08)', filter: 'blur(15px)' }} />

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.25)', color: 'var(--gold-light)', padding: '4px 12px', borderRadius: 20, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  <FiPlus size={10} /> Yeni İlan
                </div>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-heading)' }}>İlan Oluştur</h3>
                <p style={{ margin: '6px 0 0 0', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  Ürününüzü showcase eden zengin bir ilan sayfası oluşturun
                </p>
                <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', width: 32, height: 32, borderRadius: '50%', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  <FiX size={16} />
                </button>
              </div>

              {/* ─── STEP TRACKER ─── */}
              <div style={{ padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 16, left: 16, right: 16, height: 2, background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
                  <div style={{ position: 'absolute', top: 16, left: 16, width: `${((modalStep - 1) / (STEPS.length - 1)) * 86}%`, height: 2, background: 'linear-gradient(90deg, #0284c7, #7c3aed)', zIndex: 2, transition: 'width 0.4s ease' }} />
                  {STEPS.map((s) => {
                    const Icon = s.icon;
                    const done = modalStep > s.id;
                    const active = modalStep === s.id;
                    return (
                      <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, cursor: done ? 'pointer' : 'default' }} onClick={() => done && setModalStep(s.id)}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? 'linear-gradient(135deg,#0284c7,#7c3aed)' : active ? 'var(--bg-dark)' : 'rgba(255,255,255,0.04)', border: active ? '2px solid #7c3aed' : done ? 'none' : '2px solid rgba(255,255,255,0.06)', color: done ? '#fff' : active ? '#7c3aed' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: active ? '0 0 12px rgba(124,58,237,0.4)' : 'none', transition: 'all 0.3s' }}>
                          {done ? <FiCheck size={15} /> : <Icon size={15} />}
                        </div>
                        <span style={{ fontSize: 10, color: active ? '#fff' : 'var(--text-muted)', fontWeight: active ? '700' : 'normal', marginTop: 5, whiteSpace: 'nowrap' }}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ─── FORM BODY ─── */}
              <form onSubmit={handleAdd}>
                <div style={{ padding: '24px 28px' }}>
                  <AnimatePresence mode="wait">

                    {/* ── STEP 1: GENEL ── */}
                    {modalStep === 1 && (
                      <motion.div key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                        <SectionBlock icon={FiTag} title="Başlık & Tanıtım" sub="İlanın ana başlığı ve kısa açıklaması">
                          <FieldInput label="Başlık *" value={form.title} onChange={set('title')} placeholder="Örn: Şahmeran Prime Bakır Bilezik" />
                          <FieldInput label="Alt Başlık / Slogan" value={form.subtitle} onChange={set('subtitle')} placeholder="Örn: Şahmeran'ın kadim sırrı, bileğinizde hayat buluyor..." rows={2} />
                        </SectionBlock>

                        <SectionBlock icon={FiDollarSign} title="Fiyat & Sıralama" sub="Gösterilecek fiyat ve listeleme sırası">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <FieldInput label="Fiyat (₺)" value={form.price} onChange={set('price')} type="number" placeholder="0.00" prefix="₺" />
                            <FieldInput label="Sıralama" value={form.sortOrder} onChange={set('sortOrder')} type="number" placeholder="0" />
                          </div>
                        </SectionBlock>

                        <SectionBlock icon={FiEdit2} title="CTA & Link" sub="Ziyaretçinin tıklayacağı buton ve yönlendirme">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <FieldInput label="Buton Metni" value={form.cta} onChange={set('cta')} placeholder="Keşfet" />
                            <FieldInput label="Yönlendirme URL" value={form.href} onChange={set('href')} placeholder="/urunler" />
                          </div>
                        </SectionBlock>
                      </motion.div>
                    )}

                    {/* ── STEP 2: GÖRSELLER & VİDEO ── */}
                    {modalStep === 2 && (
                      <motion.div key="s2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                        <SectionBlock icon={FiImage} title="Afiş Görselleri" sub="Masaüstü ve mobil ekranlar için görsel">
                          <UploadDropzone
                            label="Masaüstü Görseli (Geniş) *"
                            value={form.image}
                            onFile={(e) => handleImageUpload(e, 'desktop')}
                            onClear={() => setVal('image', '')}
                            uploading={uploadingImg === 'desktop'}
                            id="desktopImg"
                          />
                          <UploadDropzone
                            label="Mobil Görseli (İsteğe Bağlı)"
                            value={form.imageMobile}
                            onFile={(e) => handleImageUpload(e, 'mobile')}
                            onClear={() => setVal('imageMobile', '')}
                            uploading={uploadingImg === 'mobile'}
                            id="mobileImg"
                          />
                        </SectionBlock>

                        <SectionBlock icon={FiVideo} title="Ürün Videosu" sub="YouTube, Vimeo veya direkt video URL'si">
                          <FieldInput
                            label="Video URL (İsteğe Bağlı)"
                            value={form.videoUrl}
                            onChange={set('videoUrl')}
                            placeholder="https://youtube.com/embed/... veya .mp4 linki"
                          />
                          {form.videoUrl && (
                            <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <FiVideo size={14} style={{ color: '#f87171' }} />
                              <span style={{ color: '#f87171', fontSize: 12 }}>Video eklendi</span>
                            </div>
                          )}
                        </SectionBlock>
                      </motion.div>
                    )}

                    {/* ── STEP 3: İÇERİK ── */}
                    {modalStep === 3 && (
                      <motion.div key="s3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                        <SectionBlock icon={FiAlignLeft} title="Ana Açıklama" sub="Ürün hakkında detaylı paragraf">
                          <FieldInput
                            label="Açıklama"
                            value={form.description}
                            onChange={set('description')}
                            placeholder="Ürünün hikayesi, özellikleri ve neden özel olduğunu açıklayın..."
                            rows={4}
                          />
                        </SectionBlock>

                        <SectionBlock icon={FiEdit2} title="Alıntı Bloğu" sub="İtalik, öne çıkan alıntı metni (opsiyonel)">
                          <FieldInput
                            label="Alıntı"
                            value={form.quote}
                            onChange={set('quote')}
                            placeholder="Şahmeran'in kadim bilgeliğinden ilham alarak tasarlandı..."
                            rows={2}
                          />
                        </SectionBlock>

                        <SectionBlock icon={FiFileText} title="Ek Bölümler" sub="Başlıklı metin bölümleri ekle">
                          {form.sections.map((sec, i) => (
                            <div key={i} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <span style={{ color: 'var(--gold-light)', fontSize: 12, fontWeight: 600 }}>Bölüm {i + 1}</span>
                                <button type="button" onClick={() => removeSection(i)} style={{ background: 'rgba(224,85,148,0.1)', border: 'none', color: '#e05594', cursor: 'pointer', borderRadius: 6, padding: '4px 8px', fontSize: 11 }}>Kaldır</button>
                              </div>
                              <FieldInput label="Bölüm Başlığı" value={sec.title} onChange={e => updateSection(i, 'title', e.target.value)} placeholder="Kristal Kuvarların Önemi" />
                              <FieldInput label="Bölüm İçeriği" value={sec.body} onChange={e => updateSection(i, 'body', e.target.value)} placeholder="Açıklama metni..." rows={3} />
                            </div>
                          ))}
                          <button type="button" onClick={addSection} style={{ width: '100%', background: 'rgba(201,162,39,0.06)', border: '1px dashed rgba(201,162,39,0.25)', color: 'var(--gold-light)', borderRadius: 8, padding: '10px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <FiPlus size={14} /> Yeni Bölüm Ekle
                          </button>
                        </SectionBlock>
                      </motion.div>
                    )}

                    {/* ── STEP 4: ÖZELLİKLER ── */}
                    {modalStep === 4 && (
                      <motion.div key="s4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                        <SectionBlock icon={FiStar} title="Öne Çıkan Özellikler" sub="Fotoğraflardaki gibi madde madde özellik listesi">
                          {form.features.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                              Henüz özellik eklenmedi. Aşağıdan ekleyin.
                            </div>
                          )}
                          {form.features.map((feat, i) => (
                            <div key={i} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                <span style={{ color: 'var(--gold-light)', fontSize: 12, fontWeight: 600 }}>✦ Özellik {i + 1}</span>
                                <button type="button" onClick={() => removeFeature(i)} style={{ background: 'rgba(224,85,148,0.1)', border: 'none', color: '#e05594', cursor: 'pointer', borderRadius: 6, padding: '4px 8px', fontSize: 11 }}>Kaldır</button>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                                <FieldInput label="Özellik Adı" value={feat.title} onChange={e => updateFeature(i, 'title', e.target.value)} placeholder="Saf Bakır Gövde" />
                                <FieldInput label="Açıklama" value={feat.desc} onChange={e => updateFeature(i, 'desc', e.target.value)} placeholder="Doğal sıcak tonu ve zamanla yaşayan dokusu..." />
                              </div>
                            </div>
                          ))}
                          <button type="button" onClick={addFeature} style={{ width: '100%', background: 'rgba(201,162,39,0.06)', border: '1px dashed rgba(201,162,39,0.25)', color: 'var(--gold-light)', borderRadius: 8, padding: '10px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <FiPlus size={14} /> Yeni Özellik Ekle
                          </button>
                        </SectionBlock>
                      </motion.div>
                    )}

                    {/* ── STEP 5: TEKNİK TABLO ── */}
                    {modalStep === 5 && (
                      <motion.div key="s5" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                        <SectionBlock icon={FiGrid} title="Teknik Koleksiyon Bilgileri" sub="Ürün adı, materyal, garanti gibi tablo satırları">
                          {form.specs.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                              Henüz teknik bilgi eklenmedi.
                            </div>
                          )}
                          {form.specs.map((spec, i) => (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginBottom: 10, alignItems: 'flex-end' }}>
                              <FieldInput label={i === 0 ? 'Özellik' : undefined} value={spec.key} onChange={e => updateSpec(i, 'key', e.target.value)} placeholder="Materyal" />
                              <FieldInput label={i === 0 ? 'Değer' : undefined} value={spec.value} onChange={e => updateSpec(i, 'value', e.target.value)} placeholder="Saf Bakır" />
                              <button type="button" onClick={() => removeSpec(i)} style={{ background: 'rgba(224,85,148,0.1)', border: '1px solid rgba(224,85,148,0.2)', color: '#e05594', cursor: 'pointer', borderRadius: 8, padding: '10px 12px', fontSize: 14, marginBottom: 14 }}>
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          ))}
                          <button type="button" onClick={addSpec} style={{ width: '100%', background: 'rgba(201,162,39,0.06)', border: '1px dashed rgba(201,162,39,0.25)', color: 'var(--gold-light)', borderRadius: 8, padding: '10px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <FiPlus size={14} /> Satır Ekle
                          </button>
                        </SectionBlock>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

                {/* ─── NAVIGATION ─── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {modalStep > 1 ? (
                    <button type="button" onClick={() => setModalStep(s => s - 1)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', borderRadius: 9, padding: '10px 18px', fontSize: 13, cursor: 'pointer' }}>
                      <FiChevronLeft size={16} /> Geri
                    </button>
                  ) : (
                    <button type="button" onClick={() => setShowModal(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', borderRadius: 9, padding: '10px 18px', fontSize: 13, cursor: 'pointer' }}>
                      İptal
                    </button>
                  )}

                  {modalStep < STEPS.length ? (
                    <button type="button"
                      onClick={() => { if (validateStep(modalStep)) setModalStep(s => s + 1); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(124,58,237,0.4)' }}>
                      İleri <FiChevronRight size={16} />
                    </button>
                  ) : (
                    <button type="submit" disabled={saving}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, var(--gold-light,#c9a227), #d4891a)', color: '#000', border: 'none', borderRadius: 9, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 15px rgba(201,162,39,0.35)' }}>
                      <FiCheck size={16} /> {saving ? 'Kaydediliyor...' : 'İlanı Yayınla'}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          PREVIEW MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {previewBanner && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 3000, overflowY: 'auto', backdropFilter: 'blur(12px)' }} onClick={() => setPreviewBanner(null)}>
            <div style={{ maxWidth: 720, margin: '24px auto', padding: '0 16px 40px' }} onClick={e => e.stopPropagation()}>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.3 }}
                style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.8)' }}>

                {/* Preview close */}
                <div style={{ background: '#f8f5ef', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5dfc5' }}>
                  <span style={{ fontSize: 12, color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>İlan Önizleme</span>
                  <button onClick={() => setPreviewBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 18 }}>✕</button>
                </div>

                {/* Preview content */}
                <div style={{ padding: '40px 48px', fontFamily: 'Georgia, serif', color: '#2d2416' }}>
                  {/* Title */}
                  <h1 style={{ fontSize: 26, fontWeight: 800, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8, lineHeight: 1.3 }}>
                    {previewBanner.title}
                  </h1>
                  {previewBanner.subtitle && (
                    <p style={{ textAlign: 'center', fontStyle: 'italic', fontSize: 15, color: '#7a6545', marginBottom: 24, lineHeight: 1.6 }}>
                      "{previewBanner.subtitle}"
                    </p>
                  )}

                  {/* Price */}
                  {previewBanner.rich?.price && (
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <span style={{ background: 'linear-gradient(135deg, #c9a227, #a07820)', color: '#fff', fontSize: 22, fontWeight: 800, padding: '8px 24px', borderRadius: 12, display: 'inline-block' }}>
                        ₺{previewBanner.rich.price}
                      </span>
                    </div>
                  )}

                  {/* Main image */}
                  <img src={previewBanner.image} alt={previewBanner.title} style={{ width: '100%', borderRadius: 12, marginBottom: 28, maxHeight: 400, objectFit: 'cover' }} />

                  {/* Description */}
                  {previewBanner.rich?.description && (
                    <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 24, color: '#3a2e1a' }}>
                      {previewBanner.rich.description}
                    </p>
                  )}

                  {/* Quote */}
                  {previewBanner.rich?.quote && (
                    <blockquote style={{ borderLeft: '4px solid #c9a227', paddingLeft: 20, margin: '28px 0', fontStyle: 'italic', fontSize: 15, color: '#7a6545', lineHeight: 1.7, background: '#faf7f0', padding: '16px 20px', borderRadius: '0 8px 8px 0' }}>
                      "{previewBanner.rich.quote}"
                    </blockquote>
                  )}

                  {/* Features */}
                  {previewBanner.rich?.features?.length > 0 && (
                    <div style={{ marginBottom: 28 }}>
                      <h2 style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', borderLeft: '4px solid #c9a227', paddingLeft: 14, marginBottom: 16, color: '#2d2416' }}>
                        ÜRÜNÜN ÖNE ÇIKAN AYRICALIKLARI
                      </h2>
                      {previewBanner.rich.features.map((f, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                          <span style={{ color: '#c9a227', fontSize: 16, marginTop: 1, flexShrink: 0 }}>✦</span>
                          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>
                            <strong style={{ color: '#2d2416' }}>{f.title}:</strong>{' '}
                            <span style={{ color: '#5a4a2a' }}>{f.desc}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sections */}
                  {previewBanner.rich?.sections?.map((sec, i) => (
                    <div key={i} style={{ marginBottom: 28 }}>
                      {sec.title && <h2 style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', borderLeft: '4px solid #c9a227', paddingLeft: 14, marginBottom: 14, color: '#2d2416' }}>{sec.title}</h2>}
                      {sec.body && <p style={{ fontSize: 14, lineHeight: 1.8, color: '#3a2e1a' }}>{sec.body}</p>}
                    </div>
                  ))}

                  {/* Video */}
                  {previewBanner.rich?.videoUrl && (
                    <div style={{ marginBottom: 28 }}>
                      <div style={{ background: '#000', borderRadius: 10, overflow: 'hidden', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {previewBanner.rich.videoUrl.includes('youtube') || previewBanner.rich.videoUrl.includes('vimeo') ? (
                          <iframe src={previewBanner.rich.videoUrl} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
                        ) : (
                          <video src={previewBanner.rich.videoUrl} controls style={{ width: '100%', height: '100%' }} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Specs table */}
                  {previewBanner.rich?.specs?.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <h2 style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', borderLeft: '4px solid #c9a227', paddingLeft: 14, marginBottom: 16, color: '#2d2416' }}>
                        TEKNİK KOLEKSİYON BİLGİLERİ
                      </h2>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <tbody>
                          {previewBanner.rich.specs.map((spec, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #e5dfc5', background: i % 2 === 0 ? '#faf7f0' : '#fff' }}>
                              <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2d2416', width: '35%' }}>{spec.key}</td>
                              <td style={{ padding: '10px 14px', color: '#5a4a2a' }}>{spec.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* CTA Button */}
                  {previewBanner.cta && (
                    <div style={{ textAlign: 'center', marginTop: 32 }}>
                      <span style={{ display: 'inline-block', background: 'linear-gradient(135deg, #c9a227, #a07820)', color: '#fff', fontSize: 15, fontWeight: 700, padding: '14px 36px', borderRadius: 10 }}>
                        {previewBanner.cta}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
