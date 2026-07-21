import { request } from "./apiClient";

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
    if (res && Array.isArray(res)) return res;
    if (res && Array.isArray(res.items)) return res.items;
  } catch (e) {
    // Fallback to local storage or mock data if server endpoint returns error
  }

  const storedKey = `isa_reviews_${productId}`;
  const stored = localStorage.getItem(storedKey);
  const localList = stored ? JSON.parse(stored) : [];
  const defaultList = MOCK_REVIEWS.filter(r => r.productId === productId);
  
  return [...localList, ...defaultList];
}

export async function addReview(productId, reviewData) {
  try {
    const res = await request(`/products/${productId}/reviews`, {
      method: "POST",
      body: JSON.stringify(reviewData)
    });
    if (res) return res;
  } catch (e) {
    // Fallback local save
  }

  const newReview = {
    id: `rev-local-${Date.now()}`,
    productId,
    userName: reviewData.userName || "Kullanıcı",
    rating: reviewData.rating || 5,
    isVerified: true,
    title: reviewData.title || "",
    comment: reviewData.comment || "",
    createdAt: new Date().toISOString()
  };

  const storedKey = `isa_reviews_${productId}`;
  const stored = localStorage.getItem(storedKey);
  const localList = stored ? JSON.parse(stored) : [];
  localList.unshift(newReview);
  localStorage.setItem(storedKey, JSON.stringify(localList));

  return newReview;
}
