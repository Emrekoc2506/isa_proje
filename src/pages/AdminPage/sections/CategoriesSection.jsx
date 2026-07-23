import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiCornerDownRight, FiChevronDown, FiChevronRight, FiLock, FiUnlock, FiSearch, FiEdit3 } from 'react-icons/fi';
import * as categoryApi from '../../../services/categoryApi';
import { collectDescendantIds } from '../../../utils/categoryTree';
import styles from '../AdminPage.module.css';

export default function CategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [newCatName, setNewCatName] = useState('');
  const [parentId, setParentId] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSecret, setIsSecret] = useState(false); // Gizli Kategori Checkbox'ı
  
  // UI State'leri
  const [searchQuery, setSearchQuery] = useState(''); // Kategori arama
  const [expandedCats, setExpandedCats] = useState({}); // Daraltılabilen kategoriler
  const [parentError, setParentError] = useState('');
  const [updatingId, setUpdatingId] = useState(null); // Switch yükleniyor efekti için

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
    if (!newCatName.trim()) return;

    setParentError('');

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
        // Edit Mode
        const catId = editingCategory.databaseId ?? editingCategory.id;
        await categoryApi.updateAdminCategory(catId, {
          name: finalName,
          parentCategoryId: parentId || null,
          isSecret: isSecret,
          isActive: editingCategory.isActive ?? true,
          sortOrder: editingCategory.sortOrder ?? 0
        });
        alert("Kategori güncellendi.");
        setNewCatName('');
        setParentId('');
        setIsSecret(false);
        setEditingCategory(null);
        fetchCategories();
      } else {
        // Create Mode
        await categoryApi.createAdminCategory({
          name: finalName,
          parentCategoryId: parentId || null,
          isSecret: isSecret
        });
        alert("Kategori eklendi.");
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

    return (
      <div key={catId} style={{ display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' }}>
        
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '10px 14px', 
            borderBottom: '1px solid rgba(255,255,255,0.03)', 
            background: depth === 0 ? 'rgba(255,255,255,0.015)' : 'transparent', 
            marginLeft: depth * 22,
            borderRadius: 6,
            marginBottom: 4,
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.04)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = depth === 0 ? 'rgba(255,255,255,0.015)' : 'transparent'}
        >
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {hasChildren ? (
              <button 
                type="button" 
                onClick={() => toggleExpand(catId)}
                style={{ background: 'transparent', border: 'none', color: 'var(--gold-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
              >
                {isExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
              </button>
            ) : (
              depth > 0 && <FiCornerDownRight style={{ opacity: 0.4, color: 'var(--text-muted)' }} size={14} />
            )}
            
            <span style={{ 
              color: depth === 0 ? 'var(--gold-light)' : depth === 1 ? '#fff' : 'var(--text-secondary)', 
              fontSize: 13, 
              fontWeight: depth === 0 ? '600' : 'normal',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              {displayName}

              {isCategorySecret && (
                <span style={{ fontSize: 9, background: 'rgba(224, 85, 148, 0.15)', color: '#e05594', padding: '1px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 'bold' }}>
                  <FiLock size={8} /> GİZLİ
                </span>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            
            <button 
              type="button"
              onClick={() => handleToggleStatus(cat)}
              disabled={updatingId === catId}
              style={{
                background: cat.isActive ? 'rgba(46, 204, 113, 0.1)' : 'rgba(224, 85, 148, 0.1)',
                border: 'none',
                color: cat.isActive ? '#2ecc71' : '#e05594',
                padding: '4px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s',
                opacity: updatingId === catId ? 0.5 : 1
              }}
              title={cat.isActive ? "Sitede Görünür (Gizlemek için Tıkla)" : "Sitede Gizli (Göstermek için Tıkla)"}
            >
              {cat.isActive ? (
                <>
                  <FiUnlock size={11} /> <span>Açık</span>
                </>
              ) : (
                <>
                  <FiLock size={11} /> <span>Kilitli</span>
                </>
              )}
            </button>

            <button 
              onClick={() => handleEditClick(cat)} 
              className={styles.seeAllBtn} 
              style={{ color: 'var(--gold-light)', padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <FiEdit3 size={11} /> Düzenle
            </button>
            
            <button 
              onClick={() => handleDelete(catId)} 
              className={styles.seeAllBtn} 
              style={{ color: '#e05594', padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <FiTrash2 size={11} /> Sil
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
        name: `${Array(depth).fill('—').join(' ')} ${cleanName}`,
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

  if (loading && categories.length === 0) return <p>Yükleniyor...</p>;

  return (
    <div className={styles.sectionCard} style={{ border: '1px solid rgba(201, 162, 39, 0.1)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 className={styles.sectionTitle}>Kategori Ağacı</h3>
        
        <div style={{ position: 'relative', width: 220 }}>
          <input 
            type="text" 
            placeholder="Kategori ara..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={styles.fieldInput}
            style={{ paddingLeft: 30, paddingRight: 10, height: 32, fontSize: 12, margin: 0 }}
          />
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={13} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, marginTop: 16 }}>
        <div style={{ border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-md)', padding: 12, background: 'rgba(0,0,0,0.25)', maxHeight: '500px', overflowY: 'auto' }}>
          {categories.map(cat => renderCategoryNode(cat, new Set(), 0))}
          {categories.length === 0 && <p className={styles.emptyText}>Henüz kategori eklenmemiştir.</p>}
        </div>

        <div style={{ border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-md)', padding: 16, background: 'rgba(255,255,255,0.015)', height: 'fit-content' }}>
          <h4 style={{ color: 'var(--gold-light)', margin: '0 0 16px 0', fontSize: 13, fontWeight: '600' }}>
            {editingCategory ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}
          </h4>
          <form onSubmit={handleSubmit} className={styles.profileForm}>
            <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr', gap: 14 }}>
              
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Kategori Adı *</label>
                <input 
                  type="text" 
                  required 
                  value={newCatName} 
                  onChange={e => {
                    setNewCatName(e.target.value);
                    if (parentError) setParentError('');
                  }} 
                  className={styles.fieldInput} 
                  placeholder="Örn: Gümüş Kolyeler" 
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Üst Kategori (Opsiyonel)</label>
                <select 
                  value={parentId} 
                  onChange={e => {
                    setParentId(e.target.value);
                    if (parentError) setParentError('');
                  }} 
                  className={styles.fieldInput} 
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', borderColor: parentError ? '#e05594' : '' }}
                >
                  <option value="">(Ana Kategori)</option>
                  {allowedParents.map(opt => <option key={opt.id} value={opt.databaseId}>{opt.name}</option>)}
                </select>
                {parentError && <p style={{ color: '#e05594', fontSize: 11, marginTop: 4, margin: 0 }}>{parentError}</p>}
              </div>

              <div className={styles.formField}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 12, cursor: 'pointer', userSelect: 'none', padding: '4px 0' }}>
                  <input 
                    type="checkbox" 
                    checked={isSecret} 
                    onChange={e => setIsSecret(e.target.checked)} 
                  />
                  <FiLock size={12} style={{ color: isSecret ? '#e05594' : 'var(--text-muted)' }} />
                  <span>Gizli Kategori (Menüde gizle)</span>
                </label>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', display: 'block', marginTop: 2, lineHeight: 1.3 }}>
                  * Bu kategori sitedeki genel listelerde ve filtrelerde gizlenecektir.
                </span>
              </div>

            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <button type="submit" className={styles.shopBtn} style={{ flex: 1, height: 34, fontSize: 12 }}>
                {editingCategory ? "Güncelle" : "Kategori Ekle"}
              </button>
              {editingCategory && (
                <button 
                  type="button" 
                  onClick={handleCancelEdit} 
                  className={styles.seeAllBtn} 
                  style={{ color: '#aaa', border: '1px solid #555', padding: '4px 12px', fontSize: 12 }}
                >
                  İptal
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
