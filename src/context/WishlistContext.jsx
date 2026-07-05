import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { demoUser } from '../data/dashboard';

const WishlistContext = createContext(null);

// Kullanıcıya özel localStorage anahtarı
const getKey = (email) => `mv_wishlist_${email || 'guest'}`;

export function WishlistProvider({ children }) {
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

  // Favorilere ekle/çıkar
  const toggleWishlist = useCallback((product) => {
    setItems(prev => {
      const exists = prev.some(i => i.id === product.id);
      if (exists) {
        return prev.filter(i => i.id !== product.id);
      }
      return [...prev, product];
    });
  }, []);

  // Favorilerden çıkar
  const removeFromWishlist = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  // Ürün favorilerde mi kontrolü
  const isInWishlist = useCallback((id) => {
    return items.some(i => i.id === id);
  }, [items]);

  // Toplam favori sayısı
  const totalCount = items.length;

  return (
    <WishlistContext.Provider value={{ items, toggleWishlist, removeFromWishlist, isInWishlist, totalCount }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
