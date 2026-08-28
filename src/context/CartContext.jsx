import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef
} from 'react'
import { useAuth } from './AuthContext'
import * as cartApi from '../services/cartApi'

const CartContext = createContext(null)

export function mapServerCart (data) {
  if (!data) return { cartData: null, items: [] }
  const items = (data.items || []).map(item => ({
    ...item,
    id: item.id || item.cartItemId,
    productId: item.productId,
    productVariantId: item.productVariantId,
    qty: item.quantity,
    quantity: item.quantity,
    customNote:
      item.customNote || item.personalizationNote || item.note || null,
    price: `${item.unitPrice} ₺`,
    unitPrice: item.unitPrice,
    image: item.imageUrl || '/ornek resim.jpg',
    imageUrl: item.imageUrl || '/ornek resim.jpg',
    name: item.productName || 'Ürün',
    productName: item.productName || 'Ürün',
    source: 'server'
  }))
  return { cartData: data, items }
}

export function getCartErrorMessage (codeOrMessage) {
  const code =
    typeof codeOrMessage === 'object' ? codeOrMessage?.code : codeOrMessage
  const status =
    typeof codeOrMessage === 'object' ? codeOrMessage?.status : null
  if (status === 404) {
    return 'Bu ürün silinmiş veya artık satışta değil.'
  }
  if (status === 400) {
    return (
      (typeof codeOrMessage === 'object' && codeOrMessage?.message) ||
      'Bu ürün sepete eklenemiyor (geçersiz veya tükenmiş ürün).'
    )
  }
  switch (code) {
    case 'product_unavailable':
      return 'Bu ürün artık satışta değil.'
    case 'product_variant_unavailable':
      return 'Seçtiğiniz ürün seçeneği artık satışta değil.'
    case 'insufficient_stock':
      return 'Bu ürün için yeterli stok bulunmuyor.'
    case 'quantity_limit_exceeded':
      return 'Bu ürün için izin verilen sipariş miktarı aşıldı.'
    case 'cart_concurrency_conflict':
      return 'Sepetiniz şu anda güncelleniyor. Lütfen tekrar deneyin.'
    case 'not_found':
      return 'Sepet ürünü bulunamadı. Sepetiniz yenilendi.'
    case 'network_error':
      return 'Sepete ulaşılamadı. Lütfen bağlantınızı kontrol edin.'
    default:
      return (
        (typeof codeOrMessage === 'object' && codeOrMessage?.message) ||
        'Sepet işlemi tamamlanamadı.'
      )
  }
}

let activeMergePromise = null
let hasMergedInCurrentSession = false

export function resetCartMergePromise () {
  activeMergePromise = null
  hasMergedInCurrentSession = false
}

export function CartProvider ({ children }) {
  const { isAuthenticated } = useAuth()
  const [cartData, setCartData] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartError, setCartError] = useState(null)

  // Loading locks
  const [addingProductIds, setAddingProductIds] = useState([])
  const [updatingItemIds, setUpdatingItemIds] = useState([])
  const [removingItemIds, setRemovingItemIds] = useState([])
  const [isMergingCart, setIsMergingCart] = useState(false)

  const addingProductIdsRef = useRef(new Set())
  const updatingItemIdsRef = useRef(new Set())
  const removingItemIdsRef = useRef(new Set())
  const isMergingCartRef = useRef(false)

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const safeSetState = useCallback((setter, val) => {
    if (isMountedRef.current && typeof window !== 'undefined') {
      setter(val)
    }
  }, [])

  const applyServerCart = useCallback(
    data => {
      const { cartData: newCartData, items: newItems } = mapServerCart(data)
      safeSetState(setCartData, newCartData)
      safeSetState(setItems, newItems)
    },
    [safeSetState]
  )

  const refreshCart = useCallback(async () => {
    try {
      safeSetState(setLoading, true)
      const data = await cartApi.getCart()
      applyServerCart(data)
    } catch (err) {
      console.error('Cart fetch failed:', err)
    } finally {
      safeSetState(setLoading, false)
    }
  }, [applyServerCart, safeSetState])

  const triggerGuestCartMerge = useCallback(
    (retryCount = 0) => {
      if (hasMergedInCurrentSession) return Promise.resolve()
      if (activeMergePromise) return activeMergePromise
      if (isMergingCartRef.current) return activeMergePromise

      hasMergedInCurrentSession = true
      isMergingCartRef.current = true
      safeSetState(setIsMergingCart, true)

      activeMergePromise = (async () => {
        try {
          await cartApi.mergeGuestCart()
          await refreshCart()
          safeSetState(setItems, prev => prev.filter(i => i.source !== 'mock'))
        } catch (err) {
          if (err.code === 'cart_concurrency_conflict' && retryCount === 0) {
            await new Promise(r => setTimeout(r, 400))
            isMergingCartRef.current = false
            safeSetState(setIsMergingCart, false)
            activeMergePromise = null
            return triggerGuestCartMerge(1)
          }
          await refreshCart()
          safeSetState(setCartError, getCartErrorMessage(err))
        } finally {
          isMergingCartRef.current = false
          safeSetState(setIsMergingCart, false)
        }
      })()

      return activeMergePromise
    },
    [refreshCart, safeSetState]
  )

  // Sync cart on mount and auth change
  const isInitialMountRef = useRef(true)
  const prevAuthRef = useRef(isAuthenticated)
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      prevAuthRef.current = isAuthenticated
      if (isAuthenticated) {
        triggerGuestCartMerge()
      } else {
        refreshCart()
      }
      return
    }

    if (prevAuthRef.current !== isAuthenticated) {
      prevAuthRef.current = isAuthenticated
      if (isAuthenticated) {
        triggerGuestCartMerge()
      } else {
        refreshCart()
      }
    }
  }, [isAuthenticated, refreshCart, triggerGuestCartMerge])

  // Debounce timers map for updateQty
  const updateQtyDebounceTimers = useRef(new Map())

  const addToCart = useCallback(
    async (product, quantity = 1, variantId = null, customNote = null) => {
      setCartError(null)
      const rawId = product?.databaseId ?? product?.productId ?? product?.id
      const isGuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          String(rawId || '')
        )
      const isProd = import.meta.env.PROD

      if (addingProductIdsRef.current.has(rawId)) {
        return {
          success: false,
          code: 'duplicate_request',
          message: 'İşlem devam ediyor.'
        }
      }

      // ── Hızlı Optimistik UI Güncellemesi (0ms tepki) ──
      setItems(prev => {
        const existing = prev.find(
          i => String(i.id || i.productId) === String(rawId)
        )
        if (existing) {
          return prev.map(i =>
            String(i.id || i.productId) === String(rawId)
              ? {
                  ...i,
                  qty: (i.qty || i.quantity || 1) + quantity,
                  quantity: (i.qty || i.quantity || 1) + quantity,
                  customNote: customNote || i.customNote
                }
              : i
          )
        }
        const rawPrice = product.price || product.unitPrice || 100
        const numPrice =
          typeof rawPrice === 'number'
            ? rawPrice
            : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 100
        return [
          ...prev,
          {
            id: rawId,
            productId: rawId,
            productName: product.name || product.productName || 'Ürün',
            name: product.name || product.productName || 'Ürün',
            price: typeof rawPrice === 'number' ? `${rawPrice} ₺` : rawPrice,
            unitPrice: numPrice,
            imageUrl: product.image || product.imageUrl || '/ornek resim.jpg',
            image: product.image || product.imageUrl || '/ornek resim.jpg',
            qty: quantity,
            quantity: quantity,
            customNote: customNote || null,
            source: isGuid ? 'optimistic' : 'mock'
          }
        ]
      })

      if (isGuid) {
        addingProductIdsRef.current.add(rawId)
        setAddingProductIds(Array.from(addingProductIdsRef.current))
        try {
          const data = await cartApi.addCartItem({
            productId: rawId,
            productVariantId: variantId,
            quantity,
            customNote: customNote || null
          })
          applyServerCart(data)
          return { success: true, cart: data }
        } catch (err) {
          if (err.status === 409 || err.code === 'cart_concurrency_conflict') {
            await new Promise(r => setTimeout(r, 250))
            try {
              const retryData = await cartApi.addCartItem({
                productId: rawId,
                productVariantId: variantId,
                quantity,
                customNote: customNote || null
              })
              applyServerCart(retryData)
              return { success: true, cart: retryData }
            } catch (retryErr) {
              await refreshCart()
              const msg = getCartErrorMessage(retryErr)
              setCartError(msg)
              return {
                success: false,
                code: retryErr.code || 'cart_error',
                message: msg
              }
            }
          }
          await refreshCart()
          const msg = getCartErrorMessage(err)
          setCartError(msg)
          return {
            success: false,
            code: err.code || 'cart_error',
            message: msg
          }
        } finally {
          addingProductIdsRef.current.delete(rawId)
          setAddingProductIds(Array.from(addingProductIdsRef.current))
        }
      }

      if (isProd) {
        const msg = 'Geçersiz ürün kimliği.'
        setCartError(msg)
        return { success: false, code: 'invalid_id', message: msg }
      }

      return { success: true }
    },
    [applyServerCart, refreshCart]
  )

  const removeFromCart = useCallback(
    async itemId => {
      setCartError(null)
      if (!itemId) return { success: false }

      // Optimistik Kaldırma
      setItems(prev => prev.filter(i => String(i.id) !== String(itemId)))

      if (removingItemIdsRef.current.has(itemId)) {
        return {
          success: false,
          code: 'duplicate_request',
          message: 'İşlem devam ediyor.'
        }
      }

      removingItemIdsRef.current.add(itemId)
      setRemovingItemIds(Array.from(removingItemIdsRef.current))
      try {
        const res = await cartApi.removeCartItem(itemId)
        if (res && (res.items || res.cartData)) {
          applyServerCart(res)
        } else {
          await refreshCart()
        }
        return { success: true }
      } catch (err) {
        await refreshCart()
        const msg =
          getCartErrorMessage(err) ||
          'Ürün sepetten kaldırılamadı. Lütfen tekrar deneyin.'
        setCartError(msg)
        return {
          success: false,
          code: err.code || 'cart_remove_failed',
          message: msg
        }
      } finally {
        removingItemIdsRef.current.delete(itemId)
        setRemovingItemIds(Array.from(removingItemIdsRef.current))
      }
    },
    [applyServerCart, refreshCart]
  )

  const updateQty = useCallback(
    async (itemId, qty) => {
      setCartError(null)
      if (!itemId) return { success: false }

      if (qty < 1) {
        return removeFromCart(itemId)
      }

      // ── Anında Optimistik Miktar Güncellemesi (Hızlı + / - tepkisi) ──
      setItems(prev =>
        prev.map(i =>
          String(i.id) === String(itemId)
            ? { ...i, qty, quantity: qty }
            : i
        )
      )

      // Önceki bekleyen debounce isteğini temizle
      if (updateQtyDebounceTimers.current.has(itemId)) {
        clearTimeout(updateQtyDebounceTimers.current.get(itemId))
      }

      return new Promise(resolve => {
        const timer = setTimeout(async () => {
          updateQtyDebounceTimers.current.delete(itemId)
          try {
            const data = await cartApi.updateCartItem(itemId, { quantity: qty })
            if (data && (data.items || data.cartData)) {
              applyServerCart(data)
            } else {
              await refreshCart()
            }
            resolve({ success: true, cart: data })
          } catch (err) {
            if (err.status === 409 || err.code === 'cart_concurrency_conflict') {
              await new Promise(r => setTimeout(r, 250))
              try {
                const retryData = await cartApi.updateCartItem(itemId, {
                  quantity: qty
                })
                if (retryData && (retryData.items || retryData.cartData)) {
                  applyServerCart(retryData)
                } else {
                  await refreshCart()
                }
                resolve({ success: true, cart: retryData })
                return
              } catch (retryErr) {
                await refreshCart()
                const msg = getCartErrorMessage(retryErr)
                setCartError(msg)
                resolve({
                  success: false,
                  code: retryErr.code || 'cart_error',
                  message: msg
                })
                return
              }
            }
            await refreshCart()
            const code = err.code || ''
            let msg = getCartErrorMessage(err)
            if (
              code === 'not_found' ||
              code === 'product_unavailable' ||
              code === 'product_variant_unavailable'
            ) {
              msg = 'Bu ürün artık satışta değil ve sepetinizden kaldırıldı.'
            }
            setCartError(msg)
            resolve({ success: false, code, message: msg })
          }
        }, 150) // 150ms debounce ile peş peşe tıklamaları tek bir akıcı istekte birleştirir

        updateQtyDebounceTimers.current.set(itemId, timer)
      })
    },
    [removeFromCart, applyServerCart, refreshCart]
  )

  const clearCart = useCallback(async () => {
    setCartError(null)
    try {
      const res = await cartApi.clearCart()
      if (res && (res.items || res.cartData)) {
        applyServerCart(res)
      } else {
        setCartData(null)
        setItems([])
      }
      return { success: true }
    } catch (err) {
      await refreshCart()
      const msg = getCartErrorMessage(err)
      setCartError(msg)
      return { success: false, code: err.code, message: msg }
    }
  }, [applyServerCart, refreshCart])

  const totalCount =
    cartData?.totalQuantity ||
    items.reduce((s, i) => s + (i.qty || i.quantity || 0), 0)
  const totalPrice =
    cartData?.subtotal ||
    items.reduce((s, i) => {
      const p =
        typeof i.unitPrice === 'number'
          ? i.unitPrice
          : parseFloat(String(i.price).replace(/[^0-9.]/g, '')) || 0
      return s + p * (i.qty || i.quantity || 1)
    }, 0)

  const clearCartError = useCallback(() => {
    setCartError(null)
  }, [])

  const value = useMemo(
    () => ({
      cartData,
      items,
      loading,
      cartError,
      clearCartError,
      addingProductIds,
      updatingItemIds,
      removingItemIds,
      isMergingCart,
      addToCart,
      updateQty,
      removeFromCart,
      clearCart,
      totalCount,
      totalPrice,
      refreshCart
    }),
    [
      cartData,
      items,
      loading,
      cartError,
      clearCartError,
      addingProductIds,
      updatingItemIds,
      removingItemIds,
      isMergingCart,
      addToCart,
      updateQty,
      removeFromCart,
      clearCart,
      totalCount,
      totalPrice,
      refreshCart
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
