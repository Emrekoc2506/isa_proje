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

export function changeEmail(payload) {
  return request("/account/email", {
    method: "PUT",
    body: JSON.stringify({
      newEmail: payload.newEmail,
      currentPassword: payload.currentPassword
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

export async function updateAddress(id, payload) {
  try {
    return await request(`/account/addresses/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  } catch (err) {
    // IIS WebDAV 405 durumunda POST alternatif rotalarını dene
    try {
      return await request(`/account/addresses/${id}`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch {
      return await request(`/account/addresses/update/${id}`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }
  }
}

export async function deleteAddress(id) {
  try {
    return await request(`/account/addresses/${id}`, { method: "DELETE" });
  } catch (e) {
    try {
      return await request(`/account/addresses/${id}/delete`, { method: "POST", body: JSON.stringify({ confirm: true }) });
    } catch (e2) {
      try {
        return await request(`/account/addresses/delete/${id}`, { method: "POST" });
      } catch (e3) {
        return await request(`/account/addresses/${id}`, { method: "POST", body: JSON.stringify({ isDeleted: true }) });
      }
    }
  }
}

export async function setDefaultShipping(id) {
  try {
    return await request(`/account/addresses/${id}/default-shipping`, {
      method: "PATCH"
    });
  } catch {
    try {
      return await request(`/account/addresses/${id}/default-shipping`, {
        method: "POST"
      });
    } catch {
      return await request(`/account/addresses/${id}/default-shipping`, {
        method: "PUT"
      });
    }
  }
}

export async function setDefaultBilling(id) {
  try {
    return await request(`/account/addresses/${id}/default-billing`, {
      method: "PATCH"
    });
  } catch {
    try {
      return await request(`/account/addresses/${id}/default-billing`, {
        method: "POST"
      });
    } catch {
      return await request(`/account/addresses/${id}/default-billing`, {
        method: "PUT"
      });
    }
  }
}
