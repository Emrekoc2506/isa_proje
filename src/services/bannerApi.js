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
  return request(`/admin/banners/${id}/update`, {
    method: "POST",
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
  return request(`/admin/banners/${id}/hard-delete`, {
    method: "POST",
    body: JSON.stringify({ confirm: true })
  });
}
