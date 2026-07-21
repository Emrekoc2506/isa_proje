const STORAGE_KEY = "isa_recently_viewed_products";
const MAX_ITEMS = 10;

export function getRecentlyViewed() {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function addRecentlyViewed(product) {
  if (!product || !product.id || typeof window === "undefined") return;
  try {
    const list = getRecentlyViewed();
    // Filter out existing item to place newly viewed product at the top
    const filtered = list.filter(item => item.id !== product.id);
    
    // Minimal product representation to save space in localStorage
    const minimalProduct = {
      id: product.id,
      name: product.name || product.title,
      price: product.price,
      discountPrice: product.discountPrice || product.salePrice,
      imageUrl: product.imageUrl || product.images?.[0] || product.image,
      categoryName: product.categoryName || product.category?.name || "",
      isNew: product.isNew || false,
      isSale: product.isSale || false,
      stockQuantity: product.stockQuantity ?? 10
    };

    const updated = [minimalProduct, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // Suppress storage quota errors
  }
}

export function clearRecentlyViewed() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
