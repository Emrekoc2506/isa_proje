import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { demoUser } from '../data/dashboard';

const CartContext = createContext(null);

// Kullanıcıya özel localStorage anahtarı
const getKey = (email) => `mv_cart_${email || 'guest'}`;

export function CartProvider({ children }) {
  // Oturum açık kullanıcıyı takip et (basit demo: sabit kullanıcı)
  const userEmail = demoUser.email;
  const storageKey = getKey(userEmail);

  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // items değişince localStorage'a yaz
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  // Sepete ekle (aynı ürün varsa qty artır)
  const addToCart = useCallback((product) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  // Miktarı değiştir
  const updateQty = useCallback((id, qty) => {
    if (qty < 1) {
      setItems(prev => prev.filter(i => i.id !== id));
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
    }
  }, []);

  // Ürünü sil
  const removeFromCart = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  // Sepeti tamamen temizle
  const clearCart = useCallback(() => setItems([]), []);

  // Toplam ürün adedi
  const totalCount = items.reduce((s, i) => s + i.qty, 0);

  // Toplam tutar (fiyatı parse et)
  const totalPrice = items.reduce((s, i) => {
    const price = parseFloat(String(i.price).replace(/[^0-9.]/g, '')) || 0;
    return s + price * i.qty;
  }, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, updateQty, removeFromCart, clearCart, totalCount, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
