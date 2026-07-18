import { request } from "./apiClient";

export function getAdminCustomers() {
  return request("/admin/customers");
}

export function getAdminCustomerById(id) {
  return request(`/admin/customers/${id}`);
}

export function updateAdminCustomerStatus(id, isActive) {
  return request(`/admin/customers/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive })
  });
}
