import { request } from "./apiClient";

export function getProfile() {
  return request("/account/profile");
}

export function updateProfile(payload) {
  return request("/account/profile", {
    method: "PUT",
    body: JSON.stringify({
      fullName: payload.fullName,
      phoneNumber: payload.phoneNumber || null
    })
  });
}

export function changePassword(payload) {
  return request("/account/password", {
    method: "PUT",
    body: JSON.stringify({
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
      confirmPassword: payload.confirmPassword
    })
  });
}

export function getAddresses() {
  return request("/account/addresses");
}

export function getAddress(id) {
  return request(`/account/addresses/${id}`);
}

export function createAddress(payload) {
  return request("/account/addresses", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAddress(id, payload) {
  return request(`/account/addresses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteAddress(id) {
  return request(`/account/addresses/${id}`, {
    method: "DELETE"
  });
}

export function setDefaultShipping(id) {
  return request(`/account/addresses/${id}/default-shipping`, {
    method: "PATCH"
  });
}

export function setDefaultBilling(id) {
  return request(`/account/addresses/${id}/default-billing`, {
    method: "PATCH"
  });
}
