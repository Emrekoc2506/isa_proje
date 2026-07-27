import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as wishlistApi from '../services/wishlistApi';
import { getProducts } from '../services/productApi';
import { safeGetJson, safeSetJson, safeRemoveItem } from '../utils/storage';
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
        let localIds = prepareWishlistProductIds(safeGetJson("isa_guest_wishlist", []));

        if (localIds.length > 0) {
          const productsData = await getProducts({ pageSize: 100 }).catch(() => ({ items: [] }));
          const catalog = productsData?.items || [];
          const matched = catalog.filter(p => localIds.includes(p.id));
          const mapped = matched.map(p => ({
            id: p.id,
            productId: p.id,
            productName: p.name,
            slug: p.slug || "",
            imageUrl: p.image || p.imageUrl || "",
            price: typeof p.price === 'number' ? `${p.price} ₺` : p.price || "0 ₺",
            oldPrice: p.oldPrice == null ? null : (typeof p.oldPrice === 'number' ? `${p.oldPrice} ₺` : p.oldPrice),
            addedAt: new Date().toISOString()
          }));
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
        let localIds = prepareWishlistProductIds(safeGetJson("isa_guest_wishlist", []));
        if (!localIds.includes(productId)) {
          localIds.push(productId);
          safeSetJson("isa_guest_wishlist", localIds);
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
        let localIds = prepareWishlistProductIds(safeGetJson("isa_guest_wishlist", []));
        const filtered = localIds.filter(id => id !== productId);
        safeSetJson("isa_guest_wishlist", filtered);
        await reloadWishlist();
      }
    } catch (err) {
      console.error("Failed to remove favorite:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, reloadWishlist]);

  const toggleFavorite = useCallback(async (productId) => {
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

  const mergeGuestWishlist = useCallback(async (guestItemsInput = []) => {
    try {
      setLoading(true);
      const cleanIds = prepareWishlistProductIds(guestItemsInput);
      const res = await wishlistApi.mergeGuestWishlist(cleanIds);
      const rawList = Array.isArray(res) ? res : (res?.items || []);
      const mapped = rawList.map(item => ({
        id: item.id || item.productId,
        productId: item.productId || item.id,
        productName: item.productName || item.name || "",
        slug: item.slug || "",
        imageUrl: item.imageUrl || item.image || "",
        price: typeof item.price === 'number' ? `${item.price} ₺` : item.price || "0 ₺",
        oldPrice: item.oldPrice == null ? null : (typeof item.oldPrice === 'number' ? `${item.oldPrice} ₺` : item.oldPrice),
        addedAt: item.addedAt || item.createdAt || null
      }));
      setItems(mapped);
      safeRemoveItem("isa_guest_wishlist");
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
    return {
      items: [],
      wishlistItems: [],
      favorites: [],
      loading: false,
      isFavorite: () => false,
      isInWishlist: () => false,
      addFavorite: async () => {},
      removeFavorite: async () => {},
      removeFromWishlist: async () => {},
      toggleFavorite: async () => {},
      toggleWishlist: async () => {},
      reloadWishlist: async () => {},
      refreshWishlist: async () => {},
      mergeGuestWishlist: async () => {},
      clearWishlistState: () => {}
    };
  }
  return context;
};
