import { request } from "./apiClient";

// Kamu Ürün İstekleri
export function getProducts(params = {}) {
  const query = new URLSearchParams(params);
  return request(`/products?${query.toString()}`);
}

export function getProductById(id) {
  return request(`/products/${id}`);
}

export function getProductBySlug(slug) {
  return request(`/products/by-slug/${encodeURIComponent(slug)}`);
}

export function getFeaturedProducts() {
  return request("/products/featured");
}

export function getNewProducts() {
  return request("/products/new");
}

export function getSaleProducts() {
  return request("/products/sale");
}

export function getProductReviews(productId) {
  return request(`/products/${productId}/reviews`);
}

export function createProductReview(productId, payload) {
  return request(`/products/${productId}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// Admin Ürün İstekleri
export function getAdminProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.pageSize) query.append("pageSize", params.pageSize);
  return request(`/admin/products?${query.toString()}`);
}

export function getAdminProductById(id) {
  return request(`/admin/products/${id}`);
}

export function createAdminProduct(payload) {
  const backendPayload = { ...payload };
  if (payload.imageUrls !== undefined || payload.imageUrl !== undefined) {
    backendPayload.imageUrls = Array.isArray(payload.imageUrls)
      ? payload.imageUrls
      : (payload.imageUrl ? [payload.imageUrl] : []);
  }
  if (payload.weightGram != null && payload.weightGram !== '') {
    backendPayload.weight = parseFloat(payload.weightGram);
    backendPayload.weightUnit = 'gr';
  }
  return request("/admin/products", {
    method: "POST",
    body: JSON.stringify(backendPayload)
  });
}

export function updateAdminProduct(id, payload) {
  const backendPayload = { ...payload };
  if (payload.imageUrls !== undefined || payload.imageUrl !== undefined) {
    backendPayload.imageUrls = Array.isArray(payload.imageUrls)
      ? payload.imageUrls
      : (payload.imageUrl ? [payload.imageUrl] : []);
  }
  if (payload.weightGram != null && payload.weightGram !== '') {
    backendPayload.weight = parseFloat(payload.weightGram);
    backendPayload.weightUnit = 'gr';
  }
  return request(`/admin/products/${id}/update`, {
    method: "POST",
    body: JSON.stringify(backendPayload)
  });
}

export function deleteAdminProduct(id) {
  return request(`/admin/products/${id}/hard-delete`, {
    method: "POST",
    body: JSON.stringify({ confirm: true })
  });
}

export function updateAdminProductStatus(id, isActive) {
  return request(`/admin/products/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive })
  });
}

export function updateAdminProductPrice(id, price) {
  return request(`/admin/products/${id}/price`, {
    method: "PATCH",
    body: JSON.stringify({ price })
  });
}

export function updateAdminProductStock(id, payload) {
  const stockQuantity = typeof payload === 'object' ? payload.stockQuantity : payload;
  const note = (typeof payload === 'object' && payload.note) || "Admin stok güncellemesi";
  return request(`/admin/products/${id}/stock`, {
    method: "POST",
    body: JSON.stringify({
      stockQuantity,
      note
    })
  });
}

// Admin Varyant Yönetimi
export function createAdminProductVariant(productId, payload) {
  return request(`/admin/products/${productId}/variants`, {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      sku: payload.sku,
      barcode: payload.barcode || null,
      priceOverride: payload.priceOverride || null,
      oldPriceOverride: payload.oldPriceOverride || null,
      stockQuantity: payload.stockQuantity || 0,
      isActive: payload.isActive ?? true,
      imageUrl: payload.imageUrl || null
    })
  });
}

export function updateAdminProductVariant(productId, variantId, payload) {
  return request(`/admin/products/${productId}/variants/${variantId}`, {
    method: "PUT",
    body: JSON.stringify({
      name: payload.name,
      sku: payload.sku,
      barcode: payload.barcode || null,
      priceOverride: payload.priceOverride || null,
      oldPriceOverride: payload.oldPriceOverride || null,
      stockQuantity: payload.stockQuantity || 0,
      isActive: payload.isActive ?? true,
      imageUrl: payload.imageUrl || null
    })
  });
}

export function deleteAdminProductVariant(productId, variantId) {
  return request(`/admin/products/${productId}/variants/${variantId}`, {
    method: "DELETE"
  });
}

export function updateAdminProductVariantStock(productId, variantId, payload) {
  const stockQuantity = typeof payload === 'object' ? payload.stockQuantity : payload;
  const note = (typeof payload === 'object' && payload.note) || "Admin varyant stok güncellemesi";
  return request(`/admin/products/${productId}/variants/${variantId}/stock`, {
    method: "POST",
    body: JSON.stringify({
      stockQuantity,
      note
    })
  });
}

// Admin Stok / Envanter Yönetimi
export function getAdminLowStockProducts() {
  return request("/admin/inventory/low-stock");
}
