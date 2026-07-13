import { request } from "./apiClient";

// Kamu Banner İstekleri
export function getBanners() {
  return request("/banners");
}

// Admin Banner İstekleri
export function getAdminBanners() {
  return request("/admin/banners");
}

export function createAdminBanner(payload) {
  return request("/admin/banners", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminBanner(id, payload) {
  return request(`/admin/banners/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function updateAdminBannerStatus(id, isActive) {
  return request(`/admin/banners/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive })
  });
}

export function deleteAdminBanner(id) {
  return request(`/admin/banners/${id}`, {
    method: "DELETE"
  });
}
