import { request } from "./apiClient";
import { safeGetJson, safeSetJson } from "../utils/storage";

// Mock reviews fallback when backend does not return data yet
const MOCK_REVIEWS = [
  {
    id: "rev-1",
    productId: "p1",
    userName: "Ayşe Y.",
    rating: 5,
    isVerified: true,
    title: "Harika kalitede bir ürün",
    comment: "Çok zarif ve şık duruyor. Paketlemesi de çok özenliydi, kesinlikle tavsiye ederim!",
    createdAt: "2026-07-15T10:30:00Z"
  },
  {
    id: "rev-2",
    productId: "p1",
    userName: "Mehmet K.",
    rating: 4,
    isVerified: true,
    title: "Beklediğim gibi geldi",
    comment: "Ürün görseldeki ile birebir aynı. Kargo 2 gün içinde teslim edildi.",
    createdAt: "2026-07-10T14:20:00Z"
  },
  {
    id: "rev-3",
    productId: "p2",
    userName: "Selin B.",
    rating: 5,
    isVerified: true,
    title: "Çok şık ve modern",
    comment: "Fiyat performans açısından mükemmel bir alışveriş oldu. Teşekkürler!",
    createdAt: "2026-07-18T09:15:00Z"
  }
];

export async function getReviewsByProduct(productId) {
  try {
    const res = await request(`/products/${productId}/reviews`, { method: "GET" });
    if (res && Array.isArray(res) && res.length > 0) return res;
    if (res && Array.isArray(res.items) && res.items.length > 0) return res.items;
  } catch (e) {
    // Fallback to local storage or mock data if server endpoint returns error
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
    isVerified: true,
    title: reviewData.title || "",
    comment: reviewData.comment || reviewData.body || "",
    createdAt: new Date().toISOString(),
    status: 'pending',
    isApproved: false
  };

  const storedKey = `isa_reviews_${productId}`;
  const localList = safeGetJson(storedKey, []);
  localList.unshift(newReview);
  safeSetJson(storedKey, localList);

  const adminKey = "isa_admin_all_reviews";
  const adminList = safeGetJson(adminKey, []);
  adminList.unshift(newReview);
  safeSetJson(adminKey, adminList);

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

  const adminList = safeGetJson("isa_admin_all_reviews", []);
  return adminList;
}

export async function approveReview(id) {
  try {
    await request(`/admin/reviews/${id}/approve`, { method: "PUT" });
  } catch (e) {}

  const adminKey = "isa_admin_all_reviews";
  const list = safeGetJson(adminKey, []);
  const updated = list.map(r => r.id === id ? { ...r, isApproved: true, status: 'approved' } : r);
  safeSetJson(adminKey, updated);
  return { success: true };
}

export async function rejectReview(id) {
  try {
    await request(`/admin/reviews/${id}/reject`, { method: "PUT" });
  } catch (e) {}

  const adminKey = "isa_admin_all_reviews";
  const list = safeGetJson(adminKey, []);
  const updated = list.map(r => r.id === id ? { ...r, isApproved: false, status: 'rejected' } : r);
  safeSetJson(adminKey, updated);
  return { success: true };
}

export async function deleteAdminReview(id) {
  try {
    await request(`/admin/reviews/${id}`, { method: "DELETE" });
  } catch (e) {}

  const adminKey = "isa_admin_all_reviews";
  const list = safeGetJson(adminKey, []);
  const updated = list.filter(r => r.id !== id);
  safeSetJson(adminKey, updated);
  return { success: true };
}
