import { request } from "./apiClient";

export function getWishlist() {
  return request("/wishlist", {
    method: "GET"
  });
}

export function addWishlistItem(productId) {
  return request(`/wishlist/${productId}`, {
    method: "POST"
  });
}

export async function removeWishlistItem(productId) {
  try {
    return await request(`/wishlist/${productId}`, { method: "DELETE" });
  } catch (e) {
    try {
      return await request(`/wishlist/${productId}`, { method: "PUT" });
    } catch (e2) {
      return await request(`/wishlist/${productId}/delete`, { method: "POST", body: JSON.stringify({ confirm: true }) });
    }
  }
}

export function mergeWishlist(productIds) {
  return request("/wishlist/merge", {
    method: "POST",
    body: JSON.stringify({
      productIds: Array.isArray(productIds) ? productIds : []
    })
  });
}

export function mergeGuestWishlist(productIds) {
  return mergeWishlist(productIds);
}
