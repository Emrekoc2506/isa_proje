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

export function updateAdminCustomerRole(id, role) {
  return request(`/admin/customers/${id}/role`, {
    method: "POST",
    body: JSON.stringify({ role })
  });
}
