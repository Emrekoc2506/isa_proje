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

export function register(payload) {
  // Register returns { userId, email, emailConfirmed, message }, does not return tokens
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function me() {
  return request("/auth/me");
}

export async function logout() {
  const refreshTokenVal = localStorage.getItem("refreshToken");

  try {
    return await request("/auth/logout", { 
      method: "POST",
      body: JSON.stringify({ refreshToken: refreshTokenVal })
    });
  } catch (err) {
    return null;
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}

export async function logoutAll() {
  try {
    return await request("/auth/logout-all", { 
      method: "POST"
    });
  } catch (err) {
    return null;
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}

export function refreshToken(token) {
  return request("/auth/refresh-token", {
    method: "POST",
    body: JSON.stringify({ refreshToken: token })
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
