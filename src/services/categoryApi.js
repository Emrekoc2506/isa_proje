import { request } from "./apiClient";

// Kamu Kategori İstekleri
export function getCategories() {
  return request("/categories");
}

export function getCategoryTree() {
  return request("/categories/tree");
}

export function getCategoryBySlug(slug) {
  return request(`/categories/${encodeURIComponent(slug)}`);
}

// Admin Kategori İstekleri
export function getAdminCategories() {
  return request("/admin/categories");
}

export function getAdminCategoryById(id) {
  return request(`/admin/categories/${id}`);
}

export function createAdminCategory(payload) {
  return request("/admin/categories", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminCategory(id, payload) {
  return request(`/admin/categories/${id}/update`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function deleteAdminCategory(id) {
  return request(`/admin/categories/${id}/hard-delete`, {
    method: "POST",
    body: JSON.stringify({ confirm: true })
  });
}

export function updateAdminCategoryStatus(id, isActive) {
  // Kural: nesne gövdesi ister: { "isActive": true }
  return request(`/admin/categories/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive })
  });
}
