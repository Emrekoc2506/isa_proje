import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as wishlistApi from '../services/wishlistApi';
import { getProducts } from '../services/productApi';
import { isValidGuid, prepareWishlistProductIds } from '../utils/wishlist';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reloadWishlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (isAuthenticated) {
        const data = await wishlistApi.getWishlist();
        const mapped = (data || []).map(item => ({
          id: item.productId || item.id,
          productId: item.productId || item.id,
          productName: item.productName || item.name || "",
          slug: item.slug || "",
          imageUrl: item.imageUrl || item.image || "",
          price: typeof item.price === 'number' ? `${item.price} ₺` : item.price || "0 ₺",
          oldPrice: item.oldPrice == null ? null : (typeof item.oldPrice === 'number' ? `${item.oldPrice} ₺` : item.oldPrice),
          addedAt: item.addedAt || item.createdAt || null
        }));
        setItems(mapped);
      } else {
        const raw = localStorage.getItem("isa_guest_wishlist");
        let localIds = [];
        try {
          localIds = raw ? JSON.parse(raw) : [];
        } catch {
          localIds = [];
        }
        localIds = prepareWishlistProductIds(localIds);

        if (localIds.length > 0) {
          const productsData = await getProducts({ pageSize: 100 }).catch(() => ({ items: [] }));
          const catalog = productsData?.items || [];
          
          const mapped = localIds.map(id => {
            const prod = catalog.find(p => p.id === id);
            if (!prod) return null;
            return {
              id: prod.id,
              productId: prod.id,
              productName: prod.name,
              slug: prod.slug,
              imageUrl: prod.image || (prod.images && prod.images[0]?.url) || "",
              price: typeof prod.price === 'number' ? `${prod.price} ₺` : prod.price,
              oldPrice: prod.oldPrice == null ? null : (typeof prod.oldPrice === 'number' ? `${prod.oldPrice} ₺` : prod.oldPrice),
              addedAt: new Date().toISOString()
            };
          }).filter(Boolean);
          setItems(mapped);
        } else {
          setItems([]);
        }
      }
    } catch (err) {
      console.error("Wishlist reload failed:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Sync wishlist on auth change
  useEffect(() => {
    reloadWishlist();
  }, [isAuthenticated, reloadWishlist]);

  const addFavorite = useCallback(async (productId) => {
    if (!isValidGuid(productId)) {
      console.warn("Invalid product ID format.");
      return;
    }
    try {
      setLoading(true);
      if (isAuthenticated) {
        await wishlistApi.addWishlistItem(productId);
        await reloadWishlist();
      } else {
        const raw = localStorage.getItem("isa_guest_wishlist");
        let localIds = [];
        try {
          localIds = raw ? JSON.parse(raw) : [];
        } catch {
          localIds = [];
        }
        localIds = prepareWishlistProductIds(localIds);
        if (!localIds.includes(productId)) {
          localIds.push(productId);
          localStorage.setItem("isa_guest_wishlist", JSON.stringify(localIds));
        }
        await reloadWishlist();
      }
    } catch (err) {
      console.error("Failed to add favorite:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, reloadWishlist]);

  const removeFavorite = useCallback(async (productId) => {
    try {
      setLoading(true);
      if (isAuthenticated) {
        await wishlistApi.removeWishlistItem(productId);
        await reloadWishlist();
      } else {
        const raw = localStorage.getItem("isa_guest_wishlist");
        let localIds = [];
        try {
          localIds = raw ? JSON.parse(raw) : [];
        } catch {
          localIds = [];
        }
        localIds = prepareWishlistProductIds(localIds);
        const filtered = localIds.filter(id => id !== productId);
        localStorage.setItem("isa_guest_wishlist", JSON.stringify(filtered));
        await reloadWishlist();
      }
    } catch (err) {
      console.error("Failed to remove favorite:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, reloadWishlist]);

  const toggleFavorite = useCallback(async (product) => {
    const productId = product.databaseId ?? product.productId ?? product.id;
    const exists = items.some(i => i.productId === productId || i.id === productId);
    if (exists) {
      await removeFavorite(productId);
    } else {
      await addFavorite(productId);
    }
  }, [items, addFavorite, removeFavorite]);

  const isFavorite = useCallback((productId) => {
    return items.some(i => i.productId === productId || i.id === productId);
  }, [items]);

  const mergeGuestWishlist = useCallback(async (productIds) => {
    try {
      setLoading(true);
      const cleanIds = prepareWishlistProductIds(productIds);
      const data = await wishlistApi.mergeWishlist(cleanIds);
      const mapped = (data || []).map(item => ({
        id: item.productId || item.id,
        productId: item.productId || item.id,
        productName: item.productName || item.name || "",
        slug: item.slug || "",
        imageUrl: item.imageUrl || item.image || "",
        price: typeof item.price === 'number' ? `${item.price} ₺` : item.price || "0 ₺",
        oldPrice: item.oldPrice == null ? null : (typeof item.oldPrice === 'number' ? `${item.oldPrice} ₺` : item.oldPrice),
        addedAt: item.addedAt || item.createdAt || null
      }));
      setItems(mapped);
      localStorage.removeItem("isa_guest_wishlist");
      return mapped;
    } catch (err) {
      console.error("Failed to merge guest wishlist:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearWishlistState = useCallback(() => {
    setItems([]);
    setError(null);
    setLoading(false);
  }, []);

  const value = {
    items,
    isLoading: loading,
    loading,
    error,
    isFavorite,
    isInWishlist: isFavorite, // legacy compatibility
    addFavorite,
    removeFavorite,
    removeFromWishlist: removeFavorite, // legacy compatibility
    toggleFavorite,
    toggleWishlist: toggleFavorite, // legacy compatibility
    reloadWishlist,
    refreshWishlist: reloadWishlist, // legacy compatibility
    mergeGuestWishlist,
    clearWishlistState
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
