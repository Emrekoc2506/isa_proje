// Hata CODE'una göre doğrudan Türkçe mesaj döndür
export function translateErrorCode(code) {
  if (!code) return null;
  switch (code) {
    case "invalid_credentials":         return "E-posta veya şifre hatalı.";
    case "email_not_confirmed":          return "E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzu kontrol edin.";
    case "email_already_registered":     return "Bu e-posta adresi zaten kayıtlı.";
    case "account_inactive":             return "Hesabınız pasif durumda. Lütfen destek ekibiyle iletişime geçin.";
    case "account_locked":               return "Çok fazla hatalı deneme nedeniyle hesabınız kilitlendi. Lütfen bir süre bekleyin.";
    case "registration_failed":          return "Kayıt işlemi başarısız oldu. Lütfen bilgilerinizi kontrol edin.";
    case "invalid_refresh_token":        return "Oturum süresi doldu. Lütfen tekrar giriş yapın.";
    case "unauthorized":                 return "Bu işlem için giriş yapmanız gerekmektedir.";
    case "not_found":                    return "İstenilen kaynak bulunamadı.";
    case "validation_error":             return "Lütfen form alanlarını kontrol edin.";
    case "network_error":                return "Sunucuya bağlanılamadı. Lütfen sunucunun açık olduğundan emin olun.";
    default:                             return null;
  }
}

export function translateErrorMessage(msg) {
  if (!msg) return "Bilinmeyen bir hata oluştu.";
  
  const m = String(msg).toLowerCase();
  
  if (m.includes("already registered") || m.includes("already taken") || m.includes("already exists") || m.includes("is already in use") || m.includes("duplicateemail")) {
    return "Bu e-posta adresi zaten kayıtlı.";
  }
  if (m.includes("incorrect password") || m.includes("invalid password") || m.includes("password is incorrect")) {
    return "Şifreniz hatalı.";
  }
  if (m.includes("non alphanumeric") || m.includes("special character")) {
    return "Şifreniz en az bir özel karakter (örn: *, -, !) içermelidir.";
  }
  if (m.includes("uppercase")) {
    return "Şifreniz en az bir büyük harf (A-Z) içermelidir.";
  }
  if (m.includes("lowercase")) {
    return "Şifreniz en az bir küçük harf (a-z) içermelidir.";
  }
  if (m.includes("digit") || m.includes("number")) {
    return "Şifreniz en az bir rakam (0-9) içermelidir.";
  }
  if (m.includes("email address is not confirmed") || m.includes("emailconfirmed") || m.includes("email is not confirmed")) {
    return "E-posta adresiniz henüz doğrulanmamış.";
  }
  if (m.includes("invalid email or password") || m.includes("invalid credentials") || m.includes("username or password") || m.includes("e-posta veya şifre hatalı")) {
    return "E-posta veya şifre hatalı.";
  }
  if (m.includes("account is inactive")) {
    return "Hesabınız pasif durumda. Lütfen destek ekibiyle iletişime geçin.";
  }
  if (m.includes("account is locked")) {
    return "Çok fazla hatalı deneme nedeniyle hesabınız kilitlendi. Lütfen bir süre bekleyin.";
  }
  if (m.includes("failed to fetch") || m.includes("network error") || m.includes("connection refused") || m.includes("err_connection_refused")) {
    return "Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.";
  }
  
  return msg;
}

export class ApiError extends Error {
  constructor({ message, code, status, traceId, errors }) {
    super(message || "Bilinmeyen bir hata oluştu.");
    this.name = "ApiError";
    this.code = code || "unknown_error";
    this.status = status || 500;
    this.traceId = traceId || null;
    this.errors = errors || null;
  }
}

/**
 * Parses raw error responses into standard ApiError instances.
 * Supports both business errors ({success, message, code, traceId})
 * and validation errors (ProblemDetails with errors property).
 */
export async function parseResponseError(response) {
  const status = response.status;
  let responseData = null;

  try {
    responseData = await response.json();
  } catch (e) {
    // If response is not JSON
  }

  const traceId = responseData?.traceId || response.headers.get("X-Correlation-ID");

  if (!responseData) {
    return new ApiError({
      message: `İstek başarısız oldu (Durum: ${status})`,
      status,
      traceId
    });
  }

  // RFC ProblemDetails checking
  if (responseData.errors && typeof responseData.errors === "object" && !Array.isArray(responseData.errors)) {
    // Validation error
    // Extract first error message if available for the main message
    let validationMsg = "Lütfen form alanlarını kontrol edin.";
    const keys = Object.keys(responseData.errors);
    if (keys.length > 0) {
      const firstKeyErrors = responseData.errors[keys[0]];
      if (Array.isArray(firstKeyErrors) && firstKeyErrors.length > 0) {
        validationMsg = firstKeyErrors[0];
      }
    }

    return new ApiError({
      message: translateErrorMessage(validationMsg),
      code: "validation_error",
      status,
      traceId,
      errors: responseData.errors
    });
  }

  // Business Error Format { success: false, message, code, errors, traceId }
  const code = responseData.code || "business_error";
  // Önce code'a göre Türkçe mesaj dene, yoksa message'ı çevir
  const translatedMsg = translateErrorCode(code) || translateErrorMessage(responseData.message || "İşlem başarısız oldu.");
  return new ApiError({
    message: translatedMsg,
    code,
    status,
    traceId: responseData.traceId || traceId,
    errors: responseData.errors
  });
}

