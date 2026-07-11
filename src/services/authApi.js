import { request } from "./apiClient";

export async function login(payload) {
  const result = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (result?.accessToken) {
    localStorage.setItem("accessToken", result.accessToken);
  }

  if (result?.refreshToken) {
    localStorage.setItem("refreshToken", result.refreshToken);
  }

  return result;
}

export async function register(payload) {
  const result = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (result?.accessToken) {
    localStorage.setItem("accessToken", result.accessToken);
  }

  if (result?.refreshToken) {
    localStorage.setItem("refreshToken", result.refreshToken);
  }

  return result;
}

export function me() {
  return request("/auth/me");
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  return request("/auth/logout", { method: "POST" }).catch(() => null);
}

export function refreshToken(token) {
  return request("/auth/refresh-token", {
    method: "POST",
    body: JSON.stringify({ refreshToken: token })
  });
}
