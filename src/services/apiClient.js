const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "https://localhost:7148/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("accessToken");
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      // Kullanıcıyı login sayfasına yönlendir
      window.location.href = "/giris";
      throw new Error("Oturum süresi doldu, lütfen tekrar giriş yapın.");
    }

    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `İstek başarısız oldu (Durum: ${response.status})` };
    }

    // Standart hata formatı: { success, message, errors, traceId }
    throw errorData || new Error(`İstek başarısız oldu: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export { apiBaseUrl, request };
