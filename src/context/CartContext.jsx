import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import * as cartApi from '../services/cartApi';

const CartContext = createContext(null);

export function mapServerCart(data) {
  if (!data) return { cartData: null, items: [] };
  const items = (data.items || []).map(item => ({
    ...item,
    id: item.id || item.cartItemId,
    productId: item.productId,
    productVariantId: item.productVariantId,
    qty: item.quantity,
    quantity: item.quantity,
    price: `${item.unitPrice} ₺`,
    unitPrice: item.unitPrice,
    image: item.imageUrl || "/ornek resim.jpg",
    imageUrl: item.imageUrl || "/ornek resim.jpg",
    name: item.productName || "Ürün",
    productName: item.productName || "Ürün",
    source: "server"
  }));
  return { cartData: data, items };
}

export function getCartErrorMessage(codeOrMessage) {
  const code = typeof codeOrMessage === 'object' ? codeOrMessage?.code : codeOrMessage;
  switch (code) {
    case 'product_unavailable':
      return "Bu ürün artık satışta değil.";
    case 'product_variant_unavailable':
      return "Seçtiğiniz ürün seçeneği artık satışta değil.";
    case 'insufficient_stock':
      return "Bu ürün için yeterli stok bulunmuyor.";
    case 'quantity_limit_exceeded':
      return "Bu ürün için izin verilen sipariş miktarı aşıldı.";
    case 'cart_concurrency_conflict':
      return "Sepetiniz şu anda güncelleniyor. Lütfen tekrar deneyin.";
    case 'not_found':
      return "Sepet ürünü bulunamadı. Sepetiniz yenilendi.";
    case 'network_error':
      return "Sepete ulaşılamadı. Lütfen bağlantınızı kontrol edin.";
    default:
      return (typeof codeOrMessage === 'object' && codeOrMessage?.message) || "Sepet işlemi tamamlanamadı.";
  }
}

let activeMergePromise = null;
let hasMergedInCurrentSession = false;

export function resetCartMergePromise() {
  activeMergePromise = null;
  hasMergedInCurrentSession = false;
}

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cartData, setCartData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartError, setCartError] = useState(null);

  // Loading locks
  const [addingProductIds, setAddingProductIds] = useState([]);
  const [updatingItemIds, setUpdatingItemIds] = useState([]);
  const [removingItemIds, setRemovingItemIds] = useState([]);
  const [isMergingCart, setIsMergingCart] = useState(false);

  const addingProductIdsRef = useRef(new Set());
  const updatingItemIdsRef = useRef(new Set());
  const removingItemIdsRef = useRef(new Set());
  const isMergingCartRef = useRef(false);

  const applyServerCart = useCallback((data) => {
    const { cartData: newCartData, items: newItems } = mapServerCart(data);
    setCartData(newCartData);
    setItems(newItems);
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cartApi.getCart();
      applyServerCart(data);
    } catch (err) {
      console.error("Cart fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [applyServerCart]);

  const triggerGuestCartMerge = useCallback((retryCount = 0) => {
    if (hasMergedInCurrentSession) return Promise.resolve();
    if (activeMergePromise) return activeMergePromise;
    if (isMergingCartRef.current) return activeMergePromise;

    hasMergedInCurrentSession = true;
    isMergingCartRef.current = true;
    setIsMergingCart(true);

    activeMergePromise = (async () => {
      try {
        await cartApi.mergeGuestCart();
        await refreshCart();
        setItems(prev => prev.filter(i => i.source !== 'mock'));
      } catch (err) {
        if (err.code === 'cart_concurrency_conflict' && retryCount === 0) {
          await new Promise(r => setTimeout(r, 400));
          isMergingCartRef.current = false;
          setIsMergingCart(false);
          activeMergePromise = null;
          return triggerGuestCartMerge(1);
        }
        await refreshCart();
        setCartError(getCartErrorMessage(err));
      } finally {
        isMergingCartRef.current = false;
        setIsMergingCart(false);
      }
    })();

    return activeMergePromise;
  }, [refreshCart]);

  // Sync cart on auth change
  useEffect(() => {
    if (isAuthenticated) {
      triggerGuestCartMerge();
    } else {
      refreshCart();
    }
  }, [isAuthenticated, refreshCart, triggerGuestCartMerge]);

  const addToCart = useCallback(async (product, quantity = 1, variantId = null) => {
    setCartError(null);
    const rawId = product?.databaseId ?? product?.productId ?? product?.id;
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(rawId || ''));
    const isProd = import.meta.env.PROD;

    if (addingProductIdsRef.current.has(rawId)) {
      return { success: false, code: "duplicate_request", message: "İşlem devam ediyor." };
    }

    if (isGuid) {
      addingProductIdsRef.current.add(rawId);
      setAddingProductIds(Array.from(addingProductIdsRef.current));
      try {
        const data = await cartApi.addCartItem({
          productId: rawId,
          productVariantId: variantId,
          quantity
        });
        applyServerCart(data);
        return { success: true, cart: data };
      } catch (err) {
        await refreshCart();
        const msg = getCartErrorMessage(err);
        setCartError(msg);
        return { success: false, code: err.code || "cart_error", message: msg };
      } finally {
        addingProductIdsRef.current.delete(rawId);
        setAddingProductIds(Array.from(addingProductIdsRef.current));
      }
    }

    if (isProd) {
      const msg = "Geçersiz ürün kimliği.";
      setCartError(msg);
      return { success: false, code: "invalid_id", message: msg };
    }

    // Development mock fallback only for demo items without valid GUID
    setItems(prev => {
      const existing = prev.find(i => String(i.id || i.productId) === String(rawId));
      if (existing) {
        return prev.map(i => String(i.id || i.productId) === String(rawId) ? { ...i, qty: (i.qty || i.quantity || 1) + quantity } : i);
      }
      const rawPrice = product.price || 100;
      const numPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 100;
      return [...prev, {
        id: rawId || 'item-' + Date.now(),
        productName: product.name || 'Ürün',
        name: product.name || 'Ürün',
        price: typeof rawPrice === 'number' ? `${rawPrice} ₺` : rawPrice,
        unitPrice: numPrice,
        imageUrl: product.image || product.imageUrl || "/ornek resim.jpg",
        image: product.image || product.imageUrl || "/ornek resim.jpg",
        qty: quantity,
        quantity: quantity,
        source: 'mock'
      }];
    });
    return { success: true };
  }, [applyServerCart, refreshCart]);

  const removeFromCart = useCallback(async (itemId) => {
    setCartError(null);
    if (removingItemIdsRef.current.has(itemId)) return { success: false };
    removingItemIdsRef.current.add(itemId);
    setRemovingItemIds(Array.from(removingItemIdsRef.current));
    try {
      const res = await cartApi.removeCartItem(itemId);
      if (res && res.items) {
        applyServerCart(res);
      } else {
        await refreshCart();
      }
      return { success: true };
    } catch (err) {
      await refreshCart();
      const msg = getCartErrorMessage(err);
      setCartError(msg);
      return { success: false, code: err.code, message: msg };
    } finally {
      removingItemIdsRef.current.delete(itemId);
      setRemovingItemIds(Array.from(removingItemIdsRef.current));
    }
  }, [applyServerCart, refreshCart]);

  const updateQty = useCallback(async (itemId, qty) => {
    setCartError(null);
    if (updatingItemIdsRef.current.has(itemId)) return { success: false };
    if (qty < 1) {
      return removeFromCart(itemId);
    }

    updatingItemIdsRef.current.add(itemId);
    setUpdatingItemIds(Array.from(updatingItemIdsRef.current));
    try {
      const data = await cartApi.updateCartItem(itemId, { quantity: qty });
      applyServerCart(data);
      return { success: true, cart: data };
    } catch (err) {
      await refreshCart();
      const code = err.code || '';
      let msg = getCartErrorMessage(err);
      if (code === 'not_found' || code === 'product_unavailable' || code === 'product_variant_unavailable') {
        msg = "Bu ürün artık satışta değil ve sepetinizden kaldırıldı.";
      }
      setCartError(msg);
      return { success: false, code, message: msg };
    } finally {
      updatingItemIdsRef.current.delete(itemId);
      setUpdatingItemIds(Array.from(updatingItemIdsRef.current));
    }
  }, [removeFromCart, applyServerCart, refreshCart]);

  const clearCart = useCallback(async () => {
    setCartError(null);
    try {
      await cartApi.clearCart();
      setCartData(null);
      setItems([]);
      return { success: true };
    } catch (err) {
      const msg = getCartErrorMessage(err);
      setCartError(msg);
      return { success: false, code: err.code, message: msg };
    }
  }, []);

  const totalCount = cartData?.totalQuantity || items.reduce((s, i) => s + (i.qty || i.quantity || 0), 0);
  const totalPrice = cartData?.subtotal || items.reduce((s, i) => {
    const p = typeof i.unitPrice === 'number' ? i.unitPrice : parseFloat(String(i.price).replace(/[^0-9.]/g, '')) || 0;
    return s + p * (i.qty || i.quantity || 1);
  }, 0);

  const value = {
    cartData,
    items,
    loading,
    cartError,
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
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
