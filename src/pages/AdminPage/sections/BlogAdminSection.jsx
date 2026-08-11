import { useState, useEffect, useRef } from 'react';
import {
  FiPlus, FiTrash2, FiBookOpen, FiUpload, FiX,
  FiEdit2, FiEye, FiEyeOff, FiAlertCircle, FiLoader
} from 'react-icons/fi';
import {
  getAdminBlogArticles,
  getAdminBlogArticleById,
  createAdminBlogArticle,
  updateAdminBlogArticle,
  deleteAdminBlogArticle,
  updateAdminBlogArticleStatus,
  getAdminBlogCategories,
} from '../../../services/blogApi';
import { uploadFile } from '../../../services/fileApi';
import RichTextEditor from '../../../components/RichTextEditor/RichTextEditor';
import AdminSEOSection from '../../../components/AdminSEOSection/AdminSEOSection';

// ── Hata kodu → Türkçe mesaj ──────────────────────────────
function resolveErrorMsg(err) {
  if (!err) return 'Bilinmeyen hata.';
  if (err.status === 429 || err.code === 'too_many_requests') {
    return 'Sunucu çok fazla istek algıladı (429 Rate Limit). Lütfen 5-10 saniye bekleyip tekrar deneyin.';
  }
  if (err.status === 500) {
    return 'Sunucuda bir hata oluştu (500 Internal Server Error). Lütfen backend C# servisini ve veritabanı bağlantısını kontrol edin.';
  }
  switch (err.code) {
    case 'confirmation_required': return 'İşlem onayı gerekiyor.';
    case 'validation_error':      return err.message || 'Form alanlarını kontrol edin.';
    case 'not_found':             return 'Kayıt bulunamadı.';
    case 'unauthorized':          return 'Bu işlem için yetkiniz yok.';
    case 'forbidden':             return 'Bu işlem yasak.';
    case 'too_many_requests':     return 'Sunucu çok fazla istek algıladı (429 Rate Limit). Lütfen 5 saniye bekleyin.';
    default:                      return err.message || 'Bir hata oluştu.';
  }
}

// ── Boş form state ────────────────────────────────────────
const EMPTY_FORM = {
  title:              '',
  slug:               '',
  summary:            '',
  content:            '',
  blogCategoryId:     null,
  coverImageUrl:      null,
  coverImageObjectKey:null,
  coverImageAltText:  '',
  status:             'Published',
  seoTitle:           '',
  seoDescription:     '',
  seoKeywords:        '',
};

// ── Durum badge renk ──────────────────────────────────────
const STATUS_COLORS = {
  Published: { bg: 'rgba(39,174,96,0.15)', color: '#27ae60', label: 'Yayında' },
  Draft:     { bg: 'rgba(201,162,39,0.15)', color: '#c9a227', label: 'Taslak' },
  Archived:  { bg: 'rgba(127,140,141,0.15)', color: '#7f8c8d', label: 'Arşiv' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.Draft;
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700, padding: '3px 9px',
      borderRadius: '20px', background: s.bg, color: s.color,
      letterSpacing: '0.05em', textTransform: 'uppercase',
    }}>
      {s.label}
    </span>
  );
}

export default function BlogAdminSection() {
  const [articles, setArticles]         = useState([]);
  const [totalCount, setTotalCount]     = useState(0);
  const [loading, setLoading]           = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [togglingId, setTogglingId]     = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError]               = useState('');
  const [categories, setCategories]     = useState([]);
  const coverInputRef                   = useRef(null);

  // ── Makale listesini yükle ──────────────────────────────
  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await getAdminBlogArticles({ page: 1, pageSize: 50 });
      setArticles(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      setError(resolveErrorMsg(err));
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Kategorileri yükle ─────────────────────────────────
  const loadCategories = async () => {
    try {
      const res = await getAdminBlogCategories();
      const list = Array.isArray(res) ? res : (res?.items || []);
      setCategories(list);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    loadArticles();
    loadCategories();
  }, []);

  // ── Form field güncelle ────────────────────────────────
  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  // ── Modal aç (yeni veya düzenle) ──────────────────────
  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = async (art) => {
    setEditingId(art.id);
    setForm({
      title:               art.title || '',
      slug:                art.slug || '',
      summary:             art.summary || '',
      content:             art.content || '',
      blogCategoryId:      art.blogCategoryId || null,
      coverImageUrl:       art.coverImageUrl || art.image || null,
      coverImageObjectKey: art.coverImageObjectKey || null,
      coverImageAltText:   art.coverImageAltText || '',
      status:              art.status || 'Published',
      seoTitle:            art.seoTitle || '',
      seoDescription:      art.seoDescription || '',
      seoKeywords:         art.seoKeywords || '',
    });
    setError('');
    setShowModal(true);

    if (!art.content || art.content.trim() === '') {
      setLoadingDetail(true);
      try {
        const detail = await getAdminBlogArticleById(art.id || art.slug);
        if (detail) {
          setForm((f) => ({
            ...f,
            title:               detail.title || f.title,
            slug:                detail.slug || f.slug,
            summary:             detail.summary || f.summary,
            content:             detail.content || f.content,
            blogCategoryId:      detail.blogCategoryId || f.blogCategoryId,
            coverImageUrl:       detail.coverImageUrl || detail.image || f.coverImageUrl,
            coverImageObjectKey: detail.coverImageObjectKey || f.coverImageObjectKey,
            coverImageAltText:   detail.coverImageAltText || f.coverImageAltText,
            status:              detail.status || f.status,
            seoTitle:            detail.seoTitle || f.seoTitle,
            seoDescription:      detail.seoDescription || f.seoDescription,
            seoKeywords:         detail.seoKeywords || f.seoKeywords,
          }));
        }
      } catch (err) {
        console.error("Makale detayı çekilemedi:", err);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  // ── Kapak görseli yükle ────────────────────────────────
  const handleCoverUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Lütfen geçerli bir görsel dosyası seçin (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Görsel boyutu 5 MB\'ı geçemez.');
      return;
    }
    setUploadingCover(true);
    setUploadProgress(0);
    setError('');
    try {
      const res = await uploadFile(file, 'Blog', null, (p) => setUploadProgress(p));
      setField('coverImageUrl', res.url || res.fileUrl || null);
      setField('coverImageObjectKey', res.objectKey || res.key || null);
    } catch (err) {
      setError('Görsel yüklenemedi: ' + resolveErrorMsg(err));
    } finally {
      setUploadingCover(false);
      setUploadProgress(0);
    }
  };

  // ── Kaydet (Yeni veya Güncelle) ───────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Makale başlığı zorunludur.');
      return;
    }
    if (!form.content.trim()) {
      setError('Makale içeriği zorunludur.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await updateAdminBlogArticle(editingId, form);
      } else {
        await createAdminBlogArticle(form);
      }
      setShowModal(false);
      await loadArticles();
    } catch (err) {
      setError(resolveErrorMsg(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Sil ───────────────────────────────────────────────
  const handleDelete = async (id, title) => {
    if (!window.confirm(`"${title}" makalesini silmek istediğinize emin misiniz?\nBu işlem geri alınamaz.`)) return;
    try {
      await deleteAdminBlogArticle(id);
      await loadArticles();
    } catch (err) {
      alert('Makale silinemedi: ' + resolveErrorMsg(err));
    }
  };

  // ── Durum toggle (Published ↔ Draft) ──────────────────
  const handleToggleStatus = async (art) => {
    if (togglingId) return;
    const newStatus = art.status === 'Published' ? 'Draft' : 'Published';
    setTogglingId(art.id);
    setError('');
    try {
      await updateAdminBlogArticleStatus(art.id, newStatus);
      await loadArticles();
    } catch (err) {
      setError(resolveErrorMsg(err));
    } finally {
      setTogglingId(null);
    }
  };

  // ── UI ────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px', color: 'var(--text-light)' }}>
      {/* Başlık */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--gold-light)', margin: 0 }}>Blog Yönetimi</h2>
          {!loading && (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
              {totalCount} makale
            </p>
          )}
        </div>
        <button
          id="btn-blog-new"
          onClick={openNew}
          style={{
            background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
            color: '#000', border: 'none', padding: '10px 18px', borderRadius: '8px',
            fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '14px',
          }}
        >
          <FiPlus /> Yeni Makale
        </button>
      </div>

      {/* Hata Bandı */}
      {error && (
        <div style={{
          background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)',
          borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '10px', color: '#e74c3c', fontSize: '14px',
        }}>
          <FiAlertCircle /> {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>
            <FiX />
          </button>
        </div>
      )}

      {/* Yükleniyor */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '14px' }}>Makaleler yükleniyor...</div>
        </div>
      ) : articles.length === 0 ? (
        <div style={{ background: 'var(--bg-mid)', padding: '48px', borderRadius: '12px', textAlign: 'center' }}>
          <FiBookOpen size={40} style={{ color: 'var(--gold)', marginBottom: '12px', display: 'block', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Henüz blog makalesi eklenmedi.</p>
        </div>
      ) : (
        /* Makale Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {articles.map((art) => (
            <div
              key={art.id}
              style={{
                background: 'var(--bg-mid)', border: '1px solid var(--border-gold)',
                borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Kapak Görseli */}
              {(art.image || art.coverImageUrl) && (
                <img
                  src={art.image || art.coverImageUrl}
                  alt={art.title}
                  style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}

              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Başlık + Badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                  <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: 0, flex: 1, lineHeight: 1.35 }}>
                    {art.title}
                  </h4>
                  <StatusBadge status={art.status} />
                </div>

                {/* Özet */}
                {art.summary && (
                  <p style={{
                    color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5,
                    margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {art.summary}
                  </p>
                )}

                {/* Tarih */}
                {art.date && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '0 0 12px' }}>
                    {art.date}
                  </p>
                )}

                {/* Aksiyonlar */}
                <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Düzenle */}
                  <button
                    id={`btn-edit-blog-${art.id}`}
                    onClick={() => openEdit(art)}
                    style={{
                      background: 'rgba(201,162,39,0.12)', color: 'var(--gold-light)',
                      border: '1px solid var(--border-gold)', padding: '6px 12px',
                      borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
                      display: 'flex', alignItems: 'center', gap: '5px',
                    }}
                  >
                    <FiEdit2 size={13} /> Düzenle
                  </button>

                  {/* Yayın Toggle */}
                  <button
                    id={`btn-status-blog-${art.id}`}
                    onClick={() => handleToggleStatus(art)}
                    disabled={togglingId === art.id}
                    style={{
                      background: art.status === 'Published' ? 'rgba(127,140,141,0.1)' : 'rgba(39,174,96,0.1)',
                      color: art.status === 'Published' ? '#7f8c8d' : '#27ae60',
                      border: `1px solid ${art.status === 'Published' ? 'rgba(127,140,141,0.3)' : 'rgba(39,174,96,0.3)'}`,
                      padding: '6px 12px', borderRadius: '6px', cursor: togglingId === art.id ? 'not-allowed' : 'pointer', fontSize: '13px',
                      display: 'flex', alignItems: 'center', gap: '5px', opacity: togglingId === art.id ? 0.7 : 1,
                    }}
                    title={art.status === 'Published' ? 'Taslağa al' : 'Yayınla'}
                  >
                    {togglingId === art.id ? (
                      <FiLoader size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      art.status === 'Published' ? <FiEyeOff size={13} /> : <FiEye size={13} />
                    )}
                    {togglingId === art.id ? 'İşleniyor...' : (art.status === 'Published' ? 'Gizle' : 'Yayınla')}
                  </button>

                  {/* Sil */}
                  <button
                    id={`btn-delete-blog-${art.id}`}
                    onClick={() => handleDelete(art.id, art.title)}
                    style={{
                      background: 'rgba(231,76,60,0.1)', color: '#e74c3c',
                      border: '1px solid rgba(231,76,60,0.3)', padding: '6px 12px',
                      borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
                      display: 'flex', alignItems: 'center', gap: '5px',
                    }}
                  >
                    <FiTrash2 size={13} /> Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          zIndex: 9999, display: 'flex', alignItems: 'flex-start',
          justifyContent: 'center', overflowY: 'auto', padding: '24px 16px',
        }}>
          <div style={{
            background: 'var(--bg-mid)', border: '1px solid var(--border-gold)',
            borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '900px',
            color: '#fff', position: 'relative',
          }}>
            {/* Modal Başlık */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ color: 'var(--gold-light)', fontSize: '20px', fontWeight: 700, margin: 0 }}>
                {editingId ? 'Makaleyi Düzenle' : 'Yeni Blog Makalesi'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <FiX size={22} />
              </button>
            </div>

            {/* Hata */}
            {error && (
              <div style={{
                background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)',
                borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
                display: 'flex', alignItems: 'center', gap: '8px', color: '#e74c3c', fontSize: '13px',
              }}>
                <FiAlertCircle /> {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              {/* Satır 1: Başlık + Durum */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', marginBottom: '16px', alignItems: 'end' }}>
                <div>
                  <label style={labelStyle}>Makale Başlığı *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => {
                      setField('title', e.target.value);
                      if (!form.slug || form.slug === slugify(form.title)) {
                        setField('slug', slugify(e.target.value));
                      }
                    }}
                    placeholder="Örn: Koruyucu Taşların Faydaları"
                    style={inputStyle}
                    required
                    id="blog-title"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Durum</label>
                  <select
                    value={form.status}
                    onChange={e => setField('status', e.target.value)}
                    style={{ ...inputStyle, width: '140px' }}
                    id="blog-status"
                  >
                    <option value="Published">Yayında</option>
                    <option value="Draft">Taslak</option>
                    <option value="Archived">Arşiv</option>
                  </select>
                </div>
              </div>

              {/* Satır 2: Slug + Kategori */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Slug (URL)</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => setField('slug', e.target.value)}
                    placeholder="ornek-makale-basligi"
                    style={inputStyle}
                    id="blog-slug"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Kategori</label>
                  <select
                    value={form.blogCategoryId || ''}
                    onChange={e => setField('blogCategoryId', e.target.value || null)}
                    style={inputStyle}
                    id="blog-category"
                  >
                    <option value="">Kategori seç (opsiyonel)</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kısa Özet */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Kısa Özet</label>
                <textarea
                  value={form.summary}
                  onChange={e => setField('summary', e.target.value)}
                  placeholder="Makale listesinde ve arama sonuçlarında görünecek 1-2 cümlelik kısa özet"
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                  id="blog-summary"
                />
              </div>

              {/* Kapak Görseli Upload */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Kapak Görseli</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Preview */}
                  {form.coverImageUrl && (
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={form.coverImageUrl}
                        alt="Kapak önizleme"
                        style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-gold)' }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={() => { setField('coverImageUrl', null); setField('coverImageObjectKey', null); }}
                        style={{
                          position: 'absolute', top: '-6px', right: '-6px', background: '#e74c3c',
                          border: 'none', borderRadius: '50%', width: '20px', height: '20px',
                          cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  )}

                  {/* Upload Butonu */}
                  <div style={{ flex: 1 }}>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => handleCoverUpload(e.target.files[0])}
                      id="blog-cover-upload"
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploadingCover}
                      style={{
                        background: 'rgba(201,162,39,0.08)', border: '1px dashed var(--gold-border)',
                        color: 'var(--gold-light)', padding: '10px 16px', borderRadius: '8px',
                        cursor: uploadingCover ? 'not-allowed' : 'pointer', fontSize: '13px',
                        display: 'flex', alignItems: 'center', gap: '8px', opacity: uploadingCover ? 0.7 : 1,
                      }}
                    >
                      <FiUpload size={14} />
                      {uploadingCover
                        ? `Yükleniyor... %${uploadProgress}`
                        : (form.coverImageUrl ? 'Görseli Değiştir' : 'Görsel Yükle')
                      }
                    </button>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '6px 0 0' }}>
                      JPG, PNG veya WebP · Max 5 MB
                    </p>
                    {/* Progress Bar */}
                    {uploadingCover && (
                      <div style={{ marginTop: '8px', background: 'var(--bg-dark)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${uploadProgress}%`, background: 'var(--gold)', height: '100%', transition: 'width 0.2s' }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TinyMCE İçerik */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={labelStyle}>Detaylı İçerik (TinyMCE) *</label>
                  {loadingDetail && (
                    <span style={{ color: 'var(--gold)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiLoader className="spin" /> İçerik sunucudan çekiliyor...
                    </span>
                  )}
                </div>
                <RichTextEditor
                  value={form.content}
                  onChange={val => setField('content', val)}
                  placeholder="Makale içeriğini buraya yazın..."
                />
              </div>

              {/* SEO Ayarları */}
              <AdminSEOSection
                seoTitle={form.seoTitle || ''}
                onChangeSeoTitle={(val) => setField('seoTitle', val)}
                seoDescription={form.seoDescription || ''}
                onChangeSeoDescription={(val) => setField('seoDescription', val)}
                seoKeywords={form.seoKeywords || ''}
                onChangeSeoKeywords={(val) => setField('seoKeywords', val)}
                slug={form.slug || ''}
                onChangeSlug={(val) => setField('slug',val)}
                fallbackTitle={form.title}
                fallbackDescription={form.summary || form.content}
                baseUrl="https://muhristan.com/blog?article="
                typeLabel="blog yazısı"
              />

              {/* Form Butonları */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  style={{
                    padding: '10px 20px', borderRadius: '8px',
                    background: 'transparent', border: '1px solid var(--border-mid)',
                    color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                  }}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingCover}
                  style={{
                    padding: '10px 24px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--gold-light), var(--gold-dark))',
                    border: 'none', color: '#000', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                    opacity: saving ? 0.7 : 1,
                  }}
                  id="btn-blog-save"
                >
                  {saving && <FiLoader size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                  {saving ? 'Kaydediliyor...' : (editingId ? 'Güncelle' : 'Yayınla')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Yardımcılar ───────────────────────────────────────────
const labelStyle = {
  display: 'block', fontSize: '13px', fontWeight: 600,
  marginBottom: '6px', color: 'var(--text-secondary)',
};

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  background: 'var(--bg-dark)', border: '1px solid var(--border-mid)',
  color: '#fff', fontSize: '14px', boxSizing: 'border-box',
  outline: 'none', fontFamily: 'inherit',
};

function slugify(str) {
  return (str || '')
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
