import { getGuestSessionId } from "../utils/guestSession";
import {
  parseResponseError,
  ApiError,
  translateErrorMessage,
} from "../api/apiError";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "https://localhost:7148/api";

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

async function request(path, options = {}) {
  const token = localStorage.getItem("accessToken");
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
    if (
      response.status === 401 &&
      !path.includes("/auth/refresh-token") &&
      !path.includes("/auth/login")
    ) {
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        handleLogoutRedirect();
        throw new ApiError({
          message: "Oturum süresi doldu.",
          status: 401,
          code: "unauthorized",
        });
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshAccessToken(refreshToken)
          .then((newAccessToken) => {
            isRefreshing = false;
            onRefreshed(newAccessToken);
          })
          .catch((err) => {
            isRefreshing = false;
            handleLogoutRedirect();
            processQueueReject(err);
          });
      }

      // Queue the original request
      const retryOriginalRequest = new Promise((resolve, reject) => {
        subscribeTokenRefresh((newAccessToken) => {
          // Clone request options with the new authorization header
          const newOptions = { ...options };
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

          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(
            () => retryController.abort(),
            timeoutMs,
          );
          newOptions.signal = retryController.signal;

          fetch(`${apiBaseUrl}${path}`, newOptions)
            .then((res) => {
              clearTimeout(retryTimeoutId);
              if (res.ok) {
                if (res.status === 204) resolve(null);
                else resolve(res.json());
              } else {
                parseResponseError(res).then(reject);
              }
            })
            .catch((e) => {
              clearTimeout(retryTimeoutId);
              reject(e);
            });
        });
      });

      return retryOriginalRequest;
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

async function refreshAccessToken(refreshToken) {
  const response = await fetch(`${apiBaseUrl}/auth/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error("Refresh token rotation failed");
  }

  const data = await response.json();
  if (data.accessToken && data.refreshToken) {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return data.accessToken;
  }
  throw new Error("Invalid token response");
}

function processQueueReject(err) {
  // Clear any subscribers
  refreshSubscribers = [];
}

function handleLogoutRedirect() {
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
