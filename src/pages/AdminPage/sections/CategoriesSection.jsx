import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiCornerDownRight, FiChevronDown, FiChevronRight, FiLock, FiUnlock, FiSearch, FiEdit3, FiX, FiFolder, FiSave, FiRefreshCw } from 'react-icons/fi';
import * as categoryApi from '../../../services/categoryApi';
import { collectDescendantIds } from '../../../utils/categoryTree';

/* ── İnline Stil Tanımları ────────────────────────────────── */
const S = {
  wrapper: {
    background: 'linear-gradient(135deg, rgba(18, 9, 31, 0.6), rgba(30, 15, 55, 0.4))',
    border: '1px solid rgba(201, 162, 39, 0.15)',
    borderRadius: 16,
    padding: '28px 24px',
    backdropFilter: 'blur(12px)',
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
    background: 'linear-gradient(135deg, #f5d680, #c9a227)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
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
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    color: '#e8e0f0',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(255,255,255,0.3)',
    pointerEvents: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: 20,
  },
  /* ─── Sol Panel: Ağaç ─── */
  treePanel: {
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 14,
    background: 'rgba(0, 0, 0, 0.2)',
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
      ? 'rgba(201, 162, 39, 0.06)'
      : depth === 0
        ? 'rgba(255, 255, 255, 0.025)'
        : 'transparent',
    transition: 'background 0.2s, transform 0.15s',
    transform: isHover ? 'translateX(2px)' : 'none',
    borderLeft: depth === 0 ? '3px solid rgba(201, 162, 39, 0.3)' : '3px solid transparent',
  }),
  catName: (depth) => ({
    color: depth === 0 ? '#f5d680' : depth === 1 ? '#e8e0f0' : 'rgba(232, 224, 240, 0.7)',
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
    color: '#f5d680',
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
    opacity: 0.7,
    transition: 'opacity 0.2s',
  },
  statusBtn: (isActive) => ({
    background: isActive ? 'rgba(46, 204, 113, 0.1)' : 'rgba(224, 85, 148, 0.1)',
    border: `1px solid ${isActive ? 'rgba(46, 204, 113, 0.2)' : 'rgba(224, 85, 148, 0.2)'}`,
    color: isActive ? '#2ecc71' : '#e05594',
    padding: '4px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    transition: 'all 0.2s',
    fontWeight: 500,
  }),
  iconBtn: (color) => ({
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    color: color,
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
    border: `1px solid ${isEditing ? 'rgba(201, 162, 39, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
    borderRadius: 14,
    padding: 20,
    background: isEditing
      ? 'linear-gradient(145deg, rgba(201, 162, 39, 0.06), rgba(18, 9, 31, 0.7))'
      : 'rgba(255, 255, 255, 0.02)',
    height: 'fit-content',
    position: 'sticky',
    top: 80,
    transition: 'all 0.3s ease',
    boxShadow: isEditing ? '0 0 30px rgba(201, 162, 39, 0.08)' : 'none',
  }),
  formTitle: {
    margin: '0 0 20px 0',
    fontSize: 14,
    fontWeight: 700,
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
      ? 'linear-gradient(135deg, rgba(201, 162, 39, 0.2), rgba(201, 162, 39, 0.05))'
      : 'linear-gradient(135deg, rgba(46, 204, 113, 0.2), rgba(46, 204, 113, 0.05))',
    color: isEditing ? '#f5d680' : '#2ecc71',
    fontSize: 13,
    flexShrink: 0,
  }),
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(232, 224, 240, 0.6)',
    marginBottom: 6,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    height: 40,
    padding: '0 14px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    color: '#e8e0f0',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.3s, box-shadow 0.3s',
    boxSizing: 'border-box',
  },
  select: (hasError) => ({
    width: '100%',
    height: 40,
    padding: '0 14px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: `1px solid ${hasError ? 'rgba(224, 85, 148, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
    borderRadius: 10,
    color: '#e8e0f0',
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
    border: '1px solid rgba(255, 255, 255, 0.05)',
    background: 'rgba(0, 0, 0, 0.15)',
    transition: 'all 0.2s',
  },
  checkboxCustom: (checked) => ({
    width: 18,
    height: 18,
    borderRadius: 5,
    border: `2px solid ${checked ? '#e05594' : 'rgba(255, 255, 255, 0.15)'}`,
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
      ? 'linear-gradient(135deg, #c9a227, #f5d680)'
      : 'linear-gradient(135deg, #2ecc71, #27ae60)',
    color: '#0a0512',
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
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    background: 'rgba(255, 255, 255, 0.04)',
    color: 'rgba(232, 224, 240, 0.7)',
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
    color: 'rgba(232, 224, 240, 0.4)',
    marginTop: 4,
    lineHeight: 1.4,
  },
  emptyText: {
    textAlign: 'center',
    color: 'rgba(232, 224, 240, 0.3)',
    fontSize: 13,
    padding: '40px 0',
  },
  fieldGroup: {
    marginBottom: 16,
  },
};

/* ── Bileşen ────────────────────────────────────────────── */
export default function CategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [newCatName, setNewCatName] = useState('');
  const [parentId, setParentId] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSecret, setIsSecret] = useState(false);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCats, setExpandedCats] = useState({});
  const [parentError, setParentError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
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

    try {
      if (editingCategory) {
        const catId = editingCategory.databaseId ?? editingCategory.id;
        await categoryApi.updateAdminCategory(catId, {
          name: finalName,
          parentCategoryId: parentId || null,
          isSecret: isSecret,
          isActive: editingCategory.isActive ?? true,
          sortOrder: editingCategory.sortOrder ?? 0
        });
        setNewCatName('');
        setParentId('');
        setIsSecret(false);
        setEditingCategory(null);
        fetchCategories();
      } else {
        await categoryApi.createAdminCategory({
          name: finalName,
          parentCategoryId: parentId || null,
          isSecret: isSecret
        });
        setNewCatName('');
        setParentId('');
        setIsSecret(false);
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

  const handleEditClick = (cat) => {
    setEditingCategory(cat);
    if (cat.name.endsWith(' [GİZLİ]')) {
      setNewCatName(cat.name.replace(' [GİZLİ]', '').trim());
      setIsSecret(true);
    } else {
      setNewCatName(cat.name);
      setIsSecret(false);
    }
    setParentId(cat.parentCategoryId || '');
    setParentError('');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCatName('');
    setParentId('');
    setIsSecret(false);
    setParentError('');
  };

  const handleDelete = async (id) => {
    if (confirm("Bu kategoriyi (ve varsa alt kategorilerini) silmek istediğinize emin misiniz?")) {
      try {
        await categoryApi.deleteAdminCategory(id);
        if (editingCategory && (editingCategory.databaseId === id || editingCategory.id === id)) {
          handleCancelEdit();
        }
        fetchCategories();
      } catch (err) {
        alert("Kategori silinemedi: " + err.message);
      }
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

            <span style={S.catName(depth)}>
              {displayName}
              {isCategorySecret && (
                <span style={S.secretBadge}>
                  <FiLock size={8} /> GİZLİ
                </span>
              )}
            </span>
          </div>

          <div
            style={{
              ...S.actionBtns,
              opacity: isHover ? 1 : 0.5,
            }}
          >
            <button
              type="button"
              onClick={() => handleToggleStatus(cat)}
              disabled={updatingId === catId}
              style={{
                ...S.statusBtn(cat.isActive),
                opacity: updatingId === catId ? 0.4 : 1,
              }}
              title={cat.isActive ? "Gizlemek için tıkla" : "Göstermek için tıkla"}
            >
              {cat.isActive ? (
                <><FiUnlock size={10} /> Açık</>
              ) : (
                <><FiLock size={10} /> Kilitli</>
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
              style={S.iconBtn('#e05594')}
            >
              <FiTrash2 size={10} /> Sil
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
        <FiRefreshCw size={20} style={{ color: '#f5d680', animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'rgba(232, 224, 240, 0.5)', marginLeft: 10, fontSize: 14 }}>Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div style={S.wrapper}>
      {/* Header */}
      <div style={S.header}>
        <h3 style={S.headerTitle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiFolder size={18} style={{ color: '#f5d680' }} />
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
              e.target.style.borderColor = 'rgba(201, 162, 39, 0.3)';
              e.target.style.boxShadow = '0 0 0 3px rgba(201, 162, 39, 0.08)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
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
              <FiFolder size={24} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
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
            <span style={{ color: editingCategory ? '#f5d680' : '#2ecc71' }}>
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
                  e.target.style.borderColor = 'rgba(201, 162, 39, 0.4)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(201, 162, 39, 0.08)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
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
                <option value="">(Ana Kategori)</option>
                {allowedParents.map(opt => (
                  <option key={opt.id} value={opt.databaseId}>{opt.name}</option>
                ))}
              </select>
              {parentError && <p style={S.errorText}>{parentError}</p>}
            </div>

            {/* Gizli Kategori */}
            <div style={S.fieldGroup}>
              <label
                style={{
                  ...S.checkboxWrap,
                  borderColor: isSecret ? 'rgba(224, 85, 148, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  background: isSecret ? 'rgba(224, 85, 148, 0.06)' : 'rgba(0, 0, 0, 0.15)',
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
                  <span style={{ color: '#e8e0f0', fontSize: 12, fontWeight: 500 }}>
                    Gizli Kategori
                  </span>
                  <span style={S.hintText}>
                    <br />Bu kategori genel listelerde ve filtrelerde gizlenecektir.
                  </span>
                </div>
              </label>
            </div>

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
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
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
