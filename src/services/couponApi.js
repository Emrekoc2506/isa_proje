import { request } from "./apiClient";

export function validateCoupon(code) {
  return request("/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code })
  });
}

// Admin Kupon Yönetimi
export function getAdminCoupons() {
  return request("/admin/coupons");
}

export function getAdminCouponById(id) {
  return request(`/admin/coupons/${id}`);
}

export function createAdminCoupon(payload) {
  return request("/admin/coupons", {
    method: "POST",
    body: JSON.stringify({
      code: payload.code,
      discountAmount: payload.discountAmount || 0,
      discountPercentage: payload.discountPercentage || 0,
      isPercentage: payload.isPercentage,
      expiryDate: payload.expiryDate || null,
      maxUses: payload.maxUses || null,
      isActive: payload.isActive ?? true
    })
  });
}

export function updateAdminCoupon(id, payload) {
  return request(`/admin/coupons/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      code: payload.code,
      discountAmount: payload.discountAmount || 0,
      discountPercentage: payload.discountPercentage || 0,
      isPercentage: payload.isPercentage,
      expiryDate: payload.expiryDate || null,
      maxUses: payload.maxUses || null,
      isActive: payload.isActive ?? true
    })
  });
}

export function updateAdminCouponStatus(id, isActive) {
  return request(`/admin/coupons/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive })
  });
}

export function deleteAdminCoupon(id) {
  return request(`/admin/coupons/${id}`, {
    method: "DELETE"
  });
}
