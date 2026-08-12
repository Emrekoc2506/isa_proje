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
      quantity: payload.quantity || 1,
      customNote: payload.customNote || payload.note || null,
      note: payload.customNote || payload.note || null
    })
  });
}

export function updateCartItem(itemId, payload) {
  const qty = typeof payload === 'object' && payload !== null ? payload.quantity : payload;
  return request(`/cart/items/${itemId}/update`, {
    method: "POST",
    body: JSON.stringify({
      quantity: qty
    })
  });
}

export function removeCartItem(itemId) {
  return request(`/cart/items/${itemId}/delete`, {
    method: "POST"
  });
}

export function clearCart() {
  return request("/cart/clear", {
    method: "POST"
  });
}

export function mergeGuestCart() {
  return request("/cart/merge", {
    method: "POST"
  });
}
