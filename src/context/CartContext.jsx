import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as cartApi from '../services/cartApi';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cartData, setCartData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cartApi.getCart();
      setCartData(data);
      
      const mapped = (data?.items || []).map(item => ({
        ...item,
        qty: item.quantity,            // Legacy compatibility
        price: `${item.unitPrice} ₺`,  // Legacy compatibility
        image: item.imageUrl,          // Legacy compatibility
        name: item.productName         // Legacy compatibility
      }));
      setItems(mapped);
    } catch (err) {
      console.error("Cart fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync cart on auth change
  useEffect(() => {
    if (isAuthenticated) {
      // Try to merge guest cart into user cart
      cartApi.mergeGuestCart()
        .then(() => refreshCart())
        .catch((err) => {
          console.warn("Failed to merge guest cart, fetching cart directly:", err);
          refreshCart();
        });
    } else {
      refreshCart();
    }
  }, [isAuthenticated, refreshCart]);

  const addToCart = useCallback(async (product, quantity = 1, variantId = null) => {
    try {
      const data = await cartApi.addCartItem({
        productId: product.id,
        productVariantId: variantId,
        quantity
      });
      setCartData(data);
      const mapped = (data?.items || []).map(item => ({
        ...item,
        qty: item.quantity,
        price: `${item.unitPrice} ₺`,
        image: item.imageUrl,
        name: item.productName
      }));
      setItems(mapped);
    } catch (err) {
      console.error("Failed to add to cart:", err);
      alert(err.message || "Ürün sepete eklenemedi.");
      throw err;
    }
  }, []);

  const updateQty = useCallback(async (itemId, qty) => {
    if (qty < 1) {
      return removeFromCart(itemId);
    }

    try {
      const data = await cartApi.updateCartItem(itemId, { quantity: qty });
      setCartData(data);
      const mapped = (data?.items || []).map(item => ({
        ...item,
        qty: item.quantity,
        price: `${item.unitPrice} ₺`,
        image: item.imageUrl,
        name: item.productName
      }));
      setItems(mapped);
    } catch (err) {
      console.error("Failed to update cart quantity:", err);
      alert(err.message || "Sepet güncellenemedi.");
    }
  }, []);

  const removeFromCart = useCallback(async (itemId) => {
    try {
      await cartApi.removeCartItem(itemId);
      await refreshCart();
    } catch (err) {
      console.error("Failed to remove item from cart:", err);
      alert(err.message || "Ürün sepetten silinemedi.");
    }
  }, [refreshCart]);

  const clearCart = useCallback(async () => {
    try {
      await cartApi.clearCart();
      setCartData(null);
      setItems([]);
    } catch (err) {
      console.error("Failed to clear cart:", err);
    }
  }, []);

  const totalCount = cartData?.totalQuantity || items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cartData?.subtotal || items.reduce((s, i) => {
    const p = parseFloat(String(i.price).replace(/[^0-9.]/g, '')) || 0;
    return s + p * i.qty;
  }, 0);

  const value = {
    cartData,
    items,
    loading,
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
