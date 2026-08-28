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
        const mapped = (data || []).map(item => {
          const name = item.name || item.productName || "Favori Ürün";
          const image = item.imageUrl || item.image || "/ornek resim.jpg";
          const price = typeof item.price === 'number' ? `${item.price} ₺` : item.price || "0 ₺";
          const unitPrice = typeof item.price === 'number' ? item.price : (Number(String(item.price || '').replace(/[^\d.-]/g, '')) || 0);
          return {
            id: item.productId || item.id,
            productId: item.productId || item.id,
            productName: name,
            name: name,
            slug: item.slug || "",
            imageUrl: image,
            image: image,
            price: price,
            unitPrice: unitPrice,
            oldPrice: item.oldPrice == null ? null : (typeof item.oldPrice === 'number' ? `${item.oldPrice} ₺` : item.oldPrice),
            addedAt: item.addedAt || item.createdAt || null
          };
        });
        setItems(mapped);
      } else {
        const localStored = safeGetJson("isa_guest_wishlist", []);
        let localIds = prepareWishlistProductIds(localStored);

        if (localIds.length > 0) {
          let cachedProducts = [];
          try {
            const raw = sessionStorage.getItem("muhristan_cached_products");
            cachedProducts = raw ? JSON.parse(raw) : [];
          } catch {
            cachedProducts = [];
          }
          const allCatalog = cachedProducts;

          const mapped = localIds.map(id => {
            const foundInCatalog = allCatalog.find(p => String(p.id) === String(id) || String(p.productId) === String(id));
            const foundInLocalObj = Array.isArray(localStored) 
              ? localStored.find(item => typeof item === 'object' && String(item?.id || item?.productId) === String(id)) 
              : null;

            const p = foundInCatalog || foundInLocalObj || { id };
            const name = p.name || p.productName || "Favori Ürün";
            const image = p.image || p.imageUrl || "/ornek resim.jpg";
            const price = typeof p.price === 'number' ? `${p.price} ₺` : p.price || "0 ₺";
            const unitPrice = typeof p.price === 'number' ? p.price : (Number(String(p.price || '').replace(/[^\d.-]/g, '')) || 0);

            return {
              id: p.id || id,
              productId: p.id || p.productId || id,
              productName: name,
              name: name,
              slug: p.slug || "",
              imageUrl: image,
              image: image,
              price: price,
              unitPrice: unitPrice,
              oldPrice: p.oldPrice == null ? null : (typeof p.oldPrice === 'number' ? `${p.oldPrice} ₺` : p.oldPrice),
              addedAt: new Date().toISOString()
            };
          });
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

  const addFavorite = useCallback(async (input) => {
    const productId = typeof input === 'object' ? (input?.id || input?.productId) : input;
    if (!productId) return;
    
    try {
      setLoading(true);
      if (isAuthenticated && isValidGuid(productId)) {
        try {
          await wishlistApi.addWishlistItem(productId);
          await reloadWishlist();
          return;
        } catch (apiErr) {
          console.warn("Backend addWishlistItem failed/CORS, falling back to optimistic local:", apiErr);
        }
      }
      
      let localStored = safeGetJson("isa_guest_wishlist", []);
      if (!Array.isArray(localStored)) localStored = [];
      const exists = localStored.some(item => {
        const itemID = typeof item === 'object' ? (item?.id || item?.productId) : item;
        return String(itemID) === String(productId);
      });

      if (!exists) {
        localStored.push(input);
        safeSetJson("isa_guest_wishlist", localStored);
      }
      
      setItems(prev => {
        const alreadyIn = prev.some(i => String(i.productId) === String(productId) || String(i.id) === String(productId));
        if (alreadyIn) return prev;
        const newItem = typeof input === 'object' ? {
          id: input.id || productId,
          productId: input.id || input.productId || productId,
          productName: input.name || input.productName || "Favori Ürün",
          slug: input.slug || "",
          imageUrl: input.image || input.imageUrl || "",
          price: typeof input.price === 'number' ? `${input.price} ₺` : input.price || "0 ₺",
          addedAt: new Date().toISOString()
        } : { id: productId, productId, productName: "Favori Ürün", price: "0 ₺", addedAt: new Date().toISOString() };
        return [newItem, ...prev];
      });
    } catch (err) {
      console.error("Failed to add favorite:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, reloadWishlist]);

  const removeFavorite = useCallback(async (input) => {
    const productId = typeof input === 'object' ? (input?.id || input?.productId) : input;
    if (!productId) return;

    try {
      setLoading(true);
      if (isAuthenticated && isValidGuid(productId)) {
        try {
          await wishlistApi.removeWishlistItem(productId);
          await reloadWishlist();
          return;
        } catch (apiErr) {
          console.warn("Backend removeWishlistItem failed/CORS, falling back to optimistic local:", apiErr);
        }
      }
      
      let localStored = safeGetJson("isa_guest_wishlist", []);
      if (Array.isArray(localStored)) {
        const filtered = localStored.filter(item => {
          const itemID = typeof item === 'object' ? (item?.id || item?.productId) : item;
          return String(itemID) !== String(productId);
        });
        safeSetJson("isa_guest_wishlist", filtered);
      }
      
      setItems(prev => prev.filter(i => String(i.productId) !== String(productId) && String(i.id) !== String(productId)));
    } catch (err) {
      console.error("Failed to remove favorite:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, reloadWishlist]);

  const toggleFavorite = useCallback(async (input) => {
    const productId = typeof input === 'object' ? (input?.id || input?.productId) : input;
    if (!productId) return;

    const exists = items.some(i => String(i.productId) === String(productId) || String(i.id) === String(productId));
    if (exists) {
      await removeFavorite(input);
    } else {
      await addFavorite(input);
    }
  }, [items, addFavorite, removeFavorite]);

  const isFavorite = useCallback((input) => {
    const productId = typeof input === 'object' ? (input?.id || input?.productId) : input;
    if (!productId) return false;
    return items.some(i => String(i.productId) === String(productId) || String(i.id) === String(productId));
  }, [items]);

  const mergeGuestWishlist = useCallback(async (guestItemsInput = []) => {
    try {
      setLoading(true);
      const cleanIds = prepareWishlistProductIds(guestItemsInput);
      const res = await wishlistApi.mergeGuestWishlist(cleanIds);
      const rawList = Array.isArray(res) ? res : (res?.items || []);
      const mapped = rawList.map(item => {
        const name = item.name || item.productName || "Favori Ürün";
        const image = item.imageUrl || item.image || "/ornek resim.jpg";
        const price = typeof item.price === 'number' ? `${item.price} ₺` : item.price || "0 ₺";
        const unitPrice = typeof item.price === 'number' ? item.price : (Number(String(item.price || '').replace(/[^\d.-]/g, '')) || 0);
        return {
          id: item.id || item.productId,
          productId: item.productId || item.id,
          productName: name,
          name: name,
          slug: item.slug || "",
          imageUrl: image,
          image: image,
          price: price,
          unitPrice: unitPrice,
          oldPrice: item.oldPrice == null ? null : (typeof item.oldPrice === 'number' ? `${item.oldPrice} ₺` : item.oldPrice),
          addedAt: item.addedAt || item.createdAt || null
        };
      });
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
    totalCount: items.length,
    wishlistCount: items.length,
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
