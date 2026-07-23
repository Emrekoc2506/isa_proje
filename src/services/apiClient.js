import { getGuestSessionId } from "../utils/guestSession";
import {
  parseResponseError,
  ApiError,
  translateErrorMessage,
} from "../api/apiError";

let apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "https://localhost:7148/api";

if (
  typeof window !== "undefined" &&
  window.location.protocol === "https:" &&
  apiBaseUrl.startsWith("http://") &&
  !apiBaseUrl.includes("localhost")
) {
  apiBaseUrl = apiBaseUrl.replace("http://", "https://");
}

let isRefreshing = false;
let refreshQueue = [];
let activeRefreshPromise = null;

function subscribeTokenRefresh(resolve, reject) {
  refreshQueue.push({ resolve, reject });
}

function resolveRefreshQueue(token) {
  const queue = refreshQueue;
  refreshQueue = [];
  queue.forEach((item) => item.resolve(token));
}

function rejectRefreshQueue(error) {
  const queue = refreshQueue;
  refreshQueue = [];
  queue.forEach((item) => item.reject(error));
}

function dispatchSessionExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:session-expired"));
  }
}

async function request(path, options = {}) {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("accessToken") : null;
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Guest Session Headers
  const guestSessionId = getGuestSessionId();
  if (guestSessionId) {
    headers.set("X-Guest-Session-Id", guestSessionId);
    headers.set("X-Guest-SessionId", guestSessionId); // Legacy compatibility
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Timeout logic: isUpload ? 60000 : 15000 (options.timeout takes precedence)
  const isUpload = options.body instanceof FormData;
  const timeoutMs = options.timeout ?? (isUpload ? 60000 : 15000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      if (response.status === 204) {
        return null;
      }
      return response.json();
    }

    // Handle 401 Unauthorized
    const isRetry = options._isRetry === true;
    const isAuthPath =
      path.includes("/auth/refresh-token") ||
      path.includes("/auth/login") ||
      path.includes("/auth/register");

    if (response.status === 401 && !isAuthPath && !isRetry) {
      const refreshTokenVal = typeof localStorage !== "undefined" ? localStorage.getItem("refreshToken") : null;

      if (!refreshTokenVal) {
        dispatchSessionExpired();
        handleLogoutRedirect();
        throw new ApiError({
          message: "Oturum süresi doldu.",
          status: 401,
          code: "unauthorized",
        });
      }

      // If token in localStorage changed while this request was in flight, retry with new token
      const currentToken = typeof localStorage !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (currentToken && currentToken !== token) {
        const retryOptions = { ...options, _isRetry: true };
        const retryHeaders = new Headers(options.headers || {});
        if (!(options.body instanceof FormData)) {
          retryHeaders.set("Content-Type", "application/json");
        }
        if (guestSessionId) {
          retryHeaders.set("X-Guest-Session-Id", guestSessionId);
          retryHeaders.set("X-Guest-SessionId", guestSessionId);
        }
        retryHeaders.set("Authorization", `Bearer ${currentToken}`);
        retryOptions.headers = retryHeaders;
        return request(path, retryOptions);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshAccessToken(refreshTokenVal)
          .then((newAccessToken) => {
            isRefreshing = false;
            resolveRefreshQueue(newAccessToken);
          })
          .catch((err) => {
            isRefreshing = false;
            const authErr = new ApiError({
              message: "Oturum süresi doldu.",
              status: 401,
              code: "unauthorized",
            });
            rejectRefreshQueue(authErr);
            dispatchSessionExpired();
            handleLogoutRedirect();
          });
      }

      // Queue the original request
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(
          (newAccessToken) => {
            // Retry once with _isRetry flag
            const newOptions = { ...options, _isRetry: true };
            const newHeaders = new Headers(options.headers || {});
            if (!(options.body instanceof FormData)) {
              newHeaders.set("Content-Type", "application/json");
            }
            if (guestSessionId) {
              newHeaders.set("X-Guest-Session-Id", guestSessionId);
              newHeaders.set("X-Guest-SessionId", guestSessionId);
            }
            newHeaders.set("Authorization", `Bearer ${newAccessToken}`);
            newOptions.headers = newHeaders;

            request(path, newOptions)
              .then(resolve)
              .catch(reject);
          },
          (queueError) => {
            reject(queueError);
          }
        );
      });
    }

    // Process regular error response
    const apiErr = await parseResponseError(response);
    throw apiErr;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }
    let errorMsg = err.message;
    if (err.name === "AbortError") {
      errorMsg =
        "Sunucu yanıt vermedi (Zaman aşımı). Lütfen sunucunun açık olduğundan emin olun.";
    }
    // Network errors or others
    throw new ApiError({
      message:
        translateErrorMessage(errorMsg) ||
        "Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.",
      status: 500,
      code: "network_error",
    });
  }
}

function refreshAccessToken(refreshTokenVal) {
  if (activeRefreshPromise) return activeRefreshPromise;

  activeRefreshPromise = (async () => {
    const response = await fetch(`${apiBaseUrl}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: refreshTokenVal }),
    });

    if (!response.ok) {
      throw new Error("Refresh token rotation failed");
    }

    const data = await response.json();
    if (data.accessToken && data.refreshToken) {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      return data.accessToken;
    }
    throw new Error("Invalid token response");
  })().finally(() => {
    activeRefreshPromise = null;
  });

  return activeRefreshPromise;
}

function handleLogoutRedirect() {
  if (typeof localStorage === "undefined") return;
  const hadToken =
    localStorage.getItem("accessToken") || localStorage.getItem("refreshToken");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");

  // Only force redirect to login if the user was actually authenticated before
  if (
    hadToken &&
    typeof window !== "undefined" &&
    window.location.pathname !== "/giris" &&
    window.location.pathname !== "/uye-ol"
  ) {
    window.location.href = "/giris";
  }
}

export { apiBaseUrl, request };
