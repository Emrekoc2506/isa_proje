import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiBookOpen } from 'react-icons/fi';
import { getAdminBlogArticles, createAdminBlogArticle, deleteAdminBlogArticle } from '../../../services/blogApi';

export default function BlogAdminSection() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');

  const loadBlog = async () => {
    try {
      setLoading(true);
      const data = await getAdminBlogArticles();
      const list = Array.isArray(data) ? data : (data?.items || []);
      setArticles(list);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlog();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !content) return;
    try {
      await createAdminBlogArticle({
        title,
        content,
        summary: summary || title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        isActive: true
      });
      setTitle('');
      setContent('');
      setSummary('');
      setShowModal(false);
      loadBlog();
    } catch (err) {
      alert("Blog makalesi oluşturulamadı: " + (err.message || ''));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu makaleyi silmek istediğinize emin misiniz?")) return;
    try {
      await deleteAdminBlogArticle(id);
      loadBlog();
    } catch (err) {
      alert("Makale silinemedi: " + (err.message || ''));
    }
  };

  return (
    <div style={{ padding: '24px', color: 'var(--text-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--gold-light)' }}>Blog Yönetimi</h2>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
            color: '#000',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FiPlus /> Yeni Makale Ekle
        </button>
      </div>

      {loading ? (
        <p>Makaleler yükleniyor...</p>
      ) : articles.length === 0 ? (
        <div style={{ background: 'var(--bg-mid)', padding: '32px', borderRadius: '12px', textAlign: 'center' }}>
          <FiBookOpen size={36} style={{ color: 'var(--gold)', marginBottom: '12px' }} />
          <p>Henüz eklenmiş bir blog makalesi bulunmuyor.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {articles.map((art) => (
            <div key={art.id} style={{ background: 'var(--bg-mid)', border: '1px solid var(--border-gold)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{art.title || art.name}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.4, height: '2.8em', overflow: 'hidden' }}>{art.summary || art.content}</p>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => handleDelete(art.id)}
                  style={{ background: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <FiTrash2 /> Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-mid)', border: '1px solid var(--border-gold)', borderRadius: '16px', padding: '32px', width: '90%', maxWidth: '500px', color: '#fff' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--gold-light)' }}>Yeni Blog Makalesi</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Başlık</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-mid)', color: '#fff' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Özet</label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-mid)', color: '#fff' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>İçerik</label>
                <textarea
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-mid)', color: '#fff', resize: 'vertical' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-mid)', color: '#fff', cursor: 'pointer' }}>Vazgeç</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--gold)', border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer' }}>Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
