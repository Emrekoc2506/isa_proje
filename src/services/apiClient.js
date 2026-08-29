import { getGuestSessionId } from "../utils/guestSession";
import {
  parseResponseError,
  ApiError,
  translateErrorMessage,
} from "../api/apiError";
import { isJwtExpired } from "../utils/jwt";
import { safeGetItem, safeSetItem, safeRemoveItem } from "../utils/storage";

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

const PUBLIC_PREFIXES = [
  "/products",
  "/categories",
  "/banners",
  "/blog",
  "/coupons/validate",
  "/payment-methods",
];

function isPublicEndpoint(path, method = "GET") {
  const p = (path || "").toLowerCase();
  const m = (method || "GET").toUpperCase();
  if (p.includes("/admin/")) return false;
  if (p.includes("/auth/me")) return false;
  if (p.includes("/auth/")) return true;
  if (m === "GET") {
    return PUBLIC_PREFIXES.some((prefix) => p.startsWith(prefix) || p.includes(prefix));
  }
  return false;
}

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

let isSessionExpiredDispatched = false;

function dispatchSessionExpired() {
  if (isSessionExpiredDispatched) return;
  isSessionExpiredDispatched = true;
  setTimeout(() => { isSessionExpiredDispatched = false; }, 5000);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:session-expired"));
  }
}

async function request(path, options = {}) {
  let token = safeGetItem("accessToken");
  const isPublic = isPublicEndpoint(path, options.method);
  const isRetry = options._isRetry === true;
  const headers = new Headers(options.headers || {});
  const credentials = options.credentials ?? "include";

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Guest Session Headers
  const guestSessionId = getGuestSessionId();
  if (guestSessionId) {
    headers.set("X-Guest-Session-Id", guestSessionId);
    headers.set("X-Guest-SessionId", guestSessionId); // Legacy compatibility
  }

  // Handle expired tokens before sending request
  if (token && isJwtExpired(token)) {
    safeRemoveItem("accessToken");
    token = null;
  }

  if (token && !isRetry && (!isJwtExpired(token) || !isPublic)) {
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
      credentials,
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
    const isAuthPath =
      path.includes("/auth/refresh-token") ||
      path.includes("/auth/login") ||
      path.includes("/auth/register");

    if (response.status === 401 && !isAuthPath && !isRetry) {
      // If it's a public endpoint (e.g. GET /products), retry once WITHOUT Authorization header!
      if (isPublic) {
        const publicRetryOptions = { ...options, _isRetry: true };
        const publicRetryHeaders = new Headers(options.headers || {});
        publicRetryHeaders.delete("Authorization");
        publicRetryOptions.headers = publicRetryHeaders;
        return request(path, publicRetryOptions);
      }

      // If token in localStorage changed while this request was in flight, retry with new token
      const currentToken = safeGetItem("accessToken");
      if (currentToken && currentToken !== token && !isJwtExpired(currentToken)) {
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
        refreshAccessToken()
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

function refreshAccessToken() {
  if (activeRefreshPromise) return activeRefreshPromise;

  activeRefreshPromise = (async () => {
    const response = await fetch(`${apiBaseUrl}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Refresh token rotation failed");
    }

    const data = await response.json();
    if (data && data.accessToken) {
      safeSetItem("accessToken", data.accessToken);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("auth:token-refreshed", {
            detail: { token: data.accessToken },
          })
        );
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
  const hadToken = Boolean(safeGetItem("accessToken"));
  safeRemoveItem("accessToken");

  if (hadToken && typeof window !== "undefined") {
    const currentPath = window.location.pathname.toLowerCase();
    
    // Sipariş onay/sonuç sayfasındayken kullanıcıyı asla giriş sayfasına yönlendirme
    if (currentPath.startsWith("/odeme/sonuc") || currentPath.startsWith("/odeme-sonuc")) {
      return;
    }

    const protectedRoutes = [
      "/admin", "/panel", "/siparislerim", "/adreslerim", "/profil", "/hesabim"
    ];

    const isProtectedRoute = 
      protectedRoutes.some(route => currentPath.startsWith(route)) ||
      (currentPath === "/odeme" || currentPath === "/odeme/");

    if (isProtectedRoute && currentPath !== "/giris" && currentPath !== "/uye-ol") {
      window.location.href = "/giris";
    }
  }
}

export { apiBaseUrl, request, refreshAccessToken };
