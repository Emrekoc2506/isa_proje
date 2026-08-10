import { useState, useEffect, useCallback } from 'react';
import {
  FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiTag, FiImage,
  FiSliders, FiCheck, FiUploadCloud, FiChevronLeft, FiChevronRight,
  FiGrid, FiVideo, FiEdit2,
  FiEye, FiX
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import * as bannerApi from '../../../services/bannerApi';
import { uploadFile } from '../../../services/fileApi';
import { parseBannerContent } from '../../../utils/bannerContent';
import { getHardDeleteErrorMessage } from '../../../utils/apiErrorHelpers';
import styles from '../AdminPage.module.css';
import { useTheme } from '../../../context/ThemeContext';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Billboard Bilgileri & Link', icon: FiTag   },
  { id: 2, label: 'Görsel & Medya Yükleme',     icon: FiImage },
];

const EMPTY_FORM = {
  mediaType: 'image',     // 'image' | 'video'
  mediaSource: 'file',    // 'file' | 'external'
  themeMode: 'all',       // 'all' | 'light' | 'dark'
  hideTextOverlay: false,
  title: '', subtitle: '', image: '', imageDark: '', imageMobile: '', imageMobileDark: '', cta: '',
  href: '', sortOrder: '0', price: '',
  videoUrl: '', mobileVideoUrl: '',
  posterImageUrl: '', mobilePosterImageUrl: '',
  autoplay: false, loop: false, muted: false,
  description: '', quote: '',
  sections: [],
  features: [],
  specs: [],
};

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const card = {
  background: 'var(--bg-dark)',
  border: '1px solid var(--border-gold)',
  borderRadius: 12,
  padding: 20,
};

const inputStyle = {
  width: '100%',
  background: 'var(--bg-mid)',
  border: '1px solid var(--border-gold)',
  borderRadius: 8,
  color: 'var(--text-primary)',
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
  color: 'var(--text-secondary)',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const goldIconBox = {
  width: 32, height: 32, borderRadius: 8,
  background: 'rgba(201,162,39,0.15)',
  border: '1px solid var(--border-gold)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--gold-light)', flexShrink: 0,
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function SectionBlock({ icon: Icon, title, sub, children }) {
  return (
    <div style={{ ...card, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={goldIconBox}><Icon size={16} /></div>
        <div>
          <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
          {sub && <span style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</span>}
        </div>
      </div>
      {children}
    </div>
  );
}

function FieldInput({ label, value, onChange, type = 'text', placeholder = '', prefix, style = {}, rows, id }) {
  const [focused, setFocused] = useState(false);
  const commonStyle = {
    ...inputStyle,
    borderColor: focused ? 'var(--gold-light)' : 'var(--border-gold)',
    ...style,
  };
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/[^a-z0-9]/g, '')}` : undefined);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label htmlFor={inputId} style={labelStyle}>{label}</label>}
      {prefix ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ ...commonStyle, width: 'auto', borderRight: 'none', borderRadius: '8px 0 0 8px', color: 'var(--gold-light)', padding: '10px 10px', minWidth: 32 }}>{prefix}</span>
          <input
            id={inputId}
            type={type} value={value} onChange={onChange} placeholder={placeholder}
            style={{ ...commonStyle, borderRadius: '0 8px 8px 0', flex: 1 }}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          />
        </div>
      ) : rows ? (
        <textarea
          id={inputId}
          value={value} onChange={onChange} placeholder={placeholder} rows={rows}
          style={{ ...commonStyle, resize: 'vertical', lineHeight: 1.5 }}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        />
      ) : (
        <input
          id={inputId}
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
          onClick={() => !uploading && document.getElementById(id)?.click()}
          style={{
            border: '2px dashed var(--border-gold)', borderRadius: 10,
            padding: '24px 16px', textAlign: 'center',
            background: 'var(--bg-mid)', cursor: uploading ? 'not-allowed' : 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            position: 'relative', transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => !uploading && (e.currentTarget.style.borderColor = 'var(--gold-light)')}
          onMouseLeave={e => !uploading && (e.currentTarget.style.borderColor = 'var(--border-gold)')}
        >
          <input id={id} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} disabled={uploading} />
          <FiUploadCloud size={24} style={{ color: 'var(--gold-light)' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: '600' }}>
            {uploading ? 'Yükleniyor...' : 'Görsel yüklemek için tıklayın'}
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 11, opacity: 0.7 }}>PNG, JPG, WEBP — Maks. 10 MB</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-mid)', border: '1px solid var(--border-gold)', borderRadius: 10, padding: 10 }}>
          <img src={value} alt="Yüklenen" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
          <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
          <button type="button" onClick={onClear} style={{ background: 'rgba(224,85,148,0.15)', border: 'none', color: '#e05594', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Kaldır</button>
        </div>
      )}
    </div>
  );
}

function VideoUploadDropzone({ label, value, onFile, onClear, uploading, progress, id, accept = ".mp4,.webm,video/mp4,video/webm" }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={labelStyle}>{label}</label>}
      {!value ? (
        <div
          onClick={() => !uploading && document.getElementById(id)?.click()}
          style={{
            border: '2px dashed var(--border-gold)', borderRadius: 10,
            padding: '24px 16px', textAlign: 'center',
            background: 'var(--bg-mid)', cursor: uploading ? 'not-allowed' : 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            position: 'relative', transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => !uploading && (e.currentTarget.style.borderColor = 'var(--gold-light)')}
          onMouseLeave={e => !uploading && (e.currentTarget.style.borderColor = 'var(--border-gold)')}
        >
          <input id={id} type="file" accept={accept} onChange={onFile} style={{ display: 'none' }} disabled={uploading} />
          <FiVideo size={24} style={{ color: 'var(--gold-light)' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: '600' }}>
            {uploading ? `Video Yükleniyor (%${progress || 0})...` : 'Video yüklemek için tıklayın (MP4/WebM max 100MB)'}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-mid)', border: '1px solid var(--border-gold)', borderRadius: 10, padding: 10 }}>
          <FiVideo size={24} style={{ color: '#2ecc71' }} />
          <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✓ Video Yüklendi ({value})</span>
          <button type="button" onClick={onClear} style={{ background: 'rgba(224,85,148,0.15)', border: 'none', color: '#e05594', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Kaldır</button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function BannersSection() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  // Rich content stored locally keyed by banner ID
  const [richContent, setRichContent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bannerRichContent') || '{}'); }
    catch { return {}; }
  });

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [modalStep, setModalStep] = useState(1);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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

  const openCreateModal = () => {
    setModalMode('create');
    setEditingBannerId(null);
    setForm({ ...EMPTY_FORM });
    setModalStep(1);
    setUploadError(null);
    setUploadProgress(null);
    setUploadingVideo(false);
    setShowModal(true);
  };

  const openEditModal = (b) => {
    const parsed = parseBannerContent(b.contentJson);
    setModalMode('edit');
    setEditingBannerId(b.id);
    setForm({
      mediaType: b.mediaType || parsed.mediaType || 'image',
      mediaSource: parsed.mediaSource || 'file',
      themeMode: parsed.themeMode || 'all',
      hideTextOverlay: Boolean(parsed.hideTextOverlay),
      title: b.title || '',
      subtitle: b.subtitle || '',
      image: b.image || b.imageUrl || '',
      imageDark: parsed.imageDark || '',
      imageMobile: b.imageMobile || parsed.mobilePosterImageUrl || '',
      imageMobileDark: parsed.imageMobileDark || '',
      cta: b.cta || '',
      href: b.href || b.linkUrl || '',
      sortOrder: String(b.sortOrder ?? 0),
      price: b.price != null ? String(b.price) : '',
      videoUrl: b.videoUrl || parsed.videoUrl || '',
      mobileVideoUrl: b.mobileVideoUrl || parsed.mobileVideoUrl || '',
      posterImageUrl: parsed.posterImageUrl || '',
      mobilePosterImageUrl: parsed.mobilePosterImageUrl || '',
      autoplay: Boolean(parsed.autoplay),
      loop: Boolean(parsed.loop),
      muted: Boolean(parsed.muted),
      description: parsed.description || '',
      quote: parsed.quote || '',
      sections: parsed.sections || [],
      features: parsed.features || [],
      specs: parsed.specs || [],
    });
    setModalStep(1);
    setUploadError(null);
    setUploadProgress(null);
    setUploadingVideo(false);
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
      if (resp?.url) {
        if (type === 'desktop') setVal('image', resp.url);
        else if (type === 'desktopDark') setVal('imageDark', resp.url);
        else if (type === 'mobile') setVal('imageMobile', resp.url);
        else if (type === 'mobileDark') setVal('imageMobileDark', resp.url);
        else if (type === 'poster') { setVal('posterImageUrl', resp.url); setVal('image', resp.url); }
        else if (type === 'mobilePoster') { setVal('mobilePosterImageUrl', resp.url); setVal('imageMobile', resp.url); }
      }
    } catch (err) { alert('Görsel yüklenemedi: ' + err.message); }
    finally { setUploadingImg(false); }
  };

  // ── Video upload ─────────────────────────────────────────────────────────────
  const handleVideoUpload = async (e, targetField = 'videoUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isMp4 = fileName.endsWith('.mp4') || file.type === 'video/mp4';
    const isWebm = fileName.endsWith('.webm') || file.type === 'video/webm';

    if (!isMp4 && !isWebm) {
      const errorMsg = "Yalnızca MP4 veya WebM video yükleyebilirsiniz.";
      setUploadError(errorMsg);
      alert(errorMsg);
      e.target.value = '';
      return;
    }

    const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
    if (file.size > MAX_SIZE) {
      const errorMsg = "Video boyutu en fazla 100 MB olabilir.";
      setUploadError(errorMsg);
      alert(errorMsg);
      e.target.value = '';
      return;
    }

    setUploadError(null);
    setUploadingVideo(targetField);
    setUploadProgress(0);

    try {
      const resp = await uploadFile(file, 'BannerVideo', null, (percent) => {
        setUploadProgress(percent);
      });

      if (resp?.url) {
        setVal(targetField, resp.url);
        setUploadError(null);
      } else {
        throw new Error("Video adresi alınamadı.");
      }
    } catch (err) {
      const msg = err.message || "Video yükleme başarısız.";
      setUploadError(msg);
      alert("Video yüklenemedi: " + msg);
      setVal(targetField, '');
    } finally {
      setUploadingVideo(false);
      setUploadProgress(null);
      if (e.target) e.target.value = '';
    }
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
    if (uploadingVideo || uploadingImg) {
      alert('Lütfen dosya yüklemesinin tamamlanmasını bekleyin.');
      return;
    }
    if (uploadError) {
      alert('Video yükleme başarısız olduğu için banner kaydedilemez.');
      return;
    }
    if (form.mediaType === 'video' && !form.videoUrl) {
      alert('Lütfen video dosyası yükleyin veya video URL girin.');
      return;
    }
    if (form.mediaType === 'image' && !form.image && !form.imageDark) {
      alert('Lütfen masaüstü görseli yükleyin.');
      return;
    }

    setSaving(true);
    try {
      const posterImg = form.posterImageUrl || form.image || form.mobilePosterImageUrl || form.imageMobile || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80";
      const mobPosterImg = form.mobilePosterImageUrl || form.imageMobile || posterImg;

      const content = {
        themeMode: form.themeMode || "all",
        imageDark: form.imageDark ? form.imageDark.trim() : "",
        imageMobileDark: form.imageMobileDark ? form.imageMobileDark.trim() : "",
        hideTextOverlay: Boolean(form.hideTextOverlay),
        mediaType: form.mediaType,
        mediaSource: form.mediaSource,
        videoUrl: form.videoUrl ? form.videoUrl.trim() : "",
        mobileVideoUrl: form.mobileVideoUrl ? form.mobileVideoUrl.trim() : "",
        posterImageUrl: posterImg,
        mobilePosterImageUrl: mobPosterImg,
        autoplay: Boolean(form.autoplay),
        loop: Boolean(form.loop),
        muted: Boolean(form.muted || form.autoplay),
        quote: form.quote ? form.quote.trim() : "",
        description: form.description ? form.description.trim() : "",
        features: form.features.map(item => ({
          title: item.title ? item.title.trim() : "",
          description: item.description ? item.description.trim() : (item.desc ? item.desc.trim() : "")
        })),
        specs: form.specs.map(item => ({
          key: item.key ? item.key.trim() : "",
          value: item.value ? item.value.trim() : ""
        })),
        sections: form.sections.map(item => ({
          title: item.title ? item.title.trim() : "",
          body: item.body ? item.body.trim() : ""
        }))
      };

      const bannerPayload = {
        title: form.title.trim(),
        subtitle: form.subtitle ? form.subtitle.trim() : null,
        image: posterImg,
        imageMobile: mobPosterImg,
        cta: form.cta ? form.cta.trim() : 'Keşfet',
        href: form.href ? form.href.trim() : '/urunler',
        sortOrder: Number(form.sortOrder) || 0,
        isActive: true,
        price: form.price === "" || form.price == null ? null : Number(form.price),
        videoUrl: form.videoUrl ? form.videoUrl.trim() : null,
        contentJson: JSON.stringify(content)
      };

      let created;
      if (modalMode === 'edit' && editingBannerId) {
        created = await bannerApi.updateAdminBanner(editingBannerId, {
          id: editingBannerId,
          ...bannerPayload
        });
      } else {
        created = await bannerApi.createAdminBanner(bannerPayload);
      }

      // Save rich content locally as fallback
      const id = created?.id || `local_${Date.now()}`;
      saveRich(id, {
        price: form.price,
        mediaType: form.mediaType,
        videoUrl: form.videoUrl,
        mobileVideoUrl: form.mobileVideoUrl,
        posterImageUrl: posterImg,
        mobilePosterImageUrl: mobPosterImg,
        autoplay: form.autoplay,
        loop: form.loop,
        muted: form.muted,
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
    if (step === 2) {
      if (uploadingVideo || uploadingImg) {
        alert('Lütfen dosya yüklemesinin tamamlanmasını bekleyin.');
        return false;
      }
      if (form.mediaType === 'video' && !form.videoUrl) {
        alert('Lütfen video dosyası yükleyin veya video URL girin.');
        return false;
      }
      if (form.mediaType === 'image' && !form.image) {
        alert('Lütfen masaüstü görseli yükleyin.');
        return false;
      }
    }
    return true;
  };

  // ── Toggle / Delete ───────────────────────────────────────────────────────────
  const handleToggleStatus = async (id, current) => {
    try { await bannerApi.updateAdminBannerStatus(id, !current); fetchBanners(); }
    catch (err) { alert('Durum güncellenemedi: ' + err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu ilan ve ona ait kullanılmayan yerel dosyalar kalıcı olarak silinecektir. Bu işlem geri alınamaz. Devam etmek istediğinize emin misiniz?")) {
      return;
    }
    if (deletingId) return;

    setDeletingId(id);
    try {
      await bannerApi.deleteAdminBanner(id);
      
      const copy = { ...richContent };
      delete copy[id];
      setRichContent(copy);
      localStorage.setItem('bannerRichContent', JSON.stringify(copy));

      fetchBanners();
      alert("İlan başarıyla silindi.");
    } catch (err) {
      alert(getHardDeleteErrorMessage(err, "İlan"));
    } finally {
      setDeletingId(null);
    }
  };

  // ── Preview modal ─────────────────────────────────────────────────────────────
  const getBannerRich = (b) => {
    if (b?.contentJson || b?.price != null || b?.videoUrl) {
      const parsed = parseBannerContent(b.contentJson);
      return {
        ...parsed,
        price: b.price != null ? b.price : (richContent[b.id]?.price || ''),
        videoUrl: b.videoUrl || (richContent[b.id]?.videoUrl || '')
      };
    }
    return richContent[b.id] || parseBannerContent(null);
  };

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
            Billboard Yönetimi
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0 0' }}>
            {banners.length} görsel • Ana sayfa billboard (slider) alanında yayınlanacak içerikler
          </p>
        </div>
        <button
          onClick={openCreateModal}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #c9a227, #967412)', color: '#ffffff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 15px rgba(201,162,39,0.35)' }}
        >
          <FiPlus size={16} style={{ color: '#ffffff' }} />
          <span style={{ color: '#ffffff' }}>Yeni Billboard Ekle</span>
        </button>
      </div>

      {/* ── BANNERS GRID ── */}
      {banners.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', ...card }}>
          <FiImage size={40} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>Henüz billboard görseli eklenmemiştir.</p>
          <button onClick={openCreateModal} style={{ marginTop: 16, background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.3)', color: 'var(--gold-light)', borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer' }}>
            İlk Billboard Görselini Oluştur
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
                  <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{b.title || 'Başlıksız Billboard'}</h4>
                  {b.subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0, lineHeight: 1.4 }}>{b.subtitle}</p>}

                  {/* Rich content badges */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {rich.features?.length > 0 && <span style={{ fontSize: 10, background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)', color: '#818cf8', padding: '2px 8px', borderRadius: 10 }}>✦ {rich.features.length} Özellik</span>}
                    {rich.specs?.length > 0 && <span style={{ fontSize: 10, background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#22d3ee', padding: '2px 8px', borderRadius: 10 }}>⊞ {rich.specs.length} Teknik</span>}
                    {rich.videoUrl && <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '2px 8px', borderRadius: 10 }}>▶ Video</span>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button onClick={() => openEditModal(b)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.3)', color: 'var(--gold-light)', borderRadius: 7, padding: '7px 0', fontSize: 11, fontWeight: '700', cursor: 'pointer' }}>
                      <FiEdit2 size={13} /> Düzenle
                    </button>
                    <button onClick={() => setPreviewBanner({ ...b, rich })} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', borderRadius: 7, padding: '7px 0', fontSize: 11, cursor: 'pointer' }}>
                      <FiEye size={13} /> Önizle
                    </button>
                    <button onClick={() => handleToggleStatus(b.id, b.isActive)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: b.isActive ? 'rgba(46,204,113,0.07)' : 'rgba(255,255,255,0.04)', border: `1px solid ${b.isActive ? 'rgba(46,204,113,0.2)' : 'rgba(255,255,255,0.06)'}`, color: b.isActive ? '#2ecc71' : 'var(--text-muted)', borderRadius: 7, padding: '7px 0', fontSize: 11, cursor: 'pointer' }}>
                      {b.isActive ? <FiToggleRight size={13} /> : <FiToggleLeft size={13} />}
                      {b.isActive ? 'Aktif' : 'Pasif'}
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={deletingId === b.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        background: 'rgba(224,85,148,0.07)',
                        border: '1px solid rgba(224,85,148,0.2)',
                        color: '#e05594',
                        borderRadius: 7,
                        padding: '7px 12px',
                        fontSize: 12,
                        cursor: deletingId === b.id ? 'not-allowed' : 'pointer',
                        opacity: deletingId === b.id ? 0.5 : 1
                      }}
                      title={deletingId === b.id ? "Siliniyor..." : "Sil"}
                    >
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
              style={{
                width: '100%',
                maxWidth: 860,
                margin: '24px auto',
                background: 'var(--bg-dark, #12091F)',
                border: '1px solid rgba(201,162,39,0.25)',
                borderRadius: 18,
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                overflow: 'hidden'
              }}
            >
              {/* ─── HEADER (GECE/GÜNDÜZ TEMALI HAREKETLİ ARKA PLAN) ─── */}
              <div
                style={{
                  background: isLight
                    ? 'linear-gradient(180deg, #4bbfe8 0%, #62cff0 40%, #7dd9f5 100%)'
                    : 'linear-gradient(180deg, rgba(18, 9, 31, 0.97), rgba(10, 5, 18, 0.97))',
                  padding: '28px 32px 24px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* GECE MODU ANİMASYONLARI (Ay + Yıldızlar) */}
                {!isLight && (
                  <>
                    <div className={styles.sidebarMoon} style={{ top: 12, right: 65, transform: 'scale(0.8)' }}>
                      <div className={styles.sidebarMoonHole} style={{ width: 8, height: 8, top: 12, left: 6 }} />
                      <div className={styles.sidebarMoonHole} style={{ width: 5, height: 5, top: 22, left: 16 }} />
                    </div>
                    {[...Array(12)].map((_, i) => (
                      <svg
                        key={i}
                        className={styles.sidebarStar}
                        viewBox="0 0 20 20"
                        style={{
                          top: `${Math.floor((i * 37 + 11) % 85)}%`,
                          left: `${Math.floor((i * 53 + 7) % 85)}%`,
                          width: `${8 + (i % 4) * 3}px`,
                          animationDelay: `${(i * 0.35).toFixed(2)}s`,
                          animationDuration: `${2 + (i % 3) * 0.5}s`
                        }}
                      >
                        <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
                      </svg>
                    ))}
                  </>
                )}

                {/* GÜNDÜZ MODU ANİMASYONLARI (Güneş + Süzülen Bulutlar) */}
                {isLight && (
                  <>
                    <div className={styles.sidebarSun} style={{ top: 10, right: 65, transform: 'scale(0.85)' }} />
                    <div className={styles.sidebarCloudShape} style={{ top: '0%', left: '-15px', animationDuration: '8s', transform: 'scale(0.65)' }}>
                      <div className={styles.sidebarCloudBase} />
                      <div className={styles.sidebarCloudBump1} />
                      <div className={styles.sidebarCloudBump2} />
                      <div className={styles.sidebarCloudBump3} />
                    </div>
                    <div className={styles.sidebarCloudShape} style={{ top: '25%', left: '35%', animationDuration: '10s', animationDelay: '2s', transform: 'scale(0.5)' }}>
                      <div className={styles.sidebarCloudBase} />
                      <div className={styles.sidebarCloudBump1} />
                      <div className={styles.sidebarCloudBump2} />
                      <div className={styles.sidebarCloudBump3} />
                    </div>
                  </>
                )}

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    background: isLight ? 'rgba(255, 255, 255, 0.25)' : 'rgba(201,162,39,0.2)',
                    border: isLight ? '1px solid rgba(255, 255, 255, 0.45)' : '1px solid rgba(201,162,39,0.4)',
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 12,
                    position: 'relative',
                    zIndex: 2
                  }}
                >
                  {modalMode === 'edit' ? <FiEdit2 size={11} /> : <FiPlus size={11} />} {modalMode === 'edit' ? 'Billboard Düzenle' : 'Yeni Billboard'}
                </div>

                <h3
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    position: 'relative',
                    zIndex: 2
                  }}
                >
                  <span style={{ color: '#ffffff', textShadow: isLight ? '0 1px 3px rgba(0,70,130,0.35)' : '0 1px 4px rgba(0,0,0,0.5)' }}>
                    {modalMode === 'edit' ? 'Billboard İlanını Düzenle' : 'Billboard Görseli Ekle'}
                  </span>
                </h3>

                <p
                  style={{
                    margin: '6px 0 0 0',
                    fontSize: 13,
                    color: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(237,224,200,0.85)',
                    lineHeight: 1.5,
                    textShadow: isLight ? '0 1px 2px rgba(0,70,130,0.2)' : 'none',
                    position: 'relative',
                    zIndex: 2
                  }}
                >
                  Ana sayfa billboard slider alanında öne çıkacak görsel ve yönlendirme bilgilerini oluşturun
                </p>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    position: 'absolute',
                    top: 18,
                    right: 18,
                    background: isLight ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                    border: isLight ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.25)',
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    zIndex: 10,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* ─── STEP TRACKER ─── */}
              <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border-gold)', background: 'var(--bg-dark)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', position: 'relative' }}>
                  {STEPS.map((s) => {
                    const Icon = s.icon;
                    const done = modalStep > s.id;
                    const active = modalStep === s.id;
                    return (
                      <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, cursor: done ? 'pointer' : 'default' }} onClick={() => done && setModalStep(s.id)}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: done ? 'linear-gradient(135deg,#0284c7,#7c3aed)' : active ? 'var(--bg-mid)' : 'var(--bg-dark)', border: active ? '2px solid var(--gold-light)' : done ? 'none' : '1px solid var(--border-gold)', color: done ? '#fff' : active ? 'var(--gold-light)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: active ? '0 0 12px rgba(201,162,39,0.3)' : 'none', transition: 'all 0.3s' }}>
                          {done ? <FiCheck size={16} /> : <Icon size={16} />}
                        </div>
                        <span style={{ fontSize: 11, color: active ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: active ? '700' : 'normal', marginTop: 6, whiteSpace: 'nowrap' }}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ─── FORM BODY ─── */}
              <form onSubmit={handleAdd}>
                <div style={{ padding: '24px 28px', background: 'var(--bg-dark)' }}>
                  <AnimatePresence mode="wait">

                    {/* ── STEP 1: GENEL BİLGİLER & LİNK ── */}
                    {modalStep === 1 && (
                      <motion.div key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                        <SectionBlock icon={FiTag} title="Başlık & Slogan" sub="Billboard üzerinde görünecek ana başlık ve metinler">
                          <FieldInput id="bannerTitle" label="Başlık *" value={form.title} onChange={set('title')} placeholder="Örn: Şahmeran Prime Koleksiyonu" />
                          <FieldInput label="Alt Başlık / Slogan" value={form.subtitle} onChange={set('subtitle')} placeholder="Örn: Kadim zarafet ve el işçiliğinin buluştuğu özel parçalar..." rows={2} />
                          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, padding: '8px 12px', background: 'rgba(201,162,39,0.08)', borderRadius: 8, border: '1px solid rgba(201,162,39,0.2)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={form.hideTextOverlay}
                              onChange={(e) => setVal('hideTextOverlay', e.target.checked)}
                              style={{ width: 16, height: 16, accentColor: 'var(--gold)' }}
                            />
                            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: '600' }}>
                              🖼️ Görselin üzerinde zaten yazı var (Afiş üzerine HTML metin yazılmasın)
                            </span>
                          </label>
                        </SectionBlock>

                        <SectionBlock icon={FiEdit2} title="Buton & Yönlendirme" sub="Ziyaretçinin tıklayacağı buton ve hedef link">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <FieldInput label="Buton Metni (CTA)" value={form.cta} onChange={set('cta')} placeholder="Koleksiyonu Keşfet" />
                            <FieldInput label="Yönlendirme URL" value={form.href} onChange={set('href')} placeholder="/kategori/gumus-kolyeler" />
                          </div>
                        </SectionBlock>

                        <SectionBlock icon={FiGrid} title="Görünüm Sıralaması" sub="Slider içindeki geçiş sırası">
                          <FieldInput label="Sıralama (0, 1, 2...)" value={form.sortOrder} onChange={set('sortOrder')} type="number" placeholder="0" />
                        </SectionBlock>
                      </motion.div>
                    )}

                    {/* ── STEP 2: GÖRSEL & MEDYA YÜKLEME ── */}
                    {modalStep === 2 && (
                      <motion.div key="s2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                        
                        {/* Medya Türü Seçimi */}
                        <SectionBlock icon={FiSliders} title="Medya Türü" sub="Billboard alanında gösterilecek içerik tipi">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                            <button
                              type="button"
                              aria-label="Görsel"
                              onClick={() => setVal('mediaType', 'image')}
                              style={{
                                padding: '12px',
                                borderRadius: 8,
                                border: form.mediaType === 'image' ? '2px solid var(--gold-light)' : '1px solid var(--border-gold)',
                                background: form.mediaType === 'image' ? 'rgba(201,162,39,0.15)' : 'var(--bg-mid)',
                                color: form.mediaType === 'image' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                              }}
                            >
                              <FiImage size={18} /> Görsel
                            </button>
                            <button
                              type="button"
                              aria-label="Video"
                              onClick={() => setVal('mediaType', 'video')}
                              style={{
                                padding: '12px',
                                borderRadius: 8,
                                border: form.mediaType === 'video' ? '2px solid var(--gold-light)' : '1px solid var(--border-gold)',
                                background: form.mediaType === 'video' ? 'rgba(201,162,39,0.15)' : 'var(--bg-mid)',
                                color: form.mediaType === 'video' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                              }}
                            >
                              <FiVideo size={18} /> Video
                            </button>
                          </div>
                        </SectionBlock>

                        {/* Görünürlük Hedefi (Sadece Gündüz / Sadece Gece / Her İki Tema) */}
                        <SectionBlock icon={FiEye} title="Görünürlük Hedefi" sub="Bu billboard hangi tema aktifken sitede gösterilsin?">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 8 }}>
                            <label style={{
                              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8,
                              background: form.themeMode === 'all' ? 'rgba(201,162,39,0.18)' : 'var(--bg-mid)',
                              border: form.themeMode === 'all' ? '2px solid var(--gold-light)' : '1px solid var(--border-gold)',
                              color: form.themeMode === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                              fontWeight: 'bold', fontSize: 13, cursor: 'pointer'
                            }}>
                              <input type="radio" name="themeMode" checked={form.themeMode === 'all'} onChange={() => setVal('themeMode', 'all')} />
                              🌟 Hem Gece Hem Gündüz
                            </label>

                            <label style={{
                              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8,
                              background: form.themeMode === 'light' ? 'rgba(2,132,199,0.18)' : 'var(--bg-mid)',
                              border: form.themeMode === 'light' ? '2px solid #0284c7' : '1px solid var(--border-gold)',
                              color: form.themeMode === 'light' ? 'var(--text-primary)' : 'var(--text-secondary)',
                              fontWeight: 'bold', fontSize: 13, cursor: 'pointer'
                            }}>
                              <input type="radio" name="themeMode" checked={form.themeMode === 'light'} onChange={() => setVal('themeMode', 'light')} />
                              ☀️ Sadece Gündüz Modunda
                            </label>

                            <label style={{
                              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8,
                              background: form.themeMode === 'dark' ? 'rgba(124,58,237,0.18)' : 'var(--bg-mid)',
                              border: form.themeMode === 'dark' ? '2px solid #7c3aed' : '1px solid var(--border-gold)',
                              color: form.themeMode === 'dark' ? 'var(--text-primary)' : 'var(--text-secondary)',
                              fontWeight: 'bold', fontSize: 13, cursor: 'pointer'
                            }}>
                              <input type="radio" name="themeMode" checked={form.themeMode === 'dark'} onChange={() => setVal('themeMode', 'dark')} />
                              🌙 Sadece Gece Modunda
                            </label>
                          </div>
                        </SectionBlock>

                        {form.mediaType === 'image' ? (
                          <>
                            {/* GÜNDÜZ GÖRSELİ (themeMode 'all' veya 'light' ise gösterilir) */}
                            {(form.themeMode === 'all' || form.themeMode === 'light') && (
                              <SectionBlock icon={FiImage} title="☀️ Gündüz Modu Görselleri (Açık Tema)" sub={form.themeMode === 'light' ? "Yalnızca Gündüz teması aktifken slaytta gösterilir." : "Gündüz modunda gösterilir. Gece görseli yüklenmezse her iki temada da bu görsel kullanılır."}>
                                <UploadDropzone
                                  label="☀️ Gündüz Masaüstü Görseli (1920x840 px Önerilir) *"
                                  value={form.image}
                                  onFile={(e) => handleImageUpload(e, 'desktop')}
                                  onClear={() => setVal('image', '')}
                                  uploading={uploadingImg === 'desktop'}
                                  id="desktopImg"
                                />
                                <UploadDropzone
                                  label="📱 Gündüz Mobil Görseli (İsteğe Bağlı - 800x600 px)"
                                  value={form.imageMobile}
                                  onFile={(e) => handleImageUpload(e, 'mobile')}
                                  onClear={() => setVal('imageMobile', '')}
                                  uploading={uploadingImg === 'mobile'}
                                  id="mobileImg"
                                />
                              </SectionBlock>
                            )}

                            {/* GECE GÖRSELİ (themeMode 'all' veya 'dark' ise gösterilir) */}
                            {(form.themeMode === 'all' || form.themeMode === 'dark') && (
                              <SectionBlock icon={FiImage} title="🌙 Gece Modu Görselleri (Karanlık Tema)" sub={form.themeMode === 'dark' ? "Yalnızca Gece teması aktifken slaytta gösterilir." : "Gece modunda farklı bir görsel göstermek isterseniz buraya yükleyin (Boş bırakılırsa Gündüz görseli kullanılır)."}>
                                <UploadDropzone
                                  label="🌙 Gece Masaüstü Görseli (1920x840 px Önerilir)"
                                  value={form.themeMode === 'dark' ? (form.imageDark || form.image) : form.imageDark}
                                  onFile={(e) => handleImageUpload(e, form.themeMode === 'dark' ? 'desktop' : 'desktopDark')}
                                  onClear={() => { setVal('imageDark', ''); if (form.themeMode === 'dark') setVal('image', ''); }}
                                  uploading={uploadingImg === (form.themeMode === 'dark' ? 'desktop' : 'desktopDark')}
                                  id="desktopDarkImg"
                                />
                                <UploadDropzone
                                  label="📱 Gece Mobil Görseli (İsteğe Bağlı - 800x600 px)"
                                  value={form.themeMode === 'dark' ? (form.imageMobileDark || form.imageMobile) : form.imageMobileDark}
                                  onFile={(e) => handleImageUpload(e, form.themeMode === 'dark' ? 'mobile' : 'mobileDark')}
                                  onClear={() => { setVal('imageMobileDark', ''); if (form.themeMode === 'dark') setVal('imageMobile', ''); }}
                                  uploading={uploadingImg === (form.themeMode === 'dark' ? 'mobile' : 'mobileDark')}
                                  id="mobileDarkImg"
                                />
                              </SectionBlock>
                            )}
                          </>
                        ) : (
                          <>
                            <SectionBlock icon={FiVideo} title="Video Yükleme & Kaynak" sub="Slider arkasında oynatılacak video">
                              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
                                  <input
                                    type="radio"
                                    name="mediaSource"
                                    checked={form.mediaSource === 'file'}
                                    onChange={() => setVal('mediaSource', 'file')}
                                  />
                                  Dosya Yükle (.mp4, .webm)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
                                  <input
                                    type="radio"
                                    name="mediaSource"
                                    checked={form.mediaSource === 'external'}
                                    onChange={() => setVal('mediaSource', 'external')}
                                  />
                                  Harici Video URL
                                </label>
                              </div>

                              {form.mediaSource === 'file' ? (
                                <>
                                  <VideoUploadDropzone
                                    label="Video Dosyası (MP4 / WebM — Max 100 MB) *"
                                    value={form.videoUrl}
                                    onFile={(e) => handleVideoUpload(e, 'videoUrl')}
                                    onClear={() => setVal('videoUrl', '')}
                                    uploading={uploadingVideo === 'videoUrl'}
                                    progress={uploadProgress}
                                    id="videoFile"
                                    accept=".mp4,.webm,video/mp4,video/webm"
                                  />
                                  <VideoUploadDropzone
                                    label="Mobil Video Dosyası (İsteğe Bağlı)"
                                    value={form.mobileVideoUrl}
                                    onFile={(e) => handleVideoUpload(e, 'mobileVideoUrl')}
                                    onClear={() => setVal('mobileVideoUrl', '')}
                                    uploading={uploadingVideo === 'mobileVideoUrl'}
                                    progress={uploadProgress}
                                    id="mobileVideoFile"
                                    accept=".mp4,.webm,video/mp4,video/webm"
                                  />
                                </>
                              ) : (
                                <FieldInput
                                  label="Harici Video URL *"
                                  value={form.videoUrl}
                                  onChange={set('videoUrl')}
                                  placeholder="https://youtube.com/embed/... veya direct .mp4 linki"
                                />
                              )}
                            </SectionBlock>

                            <SectionBlock icon={FiImage} title="Kapak Görseli (Poster)" sub="Video yüklenene kadar gösterilecek kapak">
                              <UploadDropzone
                                label="Kapak Görseli (Poster) *"
                                value={form.posterImageUrl || form.image}
                                onFile={(e) => handleImageUpload(e, 'poster')}
                                onClear={() => { setVal('posterImageUrl', ''); setVal('image', ''); }}
                                uploading={uploadingImg === 'poster'}
                                id="posterImg"
                              />
                            </SectionBlock>
                          </>
                        )}

                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

                {/* ─── NAVIGATION ─── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '16px 28px', borderTop: '1px solid var(--border-gold)', background: 'var(--bg-mid)' }}>
                  {modalStep > 1 ? (
                    <button type="button" onClick={() => setModalStep(s => s - 1)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-dark)', border: '1px solid var(--border-gold)', color: 'var(--text-primary)', borderRadius: 9, padding: '10px 18px', fontSize: 13, cursor: 'pointer' }}>
                      <FiChevronLeft size={16} /> Geri
                    </button>
                  ) : (
                    <button type="button" onClick={() => setShowModal(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-dark)', border: '1px solid var(--border-gold)', color: 'var(--text-secondary)', borderRadius: 9, padding: '10px 18px', fontSize: 13, cursor: 'pointer' }}>
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
                      <FiCheck size={16} /> {saving ? 'Kaydediliyor...' : 'Billboard Yayınla'}
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
            <div style={{ maxWidth: 780, margin: '24px auto', padding: '0 16px 40px' }} onClick={e => e.stopPropagation()}>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.3 }}
                style={{ background: '#12091f', border: '1px solid rgba(201,162,39,0.4)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.95)' }}>

                {/* Preview close */}
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(201,162,39,0.2)' }}>
                  <span style={{ fontSize: 13, color: '#f5d680', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✦ Billboard Önizleme</span>
                  <button onClick={() => setPreviewBanner(null)} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>

                {/* Preview content */}
                <div style={{ padding: '32px 36px', color: '#f3f4f6' }}>
                  {/* Title & Subtitle (Yalnızca metin gizleme kapalıysa veya başlık varsa gösterilir) */}
                  {!previewBanner.rich?.hideTextOverlay && (previewBanner.title || previewBanner.subtitle) && (
                    <>
                      {previewBanner.title && (
                        <h1 style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', color: '#ffd700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8, lineHeight: 1.3, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                          {previewBanner.title}
                        </h1>
                      )}
                      {previewBanner.subtitle && (
                        <p style={{ textAlign: 'center', fontStyle: 'italic', fontSize: 14, color: '#d1d5db', marginBottom: 20, lineHeight: 1.6 }}>
                          "{previewBanner.subtitle}"
                        </p>
                      )}
                    </>
                  )}

                  {/* Price */}
                  {previewBanner.rich?.price && (
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <span style={{ background: 'linear-gradient(135deg, #ffd700, #ff9f1c)', color: '#000000', fontSize: 20, fontWeight: 800, padding: '6px 22px', borderRadius: 10, display: 'inline-block', boxShadow: '0 4px 20px rgba(255,215,0,0.3)' }}>
                        ₺{previewBanner.rich.price}
                      </span>
                    </div>
                  )}

                  {/* Main image */}
                  <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(201,162,39,0.3)', marginBottom: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    <img src={previewBanner.image} alt={previewBanner.title} style={{ width: '100%', display: 'block', maxHeight: 420, objectFit: 'cover' }} />
                  </div>

                  {/* Description */}
                  {previewBanner.rich?.description && (
                    <p style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 24, color: '#e5e7eb' }}>
                      {previewBanner.rich.description}
                    </p>
                  )}

                  {/* Quote */}
                  {previewBanner.rich?.quote && (
                    <blockquote style={{ borderLeft: '4px solid #ffd700', margin: '24px 0', fontStyle: 'italic', fontSize: 14, color: '#fef08a', lineHeight: 1.7, background: 'rgba(255,215,0,0.06)', padding: '16px 20px', borderRadius: '0 12px 12px 0', border: '1px solid rgba(255,215,0,0.15)' }}>
                      "{previewBanner.rich.quote}"
                    </blockquote>
                  )}

                  {/* Features */}
                  {previewBanner.rich?.features?.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h2 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', borderLeft: '4px solid #ffd700', paddingLeft: 12, marginBottom: 14, color: '#ffd700' }}>
                        ÜRÜNÜN ÖNE ÇIKAN AYRICALIKLARI
                      </h2>
                      {previewBanner.rich.features.map((f, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ color: '#ffd700', fontSize: 15, marginTop: 1, flexShrink: 0 }}>✦</span>
                          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
                            <strong style={{ color: '#ffffff' }}>{f.title}:</strong>{' '}
                            <span style={{ color: '#9ca3af' }}>{f.desc}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sections */}
                  {previewBanner.rich?.sections?.map((sec, i) => (
                    <div key={i} style={{ marginBottom: 24 }}>
                      {sec.title && <h2 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', borderLeft: '4px solid #ffd700', paddingLeft: 12, marginBottom: 12, color: '#ffd700' }}>{sec.title}</h2>}
                      {sec.body && <p style={{ fontSize: 14, lineHeight: 1.8, color: '#e5e7eb' }}>{sec.body}</p>}
                    </div>
                  ))}

                  {/* Video */}
                  {previewBanner.rich?.videoUrl && (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ background: '#000', borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
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
                    <div style={{ marginBottom: 24 }}>
                      <h2 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', borderLeft: '4px solid #ffd700', paddingLeft: 12, marginBottom: 14, color: '#ffd700' }}>
                        TEKNİK KOLEKSİYON BİLGİLERİ
                      </h2>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <tbody>
                          {previewBanner.rich.specs.map((spec, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                              <td style={{ padding: '10px 14px', fontWeight: 600, color: '#ffd700', width: '35%' }}>{spec.key}</td>
                              <td style={{ padding: '10px 14px', color: '#e5e7eb' }}>{spec.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* CTA Button */}
                  {previewBanner.cta && !previewBanner.rich?.hideTextOverlay && (
                    <div style={{ textAlign: 'center', marginTop: 28 }}>
                      <span style={{ display: 'inline-block', background: 'linear-gradient(135deg, #ffd700, #ff9f1c)', color: '#000000', fontSize: 14, fontWeight: 800, padding: '12px 36px', borderRadius: 30, boxShadow: '0 6px 24px rgba(255, 159, 28, 0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {previewBanner.cta} →
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
