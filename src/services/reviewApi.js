import { request } from "./apiClient";
import { safeGetJson, safeSetJson } from "../utils/storage";

// Mock reviews fallback array (cleared of dummy data)
const MOCK_REVIEWS = [];

export async function getReviewsByProduct(productId) {
  try {
    const res = await request(`/products/${productId}/reviews`, { method: "GET" });
    if (res && Array.isArray(res) && res.length > 0) return res;
    if (res && Array.isArray(res.items) && res.items.length > 0) return res.items;
  } catch (e) {
    // Fallback
  }

  const storedKey = `isa_reviews_${productId}`;
  const localList = safeGetJson(storedKey, []);
  const adminList = safeGetJson("isa_admin_all_reviews", []).filter(r => String(r.productId) === String(productId));
  const defaultList = MOCK_REVIEWS.filter(r => String(r.productId) === String(productId));

  const combined = [...localList, ...adminList, ...defaultList];
  const uniqueMap = new Map();
  combined.forEach(item => {
    if (item && item.id && !uniqueMap.has(item.id)) {
      uniqueMap.set(item.id, item);
    }
  });

  return Array.from(uniqueMap.values());
}

export async function addReview(productId, reviewData) {
  let created = null;
  try {
    const res = await request(`/products/${productId}/reviews`, {
      method: "POST",
      body: JSON.stringify(reviewData)
    });
    if (res && res.id) created = res;
  } catch (e) {
    // Fallback local save
  }

  const newReview = created || {
    id: `rev-local-${Date.now()}`,
    productId,
    productName: reviewData.productName || "Ürün",
    userName: reviewData.userName || "Kullanıcı",
    rating: reviewData.rating || 5,
    isVerified: false,
    isApproved: false,
    title: reviewData.title || "",
    comment: reviewData.comment || reviewData.body || "",
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  const storedKey = `isa_reviews_${productId}`;
  const localList = safeGetJson(storedKey, []);
  localList.unshift(newReview);
  safeSetJson(storedKey, localList);

  const adminKey = "isa_admin_all_reviews";
  const adminList = safeGetJson(adminKey, []);
  const existsInAdmin = adminList.some(r => r.id === newReview.id);
  if (!existsInAdmin) {
    adminList.unshift(newReview);
    safeSetJson(adminKey, adminList);
  }

  return newReview;
}

/* ── Admin Review Moderation ──────────────────────────── */

export async function getPendingReviews() {
  try {
    const res = await request("/admin/reviews/pending");
    if (res && Array.isArray(res) && res.length > 0) return res;
    if (res && Array.isArray(res.items) && res.items.length > 0) return res.items;
  } catch (e) {
    // Fallback
  }

  let adminList = safeGetJson("isa_admin_all_reviews", []);
  if (!Array.isArray(adminList) || adminList.length === 0) {
    adminList = [...MOCK_REVIEWS];
    safeSetJson("isa_admin_all_reviews", adminList);
  }
  return adminList;
}

export async function approveReview(id) {
  try {
    await request(`/admin/reviews/${id}/approve`, { method: "PUT" });
  } catch (e) {}

  const adminKey = "isa_admin_all_reviews";
  const list = safeGetJson(adminKey, []);
  let targetProdId = null;
  const updated = list.map(r => {
    if (r.id === id) {
      targetProdId = r.productId;
      return { ...r, isApproved: true, isVerified: true, status: 'approved' };
    }
    return r;
  });
  safeSetJson(adminKey, updated);

  if (targetProdId) {
    const pKey = `isa_reviews_${targetProdId}`;
    const pList = safeGetJson(pKey, []);
    const pUpdated = pList.map(r => r.id === id ? { ...r, isApproved: true, isVerified: true, status: 'approved' } : r);
    safeSetJson(pKey, pUpdated);
  }

  return { success: true };
}

export async function rejectReview(id) {
  try {
    await request(`/admin/reviews/${id}/reject`, { method: "PUT" });
  } catch (e) {}

  const adminKey = "isa_admin_all_reviews";
  const list = safeGetJson(adminKey, []);
  let targetProdId = null;
  const updated = list.map(r => {
    if (r.id === id) {
      targetProdId = r.productId;
      return { ...r, isApproved: false, isVerified: false, status: 'rejected' };
    }
    return r;
  });
  safeSetJson(adminKey, updated);

  if (targetProdId) {
    const pKey = `isa_reviews_${targetProdId}`;
    const pList = safeGetJson(pKey, []);
    const pUpdated = pList.map(r => r.id === id ? { ...r, isApproved: false, isVerified: false, status: 'rejected' } : r);
    safeSetJson(pKey, pUpdated);
  }

  return { success: true };
}

export async function deleteAdminReview(id) {
  try {
    await request(`/admin/reviews/${id}`, { method: "DELETE" });
  } catch (e) {
    try {
      await request(`/admin/reviews/${id}`, { method: "PUT" });
    } catch (e2) {}
  }

  const adminKey = "isa_admin_all_reviews";
  const list = safeGetJson(adminKey, []);
  let targetProdId = null;
  const updated = list.filter(r => {
    if (r.id === id) targetProdId = r.productId;
    return r.id !== id;
  });
  safeSetJson(adminKey, updated);

  if (targetProdId) {
    const pKey = `isa_reviews_${targetProdId}`;
    const pList = safeGetJson(pKey, []);
    const pUpdated = pList.filter(r => r.id !== id);
    safeSetJson(pKey, pUpdated);
  }

  return { success: true };
}
