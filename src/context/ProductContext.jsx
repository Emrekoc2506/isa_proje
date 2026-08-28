import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef
} from 'react'
import {
  getProducts,
  createAdminProduct,
  deleteAdminProduct,
  updateAdminProductPrice
} from '../services/productApi'
import {
  getCategories,
  getCategoryTree,
  createAdminCategory,
  deleteAdminCategory
} from '../services/categoryApi'
import {
  getBanners,
  createAdminBanner,
  deleteAdminBanner
} from '../services/bannerApi'
import { parseBannerContent } from '../utils/bannerContent'
import { getSafeStockQuantity } from '../utils/stockUtils'

const ProductContext = createContext(null)

export function normalizeProducts (productsData) {
  const rawList = Array.isArray(productsData)
    ? productsData
    : productsData?.items || productsData?.data || []

  return rawList.map(p => {
    const imagesList = Array.isArray(p.images)
      ? p.images
      : Array.isArray(p.Images)
      ? p.Images
      : []
    const primaryObj = imagesList.find(i => i.isPrimary || i.IsPrimary)
    const primaryUrl =
      primaryObj?.url ||
      primaryObj?.Url ||
      imagesList[0]?.url ||
      imagesList[0]?.Url

    const imageUrlsArr = Array.isArray(p.imageUrls)
      ? p.imageUrls
      : Array.isArray(p.ImageUrls)
      ? p.ImageUrls
      : imagesList.length > 0
      ? imagesList
          .map(i => (typeof i === 'string' ? i : i.url || i.Url))
          .filter(Boolean)
      : p.imageUrl || p.ImageUrl || p.image || p.Image
      ? [p.imageUrl || p.ImageUrl || p.image || p.Image]
      : []

    const mainImg =
      p.imageUrl ||
      p.ImageUrl ||
      primaryUrl ||
      imageUrlsArr[0] ||
      p.image ||
      p.Image ||
      ''

    const priceVal = p.price ?? p.Price ?? 0
    const oldPriceVal = p.oldPrice ?? p.OldPrice ?? null
    const stockVal = getSafeStockQuantity(p)

    return {
      ...p,
      id: p.id || p.Id || p.databaseId,
      name: p.name || p.Name || '',
      price:
        typeof priceVal === 'number'
          ? `₺${priceVal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
          : String(priceVal),
      oldPrice: oldPriceVal
        ? typeof oldPriceVal === 'number'
          ? `₺${oldPriceVal.toLocaleString('tr-TR', {
              minimumFractionDigits: 2
            })}`
          : String(oldPriceVal)
        : null,
      rawPrice: priceVal,
      rawOldPrice: oldPriceVal,
      stockQuantity: stockVal,
      stock: stockVal,
      image: mainImg,
      imageUrl: mainImg,
      imageUrls: imageUrlsArr,
      images:
        imagesList.length > 0
          ? imagesList
          : imageUrlsArr.map((url, idx) => ({
              url,
              isPrimary: idx === 0,
              sortOrder: idx
            })),
      isNew: Boolean(p.isNew ?? p.IsNew),
      isSale: Boolean(p.isSale ?? p.IsSale),
      isFeatured: Boolean(p.isFeatured ?? p.IsFeatured),
      isActive: p.isActive ?? p.IsActive ?? true
    }
  })
}

function getCachedSlides () {
  try {
    const raw = sessionStorage.getItem('muhristan_cached_slides')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setCachedSlides (slidesData) {
  try {
    sessionStorage.setItem(
      'muhristan_cached_slides',
      JSON.stringify(slidesData)
    )
  } catch {
    // Ignore storage error
  }
}

function getCachedProducts () {
  try {
    const raw = sessionStorage.getItem('muhristan_cached_products')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setCachedProducts (productsData) {
  try {
    sessionStorage.setItem(
      'muhristan_cached_products',
      JSON.stringify(productsData)
    )
  } catch {
    // Ignore storage error
  }
}

function getCachedCategories () {
  try {
    const raw = sessionStorage.getItem('muhristan_cached_categories')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setCachedCategories (catData) {
  try {
    sessionStorage.setItem(
      'muhristan_cached_categories',
      JSON.stringify(catData)
    )
  } catch {
    // Ignore storage error
  }
}

export function isTransientError (err) {
  if (!err) return false
  const status = err.status || err.statusCode || err.response?.status
  const code = err.code || err.name

  // Non-retryable status codes: 400, 401, 403, 404, 422
  if (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    status === 422
  ) {
    return false
  }

  // Transient status codes: 500, 502, 503, 504
  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return true
  }

  // Network errors, timeouts, abort errors
  if (
    code === 'network_error' ||
    code === 'AbortError' ||
    err.name === 'AbortError' ||
    (err.message && String(err.message).includes('Zaman aşımı'))
  ) {
    return true
  }

  return !status
}

export async function fetchProductsWithRetry (
  fetcher,
  maxAttempts = 3,
  delays = [1000, 2000]
) {
  let lastError = null
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fetcher()
    } catch (err) {
      lastError = err
      const canRetry = isTransientError(err)
      if (!canRetry || attempt >= maxAttempts) {
        throw err
      }
      const delayMs = delays[attempt - 1] ?? 1000
      await new Promise(res => setTimeout(res, delayMs))
    }
  }
  throw lastError
}

export function ProductProvider ({ children }) {
  const [categories, setCategories] = useState(() => getCachedCategories())
  const [products, setProducts] = useState(() => getCachedProducts())
  const [slides, setSlides] = useState(() => getCachedSlides())
  const [loading, setLoading] = useState(() => {
    const cachedP = getCachedProducts()
    return cachedP.length === 0
  })
  const [error, setError] = useState(null)

  const isMountedRef = useRef(true)
  const latestRequestIdRef = useRef(0)
  const productsRef = useRef(products)
  productsRef.current = products

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Banner/Afiş verilerini anında (ürünleri beklemeden) ultra hızlı yükle
  const fetchBannersFast = useCallback(async () => {
    try {
      const bannersData = await getBanners()
      if (!isMountedRef.current || !Array.isArray(bannersData)) return

      const mappedSlides = bannersData
        .map(b => {
          const parsedContent = parseBannerContent(b.contentJson)
          const videoUrl = b.videoUrl || parsedContent.videoUrl || ''
          const mediaType =
            b.mediaType ||
            parsedContent.mediaType ||
            (videoUrl ? 'video' : 'image')
          return {
            id: b.id,
            title: b.title ?? '',
            subtitle: b.subtitle ?? '',
            imageUrl:
              b.imageUrl ?? b.image ?? parsedContent.posterImageUrl ?? '',
            mobileImageUrl:
              b.imageMobile ??
              b.imageMobileUrl ??
              parsedContent.mobilePosterImageUrl ??
              b.image ??
              '',
            href: b.href ?? b.linkUrl ?? '',
            cta: b.cta ?? '',
            sortOrder: Number(b.sortOrder ?? 0),
            isActive: b.isActive ?? true,
            mediaType,
            themeMode: parsedContent.themeMode || b.themeMode || 'all',
            imageDark: b.imageDark || parsedContent.imageDark || '',
            imageMobileDark:
              b.imageMobileDark || parsedContent.imageMobileDark || '',
            hideTextOverlay: Boolean(
              parsedContent.hideTextOverlay || b.hideTextOverlay
            ),
            videoUrl,
            mobileVideoUrl:
              b.mobileVideoUrl || parsedContent.mobileVideoUrl || '',
            posterImageUrl:
              b.posterImageUrl || b.image || parsedContent.posterImageUrl || '',
            mobilePosterImageUrl:
              b.mobilePosterImageUrl ||
              b.imageMobile ||
              parsedContent.mobilePosterImageUrl ||
              '',
            autoplay: Boolean(parsedContent.autoplay),
            loop: Boolean(parsedContent.loop),
            muted: Boolean(parsedContent.muted || parsedContent.autoplay),
            contentJson: b.contentJson
          }
        })
        .filter(item => item.imageUrl || item.videoUrl)
        .sort((a, b) => a.sortOrder - b.sortOrder)

      setSlides(mappedSlides)
      setCachedSlides(mappedSlides)
    } catch (err) {
      console.error('Banner yükleme hatası:', err)
    }
  }, [])

  // Ürünleri talep üzerine (on-demand / admin vb.) yükleme
  const loadProducts = useCallback(async (params = {}) => {
    try {
      const prodsData = await getProducts({
        pageSize: params.pageSize || 500,
        ...params
      })
      const normalized = normalizeProducts(prodsData)
      setProducts(normalized || [])
      setCachedProducts(normalized || [])
      return normalized
    } catch (err) {
      console.error('Ürün yükleme hatası:', err)
      return []
    }
  }, [])

  // Kategori ve Ürün verilerini yükleme (bağımsız paralel & retry destekli)
  const loadInitialData = useCallback(async () => {
    const currentRequestId = ++latestRequestIdRef.current

    try {
      if (isMountedRef.current && typeof window !== 'undefined') {
        if (productsRef.current.length === 0) {
          setLoading(true)
        }
        setError(null)
      }

      // Kategori ve Ürün verilerini bağımsız paralel çek (Tüm kataloğu çekmek için pageSize: 500)
      const [catResult, prodResult] = await Promise.allSettled([
        getCategoryTree().catch(() => getCategories()),
        fetchProductsWithRetry(() => getProducts({ pageSize: 500 }, { timeout: 8000 }))
      ])

      if (
        !isMountedRef.current ||
        currentRequestId !== latestRequestIdRef.current ||
        typeof window === 'undefined'
      )
        return

      if (catResult.status === 'fulfilled') {
        const catVal = catResult.value || []
        setCategories(catVal)
        setCachedCategories(catVal)
      } else {
        console.error('Kategori veri yükleme hatası:', catResult.reason)
      }

      if (prodResult.status === 'fulfilled') {
        const normalized = normalizeProducts(prodResult.value)
        setProducts(normalized || [])
        setCachedProducts(normalized || [])
        setError(null)

        // Sunucudan gelen canlı listede olmayan silinmiş ürünleri son incelediklerinizden temizle
        if (
          Array.isArray(normalized) &&
          normalized.length > 0 &&
          typeof window !== 'undefined'
        ) {
          try {
            const validIds = new Set(normalized.map(p => p.id))
            const rvData = localStorage.getItem('isa_recently_viewed_products')
            if (rvData) {
              const rvList = JSON.parse(rvData)
              if (Array.isArray(rvList)) {
                const cleaned = rvList.filter(item => validIds.has(item.id))
                localStorage.setItem(
                  'isa_recently_viewed_products',
                  JSON.stringify(cleaned)
                )
              }
            }
          } catch (e) {}
        }
      } else {
        const prodErr = prodResult.reason
        console.error('Ürün yükleme hatası (retry sonrası):', prodErr)
        setError('Ürünler yüklenirken bir hata oluştu.')
      }
    } catch (err) {
      console.error('Veri yükleme hatası:', err)
      if (
        isMountedRef.current &&
        currentRequestId === latestRequestIdRef.current &&
        typeof window !== 'undefined'
      ) {
        setError('Veriler yüklenirken bir hata oluştu.')
      }
    } finally {
      if (
        isMountedRef.current &&
        currentRequestId === latestRequestIdRef.current &&
        typeof window !== 'undefined'
      ) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchBannersFast()
    loadInitialData()
  }, [fetchBannersFast, loadInitialData])

  // Kategori Ekle
  const addCategory = useCallback(async label => {
    try {
      const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const newCat = await createAdminCategory({
        name: label,
        slug: slug,
        isActive: true,
        sortOrder: 0
      })
      // Yenile
      const updatedTree = await getCategoryTree().catch(() => getCategories())
      setCategories(updatedTree || [])
      return newCat
    } catch (err) {
      console.error('Kategori eklenemedi:', err)
      throw err
    }
  }, [])

  // Kategori Sil
  const deleteCategory = useCallback(async id => {
    try {
      // id parametresi databaseId (Guid) olmalı
      await deleteAdminCategory(id)
      const updatedTree = await getCategoryTree().catch(() => getCategories())
      setCategories(updatedTree || [])
    } catch (err) {
      console.error('Kategori silinemedi:', err)
      throw err
    }
  }, [])

  // Alt Kategori Ekle
  const addSubcategory = useCallback(async (parentCategoryId, label) => {
    try {
      const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      await createAdminCategory({
        name: label,
        parentCategoryId: parentCategoryId,
        slug: slug,
        isActive: true,
        sortOrder: 0
      })
      const updatedTree = await getCategoryTree().catch(() => getCategories())
      setCategories(updatedTree || [])
    } catch (err) {
      console.error('Alt kategori eklenemedi:', err)
      throw err
    }
  }, [])

  // Alt Kategori Sil
  const deleteSubcategory = useCallback(
    async (parentCategoryId, subLabel) => {
      try {
        // parent içindeki o alt kategoriyi bulup databaseId'sine ulaşalım
        const parent = categories.find(
          c => c.databaseId === parentCategoryId || c.id === parentCategoryId
        )
        if (parent && parent.children) {
          const sub = parent.children.find(
            ch => ch.label === subLabel || ch.name === subLabel
          )
          if (sub) {
            const subId = sub.databaseId || sub.id
            await deleteAdminCategory(subId)
            const updatedTree = await getCategoryTree().catch(() =>
              getCategories()
            )
            setCategories(updatedTree || [])
          }
        }
      } catch (err) {
        console.error('Alt kategori silinemedi:', err)
        throw err
      }
    },
    [categories]
  )

  // Ürün Ekle
  const addProduct = useCallback(
    async productData => {
      try {
        const slug =
          productData.slug ||
          productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        // Kategori databaseId değerini bulalım
        const categoryObj = categories.find(
          c => c.id === productData.categoryId
        )
        const categoryIdGuid = categoryObj
          ? categoryObj.databaseId
          : productData.categoryId

        let subcategoryIdGuid = null
        if (productData.subcategory && categoryObj && categoryObj.children) {
          const subObj = categoryObj.children.find(
            ch =>
              ch.label === productData.subcategory ||
              ch.name === productData.subcategory
          )
          if (subObj) {
            subcategoryIdGuid = subObj.databaseId || subObj.id
          }
        } else if (productData.subcategoryId) {
          subcategoryIdGuid = productData.subcategoryId
        }

        await createAdminProduct({
          name: productData.name,
          categoryId: categoryIdGuid,
          subcategoryId: subcategoryIdGuid,
          price: parseFloat(productData.price),
          oldPrice: productData.oldPrice
            ? parseFloat(productData.oldPrice)
            : null,
          stockQuantity: productData.stockQuantity
            ? parseInt(productData.stockQuantity)
            : 10,
          shortDescription:
            productData.shortDescription ||
            productData.name + ' şifa dolu mistik ürün.',
          description:
            productData.description ||
            productData.name + ' şifa dolu mistik ürün.',
          imageUrls: productData.imageUrl
            ? [productData.imageUrl]
            : productData.image
            ? [productData.image]
            : [],
          slug: slug,
          isActive: productData.isActive !== false,
          isNew: productData.isNew || false,
          isSale: productData.isSale || false,
          isFeatured: productData.isFeatured || false
        })

        // Yenile
        const productsData = await getProducts({ pageSize: 100 })
        setProducts(normalizeProducts(productsData))
      } catch (err) {
        console.error('Ürün eklenemedi:', err)
        throw err
      }
    },
    [categories]
  )

  // Ürün Sil
  const deleteProduct = useCallback(
    async id => {
      try {
        // id parametresi backend tarafında Guid olmalıdır.
        // Eyer id string/Guid değilse, listeden ürünü bulup databaseId'sini alalım
        const prod = products.find(p => String(p.id) === String(id))
        const targetId = prod ? prod.databaseId || prod.id : id

        await deleteAdminProduct(targetId)

        const productsData = await getProducts({ pageSize: 100 })
        setProducts(normalizeProducts(productsData))
      } catch (err) {
        console.error('Ürün silinemedi:', err)
        throw err
      }
    },
    [products]
  )

  // Ürün Fiyatı Güncelle
  const updateProductPrice = useCallback(
    async (id, newPrice) => {
      try {
        const prod = products.find(p => String(p.id) === String(id))
        const targetId = prod ? prod.databaseId || prod.id : id

        await updateAdminProductPrice(targetId, parseFloat(newPrice))

        const productsData = await getProducts({ pageSize: 100 })
        setProducts(normalizeProducts(productsData))
      } catch (err) {
        console.error('Ürün fiyatı güncellenemedi:', err)
        throw err
      }
    },
    [products]
  )

  // Slayt (İlan/Banner) Ekle
  const addSlide = useCallback(
    async slideData => {
      try {
        await createAdminBanner({
          title: slideData.title,
          subtitle: slideData.subtitle || '',
          image: slideData.image,
          imageMobile: slideData.image,
          cta: slideData.cta || 'Keşfet',
          href: slideData.href || '/urunler',
          sortOrder: 0,
          isActive: true
        })

        await fetchBannersFast()
      } catch (err) {
        console.error('Afiş eklenemedi:', err)
        throw err
      }
    },
    [fetchBannersFast]
  )

  // Slayt Sil
  const deleteSlide = useCallback(
    async id => {
      try {
        await deleteAdminBanner(id)
        await fetchBannersFast()
      } catch (err) {
        console.error('Afiş silinemedi:', err)
        throw err
      }
    },
    [fetchBannersFast]
  )

  const value = useMemo(
    () => ({
      categories,
      products,
      slides,
      loading,
      error,
      loadProducts,
      refreshData: loadInitialData,
      refreshProducts: loadProducts,
      retry: loadInitialData,
      addCategory,
      deleteCategory,
      addSubcategory,
      deleteSubcategory,
      addProduct,
      deleteProduct,
      updateProductPrice,
      addSlide,
      deleteSlide
    }),
    [
      categories,
      products,
      slides,
      loading,
      error,
      loadProducts,
      loadInitialData,
      addCategory,
      deleteCategory,
      addSubcategory,
      deleteSubcategory,
      addProduct,
      deleteProduct,
      updateProductPrice,
      addSlide,
      deleteSlide
    ]
  )

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  )
}

export function useProducts () {
  const context = useContext(ProductContext)
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider')
  }
  return context
}
