import { request } from "./apiClient";

export function createGuestOrder(payload) {
  // payload: { customerName, customerEmail, customerPhone, shippingAddress: { city, district, fullAddress }, items: [ { productId, quantity } ] }
  return request("/orders/guest", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function createAuthenticatedOrder(payload) {
  // payload: { shippingAddress: { city, district, fullAddress }, items: [ { productId, quantity } ] }
  // Not: backend controller rotası api/orders (ve [HttpPost] [Authorize] nitelikli)
  return request("/orders", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getMyOrders() {
  return request("/orders/my");
}

export function getMyOrderById(id) {
  return request(`/orders/my/${id}`);
}

// Admin Sipariş Entegrasyonları
export function getAdminOrders() {
  return request("/admin/orders");
}

export function updateAdminOrderStatus(id, status) {
  // payload formatı: { status: "Pending" | "Preparing" | "Shipped" | "Delivered" | "Cancelled" | "Refunded" }
  return request(`/admin/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });
}
