import styles from './ProductsPage.module.css';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../../context/ProductContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import SEO from '../../components/SEO/SEO';
import { ProductCardSkeleton } from '../../components/Skeleton/Skeleton';
import { FiSearch, FiSliders, FiGrid, FiList, FiChevronRight, FiChevronDown, FiBook, FiFolder, FiCheckSquare, FiSquare } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductsPage() {
  const { products, categories, loading } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();

  // Arama parametrelerini oku
  const categoryParam = searchParams.get('kategori') || 'hepsi';
  const subcategoryParam = searchParams.get('alt') || '';
  const searchParam = searchParams.get('ara') || '';

  // Filtre State'leri (Bu filtreler "Ara" butonuna basınca uygulanacak)
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategoryParam);
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [priceRange, setPriceRange] = useState(4000); // Max fiyat (₺)

  // Geçici State'ler (Kullanıcı etkileşimde bulunurken anlık güncellenir)
  const [tempCategory, setTempCategory] = useState(categoryParam);
  const [tempSubcategory, setTempSubcategory] = useState(subcategoryParam);
  const [tempSearchQuery, setTempSearchQuery] = useState(searchParam);
  const [tempPriceRange, setTempPriceRange] = useState(4000);

  // Özel Dropdown Arayüzü State'leri
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [subDropdownOpen, setSubDropdownOpen] = useState(false);
  const [subSearchQuery, setSubSearchQuery] = useState('');

  // URL parametreleri değişince state'i güncelle
  useEffect(() => {
    setSelectedCategory(categoryParam);
    setTempCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    setSelectedSubcategory(subcategoryParam);
    setTempSubcategory(subcategoryParam);
  }, [subcategoryParam]);

  useEffect(() => {
    setSearchQuery(searchParam);
    setTempSearchQuery(searchParam);
  }, [searchParam]);

  // Gizli Kategori Tespiti
  const isCategorySecret = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? (cat.label?.endsWith(' [GİZLİ]') || cat.name?.endsWith(' [GİZLİ]')) : false;
  };

  // Sitede normal kullanıcılara gösterilecek halka açık kategoriler
  const publicCategories = categories.filter(c => !c.label?.endsWith(' [GİZLİ]') && !c.name?.endsWith(' [GİZLİ]'));

  // Filtrelenmiş Ürünler (Aktif/Uygulanmış filtrelere göre listelenenler)
  const filteredProducts = products.filter(p => {
    // Sadece aktif olan ürünler listelenebilir
    if (p.isActive === false) return false;

    // Kategoriye göre filtrele (Gizli kategoriye ait ürünler hepsi listesinde görünmez)
    const matchCategory = selectedCategory === 'hepsi' 
      ? !isCategorySecret(p.categoryId) 
      : p.categoryId === selectedCategory;
    
    // Alt Kategoriye göre filtrele
    const matchSubcategory = !selectedSubcategory || p.subcategory === selectedSubcategory;

    // Arama kelimesine göre filtrele
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Fiyata göre filtrele
    const priceNum = parseFloat(p.price.replace(/[^0-9.,]/g, '').replace(',', '.'));
    const matchPrice = isNaN(priceNum) || priceNum <= priceRange;

    return matchCategory && matchSubcategory && matchSearch && matchPrice;
  });

  // Geçici Filtrelenmiş Ürün Sayısı (Butonun üstünde anlık gösterilecek)
  const tempFilteredCount = products.filter(p => {
    if (p.isActive === false) return false;

    const matchCategory = tempCategory === 'hepsi' 
      ? !isCategorySecret(p.categoryId) 
      : p.categoryId === tempCategory;
    const matchSubcategory = !tempSubcategory || p.subcategory === tempSubcategory;
    const matchSearch = p.name.toLowerCase().includes(tempSearchQuery.toLowerCase());
    const priceNum = parseFloat(p.price.replace(/[^0-9.,]/g, '').replace(',', '.'));
    const matchPrice = isNaN(priceNum) || priceNum <= tempPriceRange;

    return matchCategory && matchSubcategory && matchSearch && matchPrice;
  }).length;

  const handleCategoryChange = (catId) => {
    setTempCategory(catId);
    setTempSubcategory('');
    setCatDropdownOpen(false);
  };

  const handleSubcategoryChange = (catId, subLabel) => {
    setTempSubcategory(subLabel);
    setTempCategory(catId);
    setSubDropdownOpen(false);
    setSubSearchQuery('');
  };

  const handleApplyFilters = () => {
    setSelectedCategory(tempCategory);
    setSelectedSubcategory(tempSubcategory);
    setSearchQuery(tempSearchQuery);
    setPriceRange(tempPriceRange);

    setSearchParams(prev => {
      if (tempCategory === 'hepsi') {
        prev.delete('kategori');
      } else {
        prev.set('kategori', tempCategory);
      }

      if (!tempSubcategory) {
        prev.delete('alt');
      } else {
        prev.set('alt', tempSubcategory);
      }

      if (!tempSearchQuery.trim()) {
        prev.delete('ara');
      } else {
        prev.set('ara', tempSearchQuery.trim());
      }
      return prev;
    });
  };

  const handleResetAll = () => {
    setTempCategory('hepsi');
    setTempSubcategory('');
    setTempSearchQuery('');
    setTempPriceRange(100);

    setSelectedCategory('hepsi');
    setSelectedSubcategory('');
    setSearchQuery('');
    setPriceRange(100);

    setSearchParams({});
  };

  return (
    <div className={styles.shopContainer}>
        
        {/* Üst Kısım: Breadcrumb & Başlık */}
        <div className={styles.shopHeader}>
          <div className={styles.breadcrumb}>
            <a href="/">Ana Sayfa</a>
            <FiChevronRight className={styles.breadIcon} />
            <a href="/urunler" onClick={(e) => { e.preventDefault(); handleCategoryChange('hepsi'); setSearchParams({}); }}>Mağaza</a>
            {selectedCategory !== 'hepsi' && (
              <>
                <FiChevronRight className={styles.breadIcon} />
                <a href={`/urunler?kategori=${selectedCategory}`} onClick={(e) => { e.preventDefault(); setSelectedSubcategory(''); setSearchParams({ kategori: selectedCategory }); }}>
                  {(categories.find(c => c.id === selectedCategory)?.label || '').replace(' [GİZLİ]', '')}
                </a>
              </>
            )}
            {selectedSubcategory && (
              <>
                <FiChevronRight className={styles.breadIcon} />
                <span>{selectedSubcategory}</span>
              </>
            )}
          </div>
          <h2 className={styles.pageTitle}>Tüm Şifa Kaynakları</h2>
          <p className={styles.pageSubtitle}>Ruhunuza ve bedeninize şifa katacak doğal kristaller, aromatik yağlar ve tütsüler</p>
        </div>

        <div className={styles.shopContent}>
          {/* ── SOL TARAF: FİLTRELER ───────────────────────────────── */}
          <aside className={styles.filterSidebar}>
            <div className={styles.filterCard}>
              <div className={styles.filterSectionHeader}>
                <FiSliders /> <span>Filtreler</span>
              </div>

              {/* Arama Kutusu */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Ürün Ara</label>
                <div className={styles.searchForm} style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="İsme göre ara..." 
                    value={tempSearchQuery}
                    onChange={e => setTempSearchQuery(e.target.value)}
                    className={styles.searchInput}
                    style={{ paddingRight: '32px' }}
                  />
                  {tempSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTempSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '32px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.4)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Aramayı Temizle"
                    >
                      ✕
                    </button>
                  )}
                  <span className={styles.searchIconInline}><FiSearch /></span>
                </div>
              </div>

              {/* KATEGORİ SEÇİMİ (CUSTOM DROPDOWN) */}
              <div className={styles.filterGroup}>
                <div className={styles.dropdownLabel}>
                  <FiFolder className={styles.labelIcon} /> <span>KATEGORİ</span>
                </div>
                <div className={styles.customSelectContainer}>
                  <button 
                    type="button" 
                    className={`${styles.selectTrigger} ${catDropdownOpen ? styles.triggerActive : ''}`}
                    onClick={() => { setCatDropdownOpen(!catDropdownOpen); setSubDropdownOpen(false); }}
                  >
                    <span>
                      {tempCategory === 'hepsi' 
                        ? `Tüm Kategoriler (${products.filter(p => p.isActive !== false && !isCategorySecret(p.categoryId)).length})` 
                        : `${(categories.find(c => c.id === tempCategory)?.label || '').replace(' [GİZLİ]', '')} (${products.filter(p => p.categoryId === tempCategory && p.isActive !== false).length})`}
                    </span>
                    <FiChevronDown className={`${styles.triggerChevron} ${catDropdownOpen ? styles.chevronRotated : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {catDropdownOpen && (
                      <motion.div 
                        className={styles.selectDropdown}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                      >
                        <button 
                          type="button"
                          className={`${styles.dropdownOption} ${tempCategory === 'hepsi' ? styles.optionActive : ''}`}
                          onClick={() => handleCategoryChange('hepsi')}
                        >
                          Tüm Kategoriler ({products.filter(p => p.isActive !== false && !isCategorySecret(p.categoryId)).length})
                        </button>
                        {publicCategories.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            className={`${styles.dropdownOption} ${tempCategory === cat.id ? styles.optionActive : ''}`}
                            onClick={() => handleCategoryChange(cat.id)}
                          >
                            {(cat.label || '').replace(' [GİZLİ]', '')} ({products.filter(p => p.categoryId === cat.id && p.isActive !== false).length})
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ALT KATEGORİ SEÇİMİ (CUSTOM DROPDOWN WITH INLINE SEARCH) */}
              <div className={styles.filterGroup}>
                <div className={styles.dropdownLabel}>
                  <FiBook className={styles.labelIcon} /> <span>ALT KATEGORİ</span>
                </div>
                <div className={styles.customSelectContainer}>
                  <button 
                    type="button" 
                    className={`${styles.selectTrigger} ${subDropdownOpen ? styles.triggerActive : ''}`}
                    onClick={() => { setSubDropdownOpen(!subDropdownOpen); setCatDropdownOpen(false); }}
                    disabled={tempCategory === 'hepsi'}
                  >
                    <span>
                      {tempCategory === 'hepsi' 
                        ? 'Önce Kategori Seçin' 
                        : (tempSubcategory || 'Tüm Alt Kategoriler')}
                    </span>
                    <FiChevronDown className={`${styles.triggerChevron} ${subDropdownOpen ? styles.chevronRotated : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {subDropdownOpen && tempCategory !== 'hepsi' && (
                      <motion.div 
                        className={styles.selectDropdownScrollable}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                      >
                        {/* Alt kategoriler var mı kontrol et */}
                        {(() => {
                          const activeCatObj = categories.find(c => c.id === tempCategory);
                          const subList = activeCatObj?.children || [];
                          
                          if (subList.length === 0) {
                            return (
                              <div className={styles.noDataOption}>
                                Alt kategori bulunamadı
                              </div>
                            );
                          }

                          return (
                            <>
                              {/* Arama Kutusu */}
                              <div className={styles.subSearchWrapper}>
                                <input 
                                  type="text" 
                                  placeholder="Alt kategori ara..." 
                                  value={subSearchQuery}
                                  onChange={e => setSubSearchQuery(e.target.value)}
                                  className={styles.subSearchInput}
                                  onClick={e => e.stopPropagation()}
                                />
                                <FiSearch className={styles.subSearchIcon} />
                              </div>

                              <div className={styles.optionsList}>
                                <button 
                                  type="button"
                                  className={`${styles.dropdownOptionCheck} ${!tempSubcategory ? styles.optionCheckActive : ''}`}
                                  onClick={() => handleSubcategoryChange(tempCategory, '')}
                                >
                                  {!tempSubcategory ? <FiCheckSquare /> : <FiSquare />}
                                  <span>Tüm Alt Kategoriler ({products.filter(p => p.categoryId === tempCategory).length})</span>
                                </button>
                                
                                {subList
                                  .filter(ch => ch.label.toLowerCase().includes(subSearchQuery.toLowerCase()))
                                  .map(sub => {
                                    const isSel = tempSubcategory === sub.label;
                                    return (
                                      <button
                                        key={sub.label}
                                        type="button"
                                        className={`${styles.dropdownOptionCheck} ${isSel ? styles.optionCheckActive : ''}`}
                                        onClick={() => handleSubcategoryChange(tempCategory, sub.label)}
                                      >
                                        {isSel ? <FiCheckSquare /> : <FiSquare />}
                                        <span>{sub.label} ({products.filter(p => p.categoryId === tempCategory && p.subcategory === sub.label).length})</span>
                                      </button>
                                    );
                                  })}
                              </div>
                            </>
                          );
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Fiyat Sınırı */}
              <div className={styles.filterGroup}>
                <div className={styles.priceLabelRow}>
                  <label className={styles.filterLabel}>Maksimum Fiyat</label>
                  <span className={styles.priceValue}>{tempPriceRange.toLocaleString('tr-TR')} ₺</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="4000" 
                  step="50"
                  value={tempPriceRange} 
                  onChange={e => setTempPriceRange(Number(e.target.value))}
                  className={styles.rangeInput}
                />
              </div>

              {/* Ara / Uygula Butonu */}
              <div className={styles.filterActionsRow}>
                <button 
                  type="button" 
                  className={styles.applyFiltersBtn} 
                  onClick={handleApplyFilters}
                >
                  <FiSearch /> Filtreleri Uygula ({tempFilteredCount} Ürün)
                </button>
              </div>

            </div>
          </aside>

      <SEO
        title={selectedCategory !== 'hepsi' ? `${selectedCategory} | mysticvelora` : 'Tüm Ürünler | mysticvelora'}
        description="Özel tasarım gümüş kolyeler, yüzükler, bileklikler ve şık aksesuarlar mysticvelora'da."
      />

      {/* ── SAĞ TARAF: ÜRÜN GRİDİ ──────────────────────────────── */}
      <main className={styles.productsArea}>
        <div className={styles.resultsInfoRow}>
          <span>{loading ? 'Yükleniyor...' : `${filteredProducts.length} ürün listeleniyor`}</span>
        </div>

        {loading ? (
          <div className={styles.productsGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className={styles.emptyGridState}>
            <span className={styles.emptyGridIcon}>🔍</span>
            <p>Aradığınız kriterlere uygun ürün bulunamadı.</p>
            <button 
              onClick={handleResetAll}
              className={styles.resetFiltersBtn}
            >
              Filtreleri Temizle
            </button>
          </div>
        ) : (
          <div className={styles.productsGrid}>
            {filteredProducts.map(p => (
              <div key={p.id} className={styles.cardWrapper}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </main>
        </div>

      </div>
  );
}
