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

export function removeWishlistItem(productId) {
  return request(`/wishlist/${productId}`, {
    method: "DELETE"
  });
}

export function mergeWishlist(productIds) {
  return request("/wishlist/merge", {
    method: "POST",
    body: JSON.stringify({
      productIds: Array.isArray(productIds) ? productIds : []
    })
  });
}
