import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiCornerDownRight } from 'react-icons/fi';
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
  
  // Field-specific validation errors
  const [parentError, setParentError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setParentError('');

    try {
      if (editingCategory) {
        // Edit Mode
        const catId = editingCategory.databaseId ?? editingCategory.id;
        await categoryApi.updateAdminCategory(catId, {
          name: newCatName.trim(),
          parentId: parentId || null
        });
        alert("Kategori güncellendi.");
        setNewCatName('');
        setParentId('');
        setEditingCategory(null);
        fetchCategories();
      } else {
        // Create Mode
        await categoryApi.createAdminCategory({
          name: newCatName.trim(),
          parentId: parentId || null
        });
        alert("Kategori eklendi.");
        setNewCatName('');
        setParentId('');
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
    setNewCatName(cat.name);
    setParentId(cat.parentCategoryId || '');
    setParentError('');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCatName('');
    setParentId('');
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

  if (loading) return <p>Yükleniyor...</p>;

  // Recursive category tree renderer with cycle safety and max depth limit
  const renderCategoryNode = (cat, visited = new Set(), depth = 0) => {
    if (!cat || depth > 20) return null;
    
    const catId = String(cat.databaseId ?? cat.id);
    if (!catId || visited.has(catId)) return null;

    const nextVisited = new Set(visited);
    nextVisited.add(catId);

    return (
      <div key={catId} style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', background: depth === 0 ? 'rgba(255,255,255,0.01)' : 'transparent', marginLeft: depth * 20 }}>
          <span style={{ color: depth === 0 ? 'var(--gold-light)' : depth === 1 ? '#fff' : 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            {depth > 0 && <FiCornerDownRight style={{ opacity: 0.5 }} />}
            {cat.name}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => handleEditClick(cat)} className={styles.seeAllBtn} style={{ color: 'var(--gold-light)', padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              Düzenle
            </button>
            <button onClick={() => handleDelete(catId)} className={styles.seeAllBtn} style={{ color: '#e05594', padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiTrash2 /> Sil
            </button>
          </div>
        </div>
        {(cat.children ?? []).map(child => renderCategoryNode(child, nextVisited, depth + 1))}
      </div>
    );
  };

  // Flatten categories list for dropdown selector recursively
  const getFlattenedOptions = (nodes, depth = 0) => {
    let options = [];
    nodes.forEach(node => {
      options.push({ 
        id: node.id, 
        databaseId: node.databaseId ?? node.id,
        name: `${Array(depth).fill('—').join(' ')} ${node.name}`,
        rawNode: node
      });
      if (node.children?.length > 0) {
        options = [...options, ...getFlattenedOptions(node.children, depth + 1)];
      }
    });
    return options;
  };

  const allFlattened = getFlattenedOptions(categories);

  // Filter allowed parents when editing a category to prevent cycle selection
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

  return (
    <div className={styles.sectionCard}>
      <h3 className={styles.sectionTitle}>Kategori Ağacı</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, marginTop: 16 }}>
        {/* Sol Sütun: Ağaç Görünümü */}
        <div style={{ border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-md)', padding: 12, background: 'rgba(0,0,0,0.2)' }}>
          {categories.map(cat => renderCategoryNode(cat, new Set(), 0))}
          {categories.length === 0 && <p className={styles.emptyText}>Henüz kategori eklenmemiştir.</p>}
        </div>

        {/* Sağ Sütun: Yeni Ekleme / Düzenleme */}
        <div style={{ border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-md)', padding: 16, background: 'rgba(255,255,255,0.01)' }}>
          <h4 style={{ color: 'var(--gold-light)', margin: '0 0 16px 0', fontSize: 14 }}>
            {editingCategory ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}
          </h4>
          <form onSubmit={handleSubmit} className={styles.profileForm}>
            <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr', gap: 12 }}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Kategori Adı</label>
                <input type="text" required value={newCatName} onChange={e => setNewCatName(e.target.value)} className={styles.fieldInput} placeholder="Örn: Gümüş Kolyeler" />
              </div>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Üst Kategori (Opsiyonel)</label>
                <select value={parentId} onChange={e => setParentId(e.target.value)} className={styles.fieldInput} style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', borderColor: parentError ? '#e05594' : '' }}>
                  <option value="">(Ana Kategori)</option>
                  {allowedParents.map(opt => <option key={opt.id} value={opt.databaseId}>{opt.name}</option>)}
                </select>
                {parentError && <p style={{ color: '#e05594', fontSize: 11, marginTop: 4, margin: 0 }}>{parentError}</p>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" className={styles.shopBtn} style={{ flex: 1 }}>
                {editingCategory ? "Güncelle" : "Kategori Ekle"}
              </button>
              {editingCategory && (
                <button type="button" onClick={handleCancelEdit} className={styles.seeAllBtn} style={{ color: '#aaa', border: '1px solid #555' }}>
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
