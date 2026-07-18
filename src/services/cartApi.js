import { request } from "./apiClient";

export function getCart() {
  return request("/cart");
}

export function addCartItem(payload) {
  return request("/cart/items", {
    method: "POST",
    body: JSON.stringify({
      productId: payload.productId,
      productVariantId: payload.productVariantId || null,
      quantity: payload.quantity || 1
    })
  });
}

export function updateCartItem(itemId, payload) {
  return request(`/cart/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({
      quantity: payload.quantity
    })
  });
}

export function removeCartItem(itemId) {
  return request(`/cart/items/${itemId}`, {
    method: "DELETE"
  });
}

export function clearCart() {
  return request("/cart", {
    method: "DELETE"
  });
}

export function mergeGuestCart() {
  return request("/cart/merge", {
    method: "POST"
  });
}
