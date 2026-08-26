import { request } from "./apiClient";
import { safeGetItem, safeSetItem } from "../utils/storage";

export async function login(payload) {
  const result = await request("/auth/login", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(payload)
  });

  if (result?.accessToken) {
    safeSetItem("accessToken", result.accessToken);
  }

  return result;
}

export function register(payload) {
  // Register returns { userId, email, emailConfirmed, message }, does not return tokens
  return request("/auth/register", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(payload)
  });
}

export function me() {
  return request("/auth/me");
}

export async function logout() {
  try {
    return await request("/auth/logout", { 
      method: "POST",
      credentials: "include"
    });
  } catch (err) {
    return null;
  }
}

export async function logoutAll() {
  try {
    return await request("/auth/logout-all", { 
      method: "POST",
      credentials: "include"
    });
  } catch (err) {
    return null;
  }
}

export function refreshToken() {
  return request("/auth/refresh-token", {
    method: "POST",
    credentials: "include"
  });
}

export function verifyEmail(userId, token) {
  return request("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ userId, token })
  });
}

export function resendVerification(email) {
  return request("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export function forgotPassword(email) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export function resetPassword(payload) {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      userId: payload.userId,
      token: payload.token,
      newPassword: payload.newPassword,
      confirmPassword: payload.confirmPassword
    })
  });
}
