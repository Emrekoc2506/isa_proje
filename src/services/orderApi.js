import { request } from "./apiClient";

export function createOrder(payload) {
  return request("/orders", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export const createAuthenticatedOrder = createOrder;

export function createGuestOrder(payload) {
  return request("/orders/guest", {
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

export function trackGuestOrder(payload) {
  return request("/orders/guest/track", {
    method: "POST",
    body: JSON.stringify({
      orderNumber: payload.orderNumber,
      email: payload.email
    })
  });
}

// Admin Sipariş Entegrasyonları (Read-only)
export function getAdminOrders(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.pageSize) query.append('pageSize', params.pageSize);
  if (params.status) query.append('status', params.status);
  
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return request(`/admin/orders${queryString}`);
}

export function getAdminOrderById(id) {
  return request(`/admin/orders/${id}`);
}

export function updateAdminOrderStatus(id, status) {
  console.warn("Order status updates are read-only on the backend.");
  return Promise.resolve();
}
