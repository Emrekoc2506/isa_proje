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
  const query = new URLSearchParams(params);
  return request(`/admin/products?${query.toString()}`);
}

export function getAdminProductById(id) {
  return request(`/admin/products/${id}`);
}

export function createAdminProduct(payload) {
  return request("/admin/products", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminProduct(id, payload) {
  return request(`/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteAdminProduct(id) {
  return request(`/admin/products/${id}`, {
    method: "DELETE"
  });
}

export function updateAdminProductStatus(id, isActive) {
  // Kural: nesne gövdesi ister: { "isActive": true }
  return request(`/admin/products/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive })
  });
}

export function updateAdminProductPrice(id, price) {
  // Kural: nesne gövdesi ister: { "price": 250 }
  return request(`/admin/products/${id}/price`, {
    method: "PATCH",
    body: JSON.stringify({ price })
  });
}
