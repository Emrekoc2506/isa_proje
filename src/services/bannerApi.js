import { request } from "./apiClient";

// Kamu Banner İstekleri
export function getBanners() {
  return request("/banners");
}

// Admin Banner İstekleri
export function createAdminBanner(payload) {
  // payload: { title, subtitle, image, imageMobile, cta, href, sortOrder, isActive }
  return request("/admin/banners", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminBannerStatus(id, isActive) {
  // Kural: nesne gövdesi ister: { "isActive": true }
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
