import { request } from "./apiClient";

function normalizeCouponPayload(payload = {}) {
  const isPercentage = payload.isPercentage ?? (payload.discountType === "Percentage" || payload.discountType === 0);
  const isFreeShipping = Boolean(payload.isFreeShipping || payload.discountType === "FreeShipping" || payload.discountType === 2);
  
  let discountType = "FixedAmount";
  if (isFreeShipping) discountType = "FreeShipping";
  else if (isPercentage) discountType = "Percentage";
  else if (payload.discountType) discountType = payload.discountType;

  const discountValue = Number(payload.discountValue ?? payload.discountAmount ?? payload.discountPercentage ?? 0);
  const nowStr = new Date().toISOString();

  let startsAt = payload.startsAt || payload.createdAt || nowStr;
  let endsAt = payload.endsAt || payload.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return {
    code: String(payload.code || "").trim().toUpperCase(),
    name: payload.name || payload.title || payload.code || "Kupon",
    discountType: discountType,
    discountValue: discountValue,
    maximumDiscountAmount: payload.maximumDiscountAmount != null ? Number(payload.maximumDiscountAmount) : null,
    minimumCartAmount: payload.minimumCartAmount != null ? Number(payload.minimumCartAmount) : null,
    startsAt: startsAt,
    endsAt: endsAt,
    totalUsageLimit: payload.totalUsageLimit != null ? Number(payload.totalUsageLimit) : (payload.maxUses != null ? Number(payload.maxUses) : null),
    perUserUsageLimit: payload.perUserUsageLimit != null ? Number(payload.perUserUsageLimit) : 1,
    isActive: payload.isActive ?? true,
    isFreeShipping: isFreeShipping,
    isCombinable: payload.isCombinable ?? false,
    productIds: Array.isArray(payload.productIds) ? payload.productIds : null,
    categoryIds: Array.isArray(payload.categoryIds) ? payload.categoryIds : null,
  };
}

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
    body: JSON.stringify(normalizeCouponPayload(payload))
  });
}

export function updateAdminCoupon(id, payload) {
  return request(`/admin/coupons/${id}`, {
    method: "PUT",
    body: JSON.stringify(normalizeCouponPayload(payload))
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
