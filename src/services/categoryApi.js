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

export async function updateAdminCategory(id, payload) {
  try {
    return await request(`/admin/categories/${id}/update`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  } catch (err) {
    if (err.status === 404 || err.status === 405 || (err.message && err.message.includes('405'))) {
      try {
        return await request(`/admin/categories/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } catch (e2) {
        if (e2.status === 404 || e2.status === 405) {
          return await request(`/admin/categories/${id}`, {
            method: "POST",
            body: JSON.stringify(payload)
          });
        }
        throw e2;
      }
    }
    throw err;
  }
}

export function deleteAdminCategory(id) {
  return request(`/admin/categories/${id}/hard-delete`, {
    method: "POST",
    body: JSON.stringify({ confirm: true })
  });
}

export async function updateAdminCategoryStatus(id, isActive) {
  // Kural: nesne gövdesi ister: { "isActive": true }
  try {
    return await request(`/admin/categories/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive })
    });
  } catch (err) {
    if (err.status === 404 || err.status === 405) {
      try {
        return await request(`/admin/categories/${id}/status`, {
          method: "POST",
          body: JSON.stringify({ isActive })
        });
      } catch (e2) {
        if (e2.status === 404 || e2.status === 405) {
          return await updateAdminCategory(id, { isActive });
        }
        throw e2;
      }
    }
    throw err;
  }
}
