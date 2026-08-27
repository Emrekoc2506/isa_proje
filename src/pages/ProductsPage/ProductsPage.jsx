import styles from './ProductsPage.module.css'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProducts } from '../../context/ProductContext'
import ProductCard from '../../components/ProductCard/ProductCard'
import SEO from '../../components/SEO/SEO'
import { ProductCardSkeleton } from '../../components/Skeleton/Skeleton'
import {
  FiSearch,
  FiSliders,
  FiChevronRight,
  FiChevronLeft,
  FiChevronDown,
  FiBook,
  FiFolder,
  FiCheckSquare,
  FiSquare
} from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProductsPage () {
  const { products, categories, loading, loadProducts } = useProducts()
  const [loadingProductsPage, setLoadingProductsPage] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const productsAreaRef = useRef(null)

  const ITEMS_PER_PAGE = 16

  useEffect(() => {
    if (products.length === 0 && typeof loadProducts === 'function') {
      setLoadingProductsPage(true)
      loadProducts({ pageSize: 500 }).finally(() =>
        setLoadingProductsPage(false)
      )
    }
  }, [products.length, loadProducts])

  const isPageLoading = loading || loadingProductsPage

  // Arama parametrelerini oku
  const categoryParam = searchParams.get('kategori') || 'hepsi'
  const subcategoryParam = searchParams.get('alt') || ''
  const searchParam = searchParams.get('ara') || ''
  const pageParam = parseInt(searchParams.get('sayfa') || '1', 10)
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam

  // Filtre State'leri (Bu filtreler "Ara" butonuna basınca uygulanacak)
  const [selectedCategory, setSelectedCategory] = useState(categoryParam)
  const [selectedSubcategory, setSelectedSubcategory] =
    useState(subcategoryParam)
  const [searchQuery, setSearchQuery] = useState(searchParam)
  const [priceRange, setPriceRange] = useState(100000) // Max fiyat (₺)

  // Geçici State'ler (Kullanıcı etkileşimde bulunurken anlık güncellenir)
  const [tempCategory, setTempCategory] = useState(categoryParam)
  const [tempSubcategory, setTempSubcategory] = useState(subcategoryParam)
  const [tempSearchQuery, setTempSearchQuery] = useState(searchParam)
  const [tempPriceRange, setTempPriceRange] = useState(100000)

  // Özel Dropdown Arayüzü State'leri
  const [catDropdownOpen, setCatDropdownOpen] = useState(false)
  const [subDropdownOpen, setSubDropdownOpen] = useState(false)
  const [subSearchQuery, setSubSearchQuery] = useState('')

  // URL parametreleri değişince state'i güncelle
  useEffect(() => {
    setSelectedCategory(categoryParam)
    setTempCategory(categoryParam)
  }, [categoryParam])

  useEffect(() => {
    setSelectedSubcategory(subcategoryParam)
    setTempSubcategory(subcategoryParam)
  }, [subcategoryParam])

  useEffect(() => {
    setSearchQuery(searchParam)
    setTempSearchQuery(searchParam)
  }, [searchParam])

  // Gizli Kategori Tespiti
  const isCategorySecret = catId => {
    const cat = categories.find(c => c.id === catId)
    return cat
      ? cat.label?.endsWith(' [GİZLİ]') || cat.name?.endsWith(' [GİZLİ]')
      : false
  }

  // Sitede normal kullanıcılara gösterilecek halka açık kategoriler
  const publicCategories = categories.filter(
    c => !c.label?.endsWith(' [GİZLİ]') && !c.name?.endsWith(' [GİZLİ]')
  )

  // Fiyat ayrıştırma (Türkçe format, sayı, string uyumlu)
  const parsePrice = priceVal => {
    if (typeof priceVal === 'number') return priceVal
    if (!priceVal) return 0
    const str = String(priceVal).trim()
    let clean = str.replace(/[^0-9.,]/g, '')
    if (clean.includes('.') && clean.includes(',')) {
      clean = clean.replace(/\./g, '').replace(',', '.')
    } else if (clean.includes('.')) {
      if (/\.\d{3}$/.test(clean)) {
        clean = clean.replace(/\./g, '')
      }
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.')
    }
    const val = parseFloat(clean)
    return isNaN(val) ? 0 : val
  }

  // Slug dönüştürücü
  const toSlug = str =>
    String(str || '')
      .toLowerCase()
      .trim()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

  // Kategori Etiketi Bulucu
  const getCategoryLabel = catId => {
    if (!catId || catId === 'hepsi') return 'Tüm Kategoriler'
    const targetStr = String(catId).toLowerCase().trim()
    const targetSlug = toSlug(catId)
    const cat = categories.find(
      c =>
        String(c.id).toLowerCase() === targetStr ||
        String(c.databaseId || '').toLowerCase() === targetStr ||
        String(c.slug || '').toLowerCase() === targetStr ||
        String(c.name || '').toLowerCase() === targetStr ||
        String(c.label || '').toLowerCase() === targetStr ||
        toSlug(c.slug || c.name || c.label) === targetSlug
    )
    return cat
      ? (cat.label || cat.name || '').replace(' [GİZLİ]', '')
      : String(catId)
  }

  // Kategori Eşleştirme (Slug, ID, DatabaseId, İsim ve Alt Kategorileri kapsar)
  const isProductInCategory = (product, targetCat, catList) => {
    if (!targetCat || targetCat === 'hepsi') {
      return !isCategorySecret(product.categoryId)
    }
    const targetStr = String(targetCat).toLowerCase().trim()
    const targetSlug = toSlug(targetCat)

    const matchedCats = (catList || categories).filter(
      c =>
        String(c.id).toLowerCase() === targetStr ||
        String(c.databaseId || '').toLowerCase() === targetStr ||
        String(c.slug || '').toLowerCase() === targetStr ||
        String(c.name || '').toLowerCase() === targetStr ||
        String(c.label || '').toLowerCase() === targetStr ||
        toSlug(c.slug || c.name || c.label) === targetSlug
    )

    const validKeys = new Set()
    if (targetStr) validKeys.add(targetStr)
    if (targetSlug) validKeys.add(targetSlug)

    matchedCats.forEach(c => {
      if (c.id) validKeys.add(String(c.id).toLowerCase().trim())
      if (c.databaseId) validKeys.add(String(c.databaseId).toLowerCase().trim())
      if (c.slug) validKeys.add(String(c.slug).toLowerCase().trim())
      if (c.name) validKeys.add(String(c.name).toLowerCase().trim())
      if (c.label) validKeys.add(String(c.label).toLowerCase().trim())
      const s = toSlug(c.slug || c.name || c.label)
      if (s) validKeys.add(s)

      if (Array.isArray(c.children)) {
        c.children.forEach(sub => {
          if (sub.id) validKeys.add(String(sub.id).toLowerCase().trim())
          if (sub.databaseId)
            validKeys.add(String(sub.databaseId).toLowerCase().trim())
          if (sub.slug) validKeys.add(String(sub.slug).toLowerCase().trim())
          if (sub.name) validKeys.add(String(sub.name).toLowerCase().trim())
          if (sub.label) validKeys.add(String(sub.label).toLowerCase().trim())
          const subS = toSlug(sub.slug || sub.name || sub.label)
          if (subS) validKeys.add(subS)
        })
      }
    })
    validKeys.delete('')

    const pCatId = String(product.categoryId || '')
      .toLowerCase()
      .trim()
    const pSubCatId = String(product.subcategoryId || '')
      .toLowerCase()
      .trim()
    const pCatName = String(product.categoryName || product.category || '')
      .toLowerCase()
      .trim()
    const pSubCatName = String(product.subcategory || product.subCategory || '')
      .toLowerCase()
      .trim()

    return (
      (Boolean(pCatId) && validKeys.has(pCatId)) ||
      (Boolean(pSubCatId) && validKeys.has(pSubCatId)) ||
      (Boolean(pCatName) && validKeys.has(pCatName)) ||
      (Boolean(pSubCatName) && validKeys.has(pSubCatName)) ||
      (Boolean(pCatName) && validKeys.has(toSlug(pCatName))) ||
      (Boolean(pSubCatName) && validKeys.has(toSlug(pSubCatName)))
    )
  }

  // Alt Kategori Eşleştirme (Slug, ID, DatabaseId, İsim, Label esnek uyumlu)
  const isProductInSubcategory = (product, targetSub) => {
    if (!targetSub || targetSub === 'hepsi') return true

    const targetStr = String(targetSub).toLowerCase().trim()
    const targetSlug = toSlug(targetSub)

    const targetKeys = new Set()
    if (targetStr) targetKeys.add(targetStr)
    if (targetSlug) targetKeys.add(targetSlug)

    // Categories ağacındaki alt kategorileri tara ve targetSub ile eşleşen alt kategorinin tüm tanımlayıcılarını targetKeys'e ekle
    for (const cat of categories) {
      if (Array.isArray(cat.children)) {
        for (const sub of cat.children) {
          const subAliases = new Set()
          if (sub.id) subAliases.add(String(sub.id).toLowerCase().trim())
          if (sub.databaseId)
            subAliases.add(String(sub.databaseId).toLowerCase().trim())
          if (sub.slug) subAliases.add(String(sub.slug).toLowerCase().trim())
          if (sub.name) subAliases.add(String(sub.name).toLowerCase().trim())
          if (sub.label) subAliases.add(String(sub.label).toLowerCase().trim())
          const subSlug = toSlug(sub.slug || sub.name || sub.label)
          if (subSlug) subAliases.add(subSlug)
          subAliases.delete('')

          // Eğer bu alt kategori aranan targetSub ile eşleşiyorsa tüm alias'larını targetKeys'e ekle
          const isMatch = Array.from(subAliases).some(alias =>
            targetKeys.has(alias)
          )
          if (isMatch) {
            subAliases.forEach(alias => targetKeys.add(alias))
          }
        }
      }
    }
    targetKeys.delete('')

    // Şimdi ürünün alt kategori bilgilerini topla (sadece boş olmayan değerler)
    const productSubKeys = new Set()

    const pSubCatId = String(product.subcategoryId || '')
      .toLowerCase()
      .trim()
    if (pSubCatId) productSubKeys.add(pSubCatId)

    const pSubCatName = String(product.subcategory || product.subCategory || '')
      .toLowerCase()
      .trim()
    if (pSubCatName) {
      productSubKeys.add(pSubCatName)
      const s = toSlug(pSubCatName)
      if (s) productSubKeys.add(s)
    }

    const pCatId = String(product.categoryId || '')
      .toLowerCase()
      .trim()
    if (pCatId) productSubKeys.add(pCatId)

    const pCatName = String(product.categoryName || product.category || '')
      .toLowerCase()
      .trim()
    if (pCatName) {
      productSubKeys.add(pCatName)
      const s = toSlug(pCatName)
      if (s) productSubKeys.add(s)
    }

    productSubKeys.delete('')

    // Ürünün tanımlayıcılarından herhangi biri targetKeys içinde var mı?
    for (const key of productSubKeys) {
      if (targetKeys.has(key)) {
        return true
      }
    }

    return false
  }

  // Filtrelenmiş Ürünler (Aktif/Uygulanmış filtrelere göre listelenenler)
  const filteredProducts = products.filter(p => {
    if (p.isActive === false) return false

    // Kategoriye göre filtrele
    const matchCategory = isProductInCategory(p, selectedCategory, categories)

    // Alt Kategoriye göre filtrele
    const matchSubcategory = isProductInSubcategory(p, selectedSubcategory)

    // Arama kelimesine göre filtrele
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())

    // Fiyata göre filtrele
    const priceNum = parsePrice(p.price)
    const matchPrice = isNaN(priceNum) || priceNum <= priceRange

    return matchCategory && matchSubcategory && matchSearch && matchPrice
  })

  // Geçici Filtrelenmiş Ürün Sayısı (Butonun üstünde anlık gösterilecek)
  const tempFilteredCount = products.filter(p => {
    if (p.isActive === false) return false

    const matchCategory = isProductInCategory(p, tempCategory, categories)
    const matchSubcategory = isProductInSubcategory(p, tempSubcategory)
    const matchSearch = p.name
      .toLowerCase()
      .includes(tempSearchQuery.toLowerCase())
    const priceNum = parsePrice(p.price)
    const matchPrice = isNaN(priceNum) || priceNum <= tempPriceRange

    return matchCategory && matchSubcategory && matchSearch && matchPrice
  }).length

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  )

  const scrollToProductsTop = () => {
    if (productsAreaRef.current) {
      const yOffset = -90
      const y =
        productsAreaRef.current.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePageChange = newPage => {
    if (newPage < 1 || newPage > totalPages || newPage === validCurrentPage)
      return
    setSearchParams(prev => {
      if (newPage === 1) {
        prev.delete('sayfa')
      } else {
        prev.set('sayfa', String(newPage))
      }
      return prev
    })
    scrollToProductsTop()
  }

  const handleCategoryChange = catId => {
    setTempCategory(catId)
    setTempSubcategory('')
    setCatDropdownOpen(false)
  }

  const handleSubcategoryChange = (catId, subLabel) => {
    setTempSubcategory(subLabel)
    setTempCategory(catId)
    setSubDropdownOpen(false)
    setSubSearchQuery('')
  }

  const handleApplyFilters = () => {
    setSelectedCategory(tempCategory)
    setSelectedSubcategory(tempSubcategory)
    setSearchQuery(tempSearchQuery)
    setPriceRange(tempPriceRange)

    setSearchParams(prev => {
      prev.delete('sayfa')
      if (tempCategory === 'hepsi') {
        prev.delete('kategori')
      } else {
        prev.set('kategori', tempCategory)
      }

      if (!tempSubcategory) {
        prev.delete('alt')
      } else {
        prev.set('alt', tempSubcategory)
      }

      if (!tempSearchQuery.trim()) {
        prev.delete('ara')
      } else {
        prev.set('ara', tempSearchQuery.trim())
      }
      return prev
    })
    scrollToProductsTop()
  }

  const handleResetAll = () => {
    setTempCategory('hepsi')
    setTempSubcategory('')
    setTempSearchQuery('')
    setTempPriceRange(100)

    setSelectedCategory('hepsi')
    setSelectedSubcategory('')
    setSearchQuery('')
    setPriceRange(100)

    setSearchParams({})
    scrollToProductsTop()
  }

  // Category SEO & Schema Calculation
  const matchedCategoryObj = categories.find(
    c =>
      String(c.id) === String(selectedCategory) ||
      String(c.databaseId || '') === String(selectedCategory) ||
      c.slug === selectedCategory ||
      c.name?.toLowerCase() === String(selectedCategory).toLowerCase() ||
      toSlug(c.slug || c.name || c.label) === toSlug(selectedCategory)
  )

  let pageTitle = 'Tüm Ürünler | Muhristan'
  let pageDesc =
    'Muhristan koleksiyonundaki özel tasarım takı, vefk ve spiritüel ürünleri inceleyin.'
  let pageKeywords = null
  let pageImage = matchedCategoryObj?.imageUrl || '/logo-2.png'
  let pageCanonical = matchedCategoryObj?.canonicalUrl || null
  let pageJsonLd = null

  if (matchedCategoryObj) {
    pageTitle =
      matchedCategoryObj.seoTitle || `${matchedCategoryObj.name} | Muhristan`
    pageDesc =
      matchedCategoryObj.seoDescription ||
      matchedCategoryObj.description ||
      `Muhristan ${matchedCategoryObj.name} kategorisindeki özel tasarım takıları ve spiritüel ürünleri keşfedin.`
    pageKeywords = matchedCategoryObj.seoKeywords || null
    if (!pageCanonical) {
      pageCanonical = `https://muhristan.com/urunler?kategori=${encodeURIComponent(
        matchedCategoryObj.slug || matchedCategoryObj.name
      )}`
    }

    pageJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Ana Sayfa',
          item: 'https://muhristan.com/'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: matchedCategoryObj.name,
          item: pageCanonical
        }
      ]
    }
  } else if (searchParam) {
    pageTitle = `"${searchParam}" Arama Sonuçları | Muhristan`
    pageDesc = `"${searchParam}" aramasına ait ürün sonuçları Muhristan mağazasında.`
  }

  return (
    <div className={styles.shopContainer}>
      <SEO
        title={pageTitle}
        description={pageDesc}
        keywords={pageKeywords}
        canonical={pageCanonical}
        image={pageImage}
        jsonLd={pageJsonLd}
        noindex={Boolean(searchParam && searchParam.trim())}
      />

      {/* Üst Kısım: Breadcrumb & Başlık */}
      <div className={styles.shopHeader}>
        <div className={styles.breadcrumb}>
          <a href='/'>Ana Sayfa</a>
          <FiChevronRight className={styles.breadIcon} />
          <a
            href='/urunler'
            onClick={e => {
              e.preventDefault()
              handleCategoryChange('hepsi')
              setSearchParams({})
            }}
          >
            Mağaza
          </a>
          {selectedCategory !== 'hepsi' && (
            <>
              <FiChevronRight className={styles.breadIcon} />
              <a
                href={`/urunler?kategori=${selectedCategory}`}
                onClick={e => {
                  e.preventDefault()
                  setSelectedSubcategory('')
                  setSearchParams({ kategori: selectedCategory })
                }}
              >
                {getCategoryLabel(selectedCategory)}
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
        <p className={styles.pageSubtitle}>
          Ruhunuza ve bedeninize şifa katacak doğal kristaller, aromatik yağlar
          ve tütsüler
        </p>
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
              <div
                className={styles.searchForm}
                style={{ position: 'relative' }}
              >
                <input
                  type='text'
                  placeholder='İsme göre ara...'
                  value={tempSearchQuery}
                  onChange={e => setTempSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  style={{ paddingRight: '32px' }}
                />
                {tempSearchQuery && (
                  <button
                    type='button'
                    onClick={() => setTempSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '32px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title='Aramayı Temizle'
                  >
                    ✕
                  </button>
                )}
                <span className={styles.searchIconInline}>
                  <FiSearch />
                </span>
              </div>
            </div>

            {/* KATEGORİ SEÇİMİ (CUSTOM DROPDOWN) */}
            <div className={styles.filterGroup}>
              <div className={styles.dropdownLabel}>
                <FiFolder className={styles.labelIcon} /> <span>KATEGORİ</span>
              </div>
              <div className={styles.customSelectContainer}>
                <button
                  type='button'
                  className={`${styles.selectTrigger} ${
                    catDropdownOpen ? styles.triggerActive : ''
                  }`}
                  onClick={() => {
                    setCatDropdownOpen(!catDropdownOpen)
                    setSubDropdownOpen(false)
                  }}
                >
                  <span>
                    {tempCategory === 'hepsi'
                      ? `Tüm Kategoriler (${
                          products.filter(
                            p =>
                              p.isActive !== false &&
                              !isCategorySecret(p.categoryId)
                          ).length
                        })`
                      : `${getCategoryLabel(tempCategory)} (${
                          products.filter(
                            p =>
                              p.isActive !== false &&
                              isProductInCategory(p, tempCategory, categories)
                          ).length
                        })`}
                  </span>
                  <FiChevronDown
                    className={`${styles.triggerChevron} ${
                      catDropdownOpen ? styles.chevronRotated : ''
                    }`}
                  />
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
                        type='button'
                        className={`${styles.dropdownOption} ${
                          tempCategory === 'hepsi' ? styles.optionActive : ''
                        }`}
                        onClick={() => handleCategoryChange('hepsi')}
                      >
                        Tüm Kategoriler (
                        {
                          products.filter(
                            p =>
                              p.isActive !== false &&
                              !isCategorySecret(p.categoryId)
                          ).length
                        }
                        )
                      </button>
                      {publicCategories.map(cat => (
                        <button
                          key={cat.id}
                          type='button'
                          className={`${styles.dropdownOption} ${
                            tempCategory === cat.id ? styles.optionActive : ''
                          }`}
                          onClick={() => handleCategoryChange(cat.id)}
                        >
                          {(cat.label || cat.name || '').replace(
                            ' [GİZLİ]',
                            ''
                          )}{' '}
                          (
                          {
                            products.filter(
                              p =>
                                p.isActive !== false &&
                                isProductInCategory(p, cat.id, categories)
                            ).length
                          }
                          )
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
                <FiBook className={styles.labelIcon} />{' '}
                <span>ALT KATEGORİ</span>
              </div>
              <div className={styles.customSelectContainer}>
                <button
                  type='button'
                  className={`${styles.selectTrigger} ${
                    subDropdownOpen ? styles.triggerActive : ''
                  }`}
                  onClick={() => {
                    setSubDropdownOpen(!subDropdownOpen)
                    setCatDropdownOpen(false)
                  }}
                  disabled={tempCategory === 'hepsi'}
                >
                  <span>
                    {tempCategory === 'hepsi'
                      ? 'Önce Kategori Seçin'
                      : tempSubcategory || 'Tüm Alt Kategoriler'}
                  </span>
                  <FiChevronDown
                    className={`${styles.triggerChevron} ${
                      subDropdownOpen ? styles.chevronRotated : ''
                    }`}
                  />
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
                        const activeCatObj = categories.find(
                          c =>
                            String(c.id) === String(tempCategory) ||
                            String(c.databaseId || '') ===
                              String(tempCategory) ||
                            c.slug === tempCategory ||
                            c.name?.toLowerCase() ===
                              String(tempCategory).toLowerCase() ||
                            toSlug(c.slug || c.name || c.label) ===
                              toSlug(tempCategory)
                        )
                        const subList = activeCatObj?.children || []

                        if (subList.length === 0) {
                          return (
                            <div className={styles.noDataOption}>
                              Alt kategori bulunamadı
                            </div>
                          )
                        }

                        return (
                          <>
                            {/* Arama Kutusu */}
                            <div className={styles.subSearchWrapper}>
                              <input
                                type='text'
                                placeholder='Alt kategori ara...'
                                value={subSearchQuery}
                                onChange={e =>
                                  setSubSearchQuery(e.target.value)
                                }
                                className={styles.subSearchInput}
                                onClick={e => e.stopPropagation()}
                              />
                              <FiSearch className={styles.subSearchIcon} />
                            </div>

                            <div className={styles.optionsList}>
                              <button
                                type='button'
                                className={`${styles.dropdownOptionCheck} ${
                                  !tempSubcategory
                                    ? styles.optionCheckActive
                                    : ''
                                }`}
                                onClick={() =>
                                  handleSubcategoryChange(tempCategory, '')
                                }
                              >
                                {!tempSubcategory ? (
                                  <FiCheckSquare />
                                ) : (
                                  <FiSquare />
                                )}
                                <span>
                                  Tüm Alt Kategoriler (
                                  {
                                    products.filter(
                                      p =>
                                        p.isActive !== false &&
                                        isProductInCategory(
                                          p,
                                          tempCategory,
                                          categories
                                        )
                                    ).length
                                  }
                                  )
                                </span>
                              </button>

                              {subList
                                .filter(ch =>
                                  (ch.label || ch.name || '')
                                    .toLowerCase()
                                    .includes(subSearchQuery.toLowerCase())
                                )
                                .map(sub => {
                                  const subLabel = sub.label || sub.name
                                  const isSel =
                                    tempSubcategory === subLabel ||
                                    tempSubcategory === sub.id ||
                                    tempSubcategory === sub.slug
                                  return (
                                    <button
                                      key={sub.id || subLabel}
                                      type='button'
                                      className={`${
                                        styles.dropdownOptionCheck
                                      } ${
                                        isSel ? styles.optionCheckActive : ''
                                      }`}
                                      onClick={() =>
                                        handleSubcategoryChange(
                                          tempCategory,
                                          subLabel
                                        )
                                      }
                                    >
                                      {isSel ? <FiCheckSquare /> : <FiSquare />}
                                      <span>
                                        {subLabel} (
                                        {
                                          products.filter(
                                            p =>
                                              p.isActive !== false &&
                                              isProductInCategory(
                                                p,
                                                tempCategory,
                                                categories
                                              ) &&
                                              isProductInSubcategory(
                                                p,
                                                sub.id ||
                                                  sub.databaseId ||
                                                  subLabel
                                              )
                                          ).length
                                        }
                                        )
                                      </span>
                                    </button>
                                  )
                                })}
                            </div>
                          </>
                        )
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
                <span className={styles.priceValue}>
                  {tempPriceRange.toLocaleString('tr-TR')} ₺
                </span>
              </div>
              <input
                type='range'
                min='0'
                max='4000'
                step='50'
                value={tempPriceRange}
                onChange={e => setTempPriceRange(Number(e.target.value))}
                className={styles.rangeInput}
              />
            </div>

            {/* Ara / Uygula Butonu */}
            <div className={styles.filterActionsRow}>
              <button
                type='button'
                className={styles.applyFiltersBtn}
                onClick={handleApplyFilters}
              >
                <FiSearch /> Filtreleri Uygula ({tempFilteredCount} Ürün)
              </button>
            </div>
          </div>
        </aside>

        {/* ── SAĞ TARAF: ÜRÜN GRİDİ ──────────────────────────────── */}
        <main className={styles.productsArea} ref={productsAreaRef}>
          <div className={styles.resultsInfoRow}>
            <span>
              {isPageLoading
                ? 'Yükleniyor...'
                : `${filteredProducts.length} ürün listeleniyor (Sayfa ${validCurrentPage} / ${totalPages})`}
            </span>
          </div>

          {isPageLoading ? (
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
            <>
              <div className={styles.productsGrid}>
                {paginatedProducts.map(p => (
                  <div key={p.id} className={styles.cardWrapper}>
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>

              {/* Sayfalama Kontrolleri */}
              {totalPages > 1 && (
                <nav
                  className={styles.paginationContainer}
                  aria-label='Ürün Sayfalama'
                >
                  <div className={styles.paginationButtons}>
                    <button
                      type='button'
                      className={styles.pageBtn}
                      onClick={() => handlePageChange(validCurrentPage - 1)}
                      disabled={validCurrentPage <= 1}
                      aria-label='Önceki Sayfa'
                    >
                      <FiChevronLeft /> Önceki
                    </button>

                    {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                      .filter(page => {
                        return (
                          page === 1 ||
                          page === totalPages ||
                          (page >= validCurrentPage - 2 &&
                            page <= validCurrentPage + 2)
                        )
                      })
                      .map((page, index, array) => {
                        const prevPage = array[index - 1]
                        const showEllipsis = prevPage && page - prevPage > 1

                        return (
                          <div
                            key={page}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8
                            }}
                          >
                            {showEllipsis && (
                              <span className={styles.pageEllipsis}>...</span>
                            )}
                            <button
                              type='button'
                              className={`${styles.pageBtn} ${
                                page === validCurrentPage
                                  ? styles.pageBtnActive
                                  : ''
                              }`}
                              onClick={() => handlePageChange(page)}
                              aria-current={
                                page === validCurrentPage ? 'page' : undefined
                              }
                              aria-label={`Sayfa ${page}`}
                            >
                              {page}
                            </button>
                          </div>
                        )
                      })}

                    <button
                      type='button'
                      className={styles.pageBtn}
                      onClick={() => handlePageChange(validCurrentPage + 1)}
                      disabled={validCurrentPage >= totalPages}
                      aria-label='Sonraki Sayfa'
                    >
                      Sonraki <FiChevronRight />
                    </button>
                  </div>
                  <span className={styles.paginationSummary}>
                    Sayfa {validCurrentPage} / {totalPages} (Toplam{' '}
                    {filteredProducts.length} ürün)
                  </span>
                </nav>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
