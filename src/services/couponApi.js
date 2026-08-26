import { request } from "./apiClient";

function normalizeCouponPayload(payload = {}) {
  const isFreeShipping = Boolean(
    payload.isFreeShipping ||
    payload.discountType === "FreeShipping" ||
    payload.discountType === 2
  );
  const isPercentage = Boolean(
    payload.isPercentage ||
    payload.discountType === "Percentage" ||
    payload.discountType === 0
  );
  
  // CouponDiscountType Enum in C#: 0 = Percentage, 1 = FixedAmount, 2 = FreeShipping
  let discountType;
  if (isFreeShipping) {
    discountType = 2;
  } else if (isPercentage) {
    discountType = 0;
  } else if (payload.discountType === 1 || payload.discountType === "FixedAmount") {
    discountType = 1;
  } else if (typeof payload.discountType === 'number') {
    discountType = payload.discountType;
  } else {
    discountType = 1;
  }

  // Calculate actual discount value based on mode
  let discountValue = 0;
  if (payload.discountValue != null && payload.discountValue !== '') {
    discountValue = Number(payload.discountValue);
  } else if (isPercentage) {
    discountValue = Number(payload.discountPercentage || 0);
  } else {
    discountValue = Number(payload.discountAmount || 0);
  }

  const nowStr = new Date().toISOString();
  let startsAt = payload.startsAt || payload.createdAt || nowStr;
  let endsAt = payload.endsAt || payload.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return {
    code: String(payload.code || "").trim().toUpperCase(),
    name: payload.name || payload.title || payload.code || "Kupon",
    discountType: discountType,
    discountValue: discountValue,
    maximumDiscountAmount: (payload.maximumDiscountAmount != null && payload.maximumDiscountAmount !== '') ? Number(payload.maximumDiscountAmount) : null,
    minimumCartAmount: (payload.minimumCartAmount != null && payload.minimumCartAmount !== '') ? Number(payload.minimumCartAmount) : null,
    startsAt: startsAt,
    endsAt: endsAt,
    totalUsageLimit: payload.totalUsageLimit != null ? Number(payload.totalUsageLimit) : (payload.maxUses != null ? Number(payload.maxUses) : null),
    perUserUsageLimit: payload.perUserUsageLimit != null ? Number(payload.perUserUsageLimit) : 1,
    isActive: payload.isActive ?? true,
    isFreeShipping: isFreeShipping,
    isCombinable: payload.isCombinable ?? false,
    productIds: (Array.isArray(payload.productIds) && payload.productIds.length > 0) ? payload.productIds : null,
    categoryIds: (Array.isArray(payload.categoryIds) && payload.categoryIds.length > 0) ? payload.categoryIds : null,
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
  return request(`/admin/coupons/${id}/update`, {
    method: "POST",
    body: JSON.stringify(normalizeCouponPayload(payload))
  });
}

export function updateAdminCouponStatus(id, isActive) {
  return request(`/admin/coupons/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ isActive })
  });
}

export function deleteAdminCoupon(id) {
  return request(`/admin/coupons/${id}/delete`, {
    method: "POST",
    body: JSON.stringify({ confirm: true })
  });
}
