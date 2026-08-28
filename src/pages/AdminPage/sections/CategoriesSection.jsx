import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiCornerDownRight, FiChevronDown, FiChevronRight, FiLock, FiUnlock, FiSearch, FiEdit3, FiX, FiFolder, FiSave, FiRefreshCw, FiCheck, FiEyeOff, FiLink, FiCopy } from 'react-icons/fi';
import * as categoryApi from '../../../services/categoryApi';
import { collectDescendantIds } from '../../../utils/categoryTree';
import { getHardDeleteErrorMessage } from '../../../utils/apiErrorHelpers';
import AdminSEOSection from '../../../components/AdminSEOSection/AdminSEOSection';

/* ── İnline Stil Tanımları (CSS Değişkenleri Uyumlu) ────────────────────────────────── */
const S = {
  wrapper: {
    background: 'var(--bg-mid)',
    border: '1px solid var(--border-gold)',
    borderRadius: 16,
    padding: '28px 24px',
    boxShadow: '0 4px 20px rgba(44, 26, 77, 0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  headerTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  searchWrap: {
    position: 'relative',
    width: 240,
  },
  searchInput: {
    width: '100%',
    height: 38,
    padding: '0 14px 0 36px',
    background: 'var(--bg-dark)',
    border: '1px solid var(--border-gold)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-secondary)',
    pointerEvents: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20,
  },
  /* ─── Sol Panel: Ağaç ─── */
  treePanel: {
    border: '1px solid var(--border-gold)',
    borderRadius: 14,
    padding: 14,
    background: 'var(--bg-dark)',
    maxHeight: 520,
    overflowY: 'auto',
  },
  treeRow: (depth, isHover) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '11px 14px',
    marginLeft: depth * 24,
    marginBottom: 3,
    borderRadius: 10,
    background: isHover
      ? 'rgba(184, 134, 11, 0.12)'
      : depth === 0
        ? 'var(--bg-mid)'
        : 'transparent',
    transition: 'background 0.2s, transform 0.15s',
    transform: isHover ? 'translateX(2px)' : 'none',
    borderLeft: depth === 0 ? '3px solid var(--gold-light)' : '3px solid transparent',
  }),
  catName: (depth) => ({
    color: 'var(--text-primary)',
    fontSize: depth === 0 ? 14 : 13,
    fontWeight: depth === 0 ? 600 : 400,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }),
  secretBadge: {
    fontSize: 9,
    background: 'rgba(224, 85, 148, 0.12)',
    color: '#e05594',
    padding: '2px 8px',
    borderRadius: 6,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 700,
    letterSpacing: '0.03em',
  },
  expandBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--gold-light)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 2,
    borderRadius: 4,
    transition: 'background 0.15s',
  },
  actionBtns: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    opacity: 0.9,
    transition: 'opacity 0.2s',
  },
  statusBtn: (isActive) => ({
    background: isActive ? 'rgba(46, 204, 113, 0.15)' : 'rgba(224, 85, 148, 0.15)',
    border: `1px solid ${isActive ? 'rgba(46, 204, 113, 0.3)' : 'rgba(224, 85, 148, 0.3)'}`,
    color: isActive ? '#2ecc71' : '#e05594',
    padding: '4px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    transition: 'all 0.2s',
    fontWeight: 600,
  }),
  iconBtn: (color) => ({
    background: 'var(--bg-mid)',
    border: '1px solid var(--border-gold)',
    color: color || 'var(--text-primary)',
    padding: '5px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    transition: 'all 0.2s',
    fontWeight: 500,
  }),
  /* ─── Sağ Panel: Form ─── */
  formPanel: (isEditing) => ({
    border: '1px solid var(--border-gold)',
    borderRadius: 14,
    padding: 20,
    background: 'var(--bg-dark)',
    height: 'fit-content',
    position: 'sticky',
    top: 80,
    transition: 'all 0.3s ease',
    boxShadow: isEditing ? '0 0 30px rgba(201, 162, 39, 0.15)' : 'none',
  }),
  formTitle: {
    margin: '0 0 20px 0',
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  formTitleIcon: (isEditing) => ({
    width: 28,
    height: 28,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isEditing
      ? 'rgba(201, 162, 39, 0.2)'
      : 'rgba(46, 204, 113, 0.2)',
    color: isEditing ? 'var(--gold-light)' : '#2ecc71',
    fontSize: 13,
    flexShrink: 0,
  }),
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 6,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    height: 40,
    padding: '0 14px',
    background: 'var(--bg-mid)',
    border: '1px solid var(--border-gold)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.3s, box-shadow 0.3s',
    boxSizing: 'border-box',
  },
  select: (hasError) => ({
    width: '100%',
    height: 40,
    padding: '0 14px',
    background: 'var(--bg-mid)',
    border: `1px solid ${hasError ? 'rgba(224, 85, 148, 0.5)' : 'var(--border-gold)'}`,
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    cursor: 'pointer',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
  }),
  checkboxWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    userSelect: 'none',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid var(--border-gold)',
    background: 'var(--bg-mid)',
    transition: 'all 0.2s',
  },
  checkboxCustom: (checked) => ({
    width: 18,
    height: 18,
    borderRadius: 5,
    border: `2px solid ${checked ? '#e05594' : 'var(--border-gold)'}`,
    background: checked ? 'rgba(224, 85, 148, 0.15)' : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    flexShrink: 0,
  }),
  submitBtn: (isEditing) => ({
    flex: 1,
    height: 42,
    border: 'none',
    borderRadius: 10,
    background: isEditing
      ? 'linear-gradient(135deg, var(--gold-light), #d4891a)'
      : 'linear-gradient(135deg, #2ecc71, #27ae60)',
    color: '#12091f',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    letterSpacing: '0.04em',
    transition: 'all 0.3s',
    boxShadow: isEditing
      ? '0 4px 20px rgba(201, 162, 39, 0.3)'
      : '0 4px 20px rgba(46, 204, 113, 0.25)',
  }),
  cancelBtn: {
    height: 42,
    border: '1px solid var(--border-gold)',
    borderRadius: 10,
    background: 'var(--bg-mid)',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '0 18px',
    transition: 'all 0.2s',
  },
  errorText: {
    color: '#e05594',
    fontSize: 11,
    marginTop: 4,
    margin: 0,
  },
  hintText: {
    fontSize: 10,
    color: 'var(--text-secondary)',
    marginTop: 4,
  },
  emptyText: {
    letterSpacing: '0.03em',
    textAlign: 'center',
    color: 'rgba(232, 224, 240, 0.3)',
    fontSize: 13,
    padding: '40px 0',
  },
  fieldGroup: {
    marginBottom: 16,
  },
};

export default function CategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [newCatName, setNewCatName] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [parentId, setParentId] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSecret, setIsSecret] = useState(false);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCats, setExpandedCats] = useState({});
  const [parentError, setParentError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryApi.getAdminCategories();
      setCategories(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleExpand = (catId) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const resetForm = () => {
    setNewCatName('');
    setDescription('');
    setSlug('');
    setSeoTitle('');
    setSeoDescription('');
    setSeoKeywords('');
    setParentId('');
    setIsSecret(false);
    setEditingCategory(null);
    setParentError('');
  };

  const [copiedCatId, setCopiedCatId] = useState(null);

  const handleCopyCategoryLink = (cat) => {
    const catSlugOrId = cat.slug || cat.name || cat.id;
    const cleanSlug = catSlugOrId.replace(' [GİZLİ]', '').trim();
    const link = `${window.location.origin}/urunler?kategori=${encodeURIComponent(cleanSlug)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    const catId = String(cat.databaseId ?? cat.id);
    setCopiedCatId(catId);
    setTimeout(() => setCopiedCatId(null), 2500);
  };

  const handleToggleStatus = async (cat) => {
    const catId = cat.databaseId ?? cat.id;
    try {
      setUpdatingId(catId);
      const nextActive = !cat.isActive;
      await categoryApi.updateAdminCategoryStatus(catId, nextActive);
      fetchCategories();
    } catch (err) {
      alert("Durum güncellenirken hata oluştu: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCatName.trim() || submitting) return;

    setParentError('');
    setSubmitting(true);

    let finalName = newCatName.trim();
    if (isSecret) {
      if (!finalName.endsWith(' [GİZLİ]')) {
        finalName = `${finalName} [GİZLİ]`;
      }
    } else {
      finalName = finalName.replace(' [GİZLİ]', '').trim();
    }

    const payload = {
      name: finalName,
      description: description ? description.trim() : null,
      parentCategoryId: parentId || null,
      isSecret: isSecret,
      slug: slug ? slug.trim().toLowerCase().replace(/\s+/g, '-') : null,
      seoTitle: seoTitle ? seoTitle.trim() : null,
      seoDescription: seoDescription ? seoDescription.trim() : null,
      seoKeywords: seoKeywords ? seoKeywords.trim() : null,
      isActive: editingCategory ? (editingCategory.isActive ?? true) : true,
      sortOrder: editingCategory ? (editingCategory.sortOrder ?? 0) : 0
    };

    try {
      if (editingCategory) {
        const catId = editingCategory.databaseId ?? editingCategory.id;
        await categoryApi.updateAdminCategory(catId, payload);
        alert("Kategori başarıyla güncellendi.");
        resetForm();
        fetchCategories();
      } else {
        await categoryApi.createAdminCategory(payload);
        alert("Kategori başarıyla eklendi.");
        resetForm();
        fetchCategories();
      }
    } catch (err) {
      if (err.code === "category_cycle") {
        setParentError("Bu kategori kendi alt kategorilerinden birinin altına taşınamaz.");
      } else if (err.code === "not_found") {
        alert("Seçilen üst kategori artık mevcut değil. Kategori listesini yenileyin.");
        setParentId('');
        fetchCategories();
      } else {
        alert("Kategori işlemi başarısız oldu: " + err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = async (cat) => {
    setEditingCategory(cat);
    const isSec = cat.name?.endsWith(' [GİZLİ]') || Boolean(cat.isSecret ?? cat.IsSecret);
    setNewCatName(cat.name ? cat.name.replace(' [GİZLİ]', '').trim() : '');
    setIsSecret(isSec);
    setDescription(cat.description || cat.Description || '');
    setSlug(cat.slug || cat.Slug || '');
    setSeoTitle(cat.seoTitle || cat.SeoTitle || '');
    setSeoDescription(cat.seoDescription || cat.SeoDescription || '');
    setSeoKeywords(cat.seoKeywords || cat.SeoKeywords || '');
    setParentId(cat.parentCategoryId || cat.ParentCategoryId || '');
    setParentError('');

    // Backend'den detaylı kategori verisini çekip eksik alanları tamamla
    const catId = cat.databaseId ?? cat.id;
    if (catId) {
      try {
        const full = await categoryApi.getAdminCategoryById(catId);
        if (full) {
          if (full.name || full.Name) {
            const fName = full.name || full.Name;
            const fullSec = fName.endsWith(' [GİZLİ]') || Boolean(full.isSecret ?? full.IsSecret);
            setNewCatName(fName.replace(' [GİZLİ]', '').trim());
            setIsSecret(fullSec);
          }
          if (full.description || full.Description) setDescription(full.description || full.Description || '');
          if (full.slug || full.Slug) setSlug(full.slug || full.Slug || '');
          if (full.seoTitle || full.SeoTitle) setSeoTitle(full.seoTitle || full.SeoTitle || '');
          if (full.seoDescription || full.SeoDescription) setSeoDescription(full.seoDescription || full.SeoDescription || '');
          if (full.seoKeywords || full.SeoKeywords) setSeoKeywords(full.seoKeywords || full.SeoKeywords || '');
          if (full.parentCategoryId || full.ParentCategoryId) setParentId(full.parentCategoryId || full.ParentCategoryId || '');
        }
      } catch {
        // Background fetch fallback
      }
    }
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu kategori kalıcı olarak silinecektir. Kategoriye bağlı ürün veya alt kategori varsa işlem engellenir. Devam etmek istediğinize emin misiniz?")) {
      return;
    }
    if (deletingId) return;

    setDeletingId(id);
    try {
      await categoryApi.deleteAdminCategory(id);
      if (editingCategory && (editingCategory.databaseId === id || editingCategory.id === id)) {
        handleCancelEdit();
      }
      fetchCategories();
      alert("Kategori başarıyla silindi.");
    } catch (err) {
      alert(getHardDeleteErrorMessage(err, "Kategori"));
    } finally {
      setDeletingId(null);
    }
  };

  const shouldRenderNode = (node) => {
    if (!searchQuery.trim()) return true;
    const nameMatch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (nameMatch) return true;
    if (node.children && node.children.length > 0) {
      return node.children.some(child => shouldRenderNode(child));
    }
    return false;
  };

  const renderCategoryNode = (cat, visited = new Set(), depth = 0) => {
    if (!cat || depth > 20) return null;

    const catId = String(cat.databaseId ?? cat.id);
    if (!catId || visited.has(catId)) return null;
    if (!shouldRenderNode(cat)) return null;

    const nextVisited = new Set(visited);
    nextVisited.add(catId);

    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = !!expandedCats[catId] || searchQuery.trim() !== '';
    const isCategorySecret = cat.name.endsWith(' [GİZLİ]');
    const displayName = isCategorySecret ? cat.name.replace(' [GİZLİ]', '').trim() : cat.name;
    const isHover = hoveredRow === catId;
    const isBeingEdited = editingCategory && String(editingCategory.databaseId ?? editingCategory.id) === catId;

    return (
      <div key={catId} style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            ...S.treeRow(depth, isHover),
            ...(isBeingEdited ? { background: 'rgba(201, 162, 39, 0.1)', borderLeft: '3px solid #f5d680' } : {}),
          }}
          onMouseEnter={() => setHoveredRow(catId)}
          onMouseLeave={() => setHoveredRow(null)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(catId)}
                style={S.expandBtn}
              >
                {isExpanded ? <FiChevronDown size={15} /> : <FiChevronRight size={15} />}
              </button>
            ) : (
              depth > 0 && <FiCornerDownRight style={{ opacity: 0.25, color: 'rgba(232,224,240,0.5)' }} size={13} />
            )}

            <a
              href={`/urunler?kategori=${encodeURIComponent(cat.slug || cat.name || catId)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Mağazada bu kategoriye git (Yeni Sekmede Açılır)"
              style={{
                ...S.catName(depth),
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold-light, #c9a227)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            >
              {displayName}
              {isCategorySecret && (
                <span style={S.secretBadge}>
                  <FiLock size={8} /> GİZLİ
                </span>
              )}
            </a>
          </div>

          <div
            style={{
              ...S.actionBtns,
              opacity: isHover ? 1 : 0.5,
            }}
          >
            <button
              type="button"
              onClick={() => handleCopyCategoryLink(cat)}
              style={S.iconBtn('#38bdf8')}
              title="Kategori linkini kopyala (Kime atarsanız doğrudan bu kategoriyi açar)"
            >
              {copiedCatId === catId ? (
                <><FiCheck size={10} style={{ color: '#2ecc71' }} /> <span style={{ color: '#2ecc71' }}>Kopyalandı</span></>
              ) : (
                <><FiLink size={10} /> Link</>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleToggleStatus(cat)}
              disabled={updatingId === catId}
              style={{
                ...S.statusBtn(cat.isActive),
                opacity: updatingId === catId ? 0.4 : 1,
              }}
              title={cat.isActive ? "Kategoriyi Yayından Kaldır (Pasife Al)" : "Kategoriyi Yayına Al (Aktif Et)"}
            >
              {cat.isActive ? (
                <><FiCheck size={10} /> Yayında</>
              ) : (
                <><FiEyeOff size={10} /> Pasif</>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleEditClick(cat)}
              style={S.iconBtn('#f5d680')}
            >
              <FiEdit3 size={10} /> Düzenle
            </button>

            <button
              type="button"
              onClick={() => handleDelete(catId)}
              disabled={deletingId === catId}
              style={{
                ...S.iconBtn('#e05594'),
                opacity: deletingId === catId ? 0.4 : 1,
              }}
            >
              <FiTrash2 size={10} /> {deletingId === catId ? 'Siliniyor...' : 'Sil'}
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(cat.children ?? []).map(child => renderCategoryNode(child, nextVisited, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getFlattenedOptions = (nodes, depth = 0) => {
    let options = [];
    nodes.forEach(node => {
      const cleanName = node.name.endsWith(' [GİZLİ]') ? node.name.replace(' [GİZLİ]', '').trim() : node.name;
      options.push({
        id: node.id,
        databaseId: node.databaseId ?? node.id,
        name: `${'— '.repeat(depth)}${cleanName}`,
        rawNode: node
      });
      if (node.children?.length > 0) {
        options = [...options, ...getFlattenedOptions(node.children, depth + 1)];
      }
    });
    return options;
  };

  const allFlattened = getFlattenedOptions(categories);

  const getAllowedParents = () => {
    if (!editingCategory) return allFlattened;
    const editingId = String(editingCategory.databaseId ?? editingCategory.id);
    const descendantIds = collectDescendantIds(editingCategory);
    const excludedIds = new Set([editingId, ...descendantIds]);
    return allFlattened.filter(category => {
      const categoryId = String(category.databaseId ?? category.id);
      return !excludedIds.has(categoryId);
    });
  };

  const allowedParents = getAllowedParents();

  if (loading && categories.length === 0) {
    return (
      <div style={{ ...S.wrapper, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <FiRefreshCw size={20} style={{ color: 'var(--gold-light)', animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)', marginLeft: 10, fontSize: 14 }}>Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div style={S.wrapper}>
      {/* Header */}
      <div style={S.header}>
        <h3 style={S.headerTitle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiFolder size={18} style={{ color: 'var(--gold-light)' }} />
            Kategori Yönetimi
          </span>
        </h3>

        <div style={S.searchWrap}>
          <FiSearch size={14} style={S.searchIcon} />
          <input
            type="text"
            placeholder="Kategori ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={S.searchInput}
            onFocus={e => {
              e.target.style.borderColor = 'var(--gold-light)';
              e.target.style.boxShadow = '0 0 0 3px rgba(201, 162, 39, 0.1)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--border-gold)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Grid: Tree + Form */}
      <div style={S.grid}>

        {/* Sol Panel — Ağaç */}
        <div style={S.treePanel}>
          {categories.map(cat => renderCategoryNode(cat, new Set(), 0))}
          {categories.length === 0 && (
            <p style={S.emptyText}>
              <FiFolder size={24} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.5 }} />
              Henüz kategori eklenmemiştir.
            </p>
          )}
        </div>

        {/* Sağ Panel — Form */}
        <div style={S.formPanel(!!editingCategory)}>
          <h4 style={S.formTitle}>
            <span style={S.formTitleIcon(!!editingCategory)}>
              {editingCategory ? <FiEdit3 size={13} /> : <FiPlus size={13} />}
            </span>
            <span style={{ color: editingCategory ? 'var(--gold-light)' : '#2ecc71' }}>
              {editingCategory ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}
            </span>
          </h4>

          <form onSubmit={handleSubmit}>
            {/* Kategori Adı */}
            <div style={S.fieldGroup}>
              <label style={S.label}>Kategori Adı *</label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={e => {
                  setNewCatName(e.target.value);
                  if (parentError) setParentError('');
                }}
                style={S.input}
                placeholder="Örn: Gümüş Kolyeler"
                onFocus={e => {
                  e.target.style.borderColor = 'var(--gold-light)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(201, 162, 39, 0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border-gold)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Üst Kategori */}
            <div style={S.fieldGroup}>
              <label style={S.label}>Üst Kategori (Opsiyonel)</label>
              <select
                value={parentId}
                onChange={e => {
                  setParentId(e.target.value);
                  if (parentError) setParentError('');
                }}
                style={S.select(!!parentError)}
              >
                <option value="" style={{ background: 'var(--bg-mid)', color: 'var(--text-primary)' }}>(Ana Kategori)</option>
                {allowedParents.map(opt => (
                  <option key={opt.id} value={opt.databaseId} style={{ background: 'var(--bg-mid)', color: 'var(--text-primary)' }}>{opt.name}</option>
                ))}
              </select>
              {parentError && <p style={S.errorText}>{parentError}</p>}
            </div>

            {/* Kategori Açıklaması */}
            <div style={S.fieldGroup}>
              <label style={S.label}>Kategori Açıklaması (Opsiyonel)</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ ...S.input, height: 'auto', padding: '10px 14px', resize: 'vertical' }}
                placeholder="Kategori hakkında kısa tanıtım metni..."
              />
            </div>

            {/* Gizli Kategori */}
            <div style={S.fieldGroup}>
              <label
                style={{
                  ...S.checkboxWrap,
                  borderColor: isSecret ? 'rgba(224, 85, 148, 0.4)' : 'var(--border-gold)',
                  background: isSecret ? 'rgba(224, 85, 148, 0.08)' : 'var(--bg-mid)',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSecret}
                  onChange={e => setIsSecret(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <span style={S.checkboxCustom(isSecret)}>
                  {isSecret && <FiLock size={10} style={{ color: '#e05594' }} />}
                </span>
                <div>
                  <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }}>
                    Gizli Kategori
                  </span>
                  <span style={S.hintText}>
                    <br />Bu kategori genel listelerde ve filtrelerde gizlenecektir.
                  </span>
                </div>
              </label>
            </div>

            {/* SEO Ayarları */}
            <AdminSEOSection
              seoTitle={seoTitle}
              onChangeSeoTitle={setSeoTitle}
              seoDescription={seoDescription}
              onChangeSeoDescription={setSeoDescription}
              seoKeywords={seoKeywords}
              onChangeSeoKeywords={setSeoKeywords}
              slug={slug}
              onChangeSlug={setSlug}
              fallbackTitle={newCatName}
              fallbackDescription={description}
              baseUrl="https://muhristan.com/urunler?kategori="
              typeLabel="kategori"
            />

            {/* Butonlar */}
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  ...S.submitBtn(!!editingCategory),
                  opacity: submitting ? 0.6 : 1,
                }}
                onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.target.style.transform = 'none'; }}
              >
                {submitting ? (
                  <FiRefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : editingCategory ? (
                  <><FiSave size={14} /> Güncelle</>
                ) : (
                  <><FiPlus size={14} /> Kategori Ekle</>
                )}
              </button>

              {editingCategory && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={S.cancelBtn}
                  onMouseEnter={e => {
                    e.target.style.borderColor = 'var(--gold-light)';
                  }}
                  onMouseLeave={e => {
                    e.target.style.borderColor = 'var(--border-gold)';
                  }}
                >
                  <FiX size={14} /> İptal
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Spin animasyonu */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
