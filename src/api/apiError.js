export function translateErrorMessage(msg) {
  if (!msg) return "Bilinmeyen bir hata oluştu.";
  
  const m = String(msg).toLowerCase();
  
  if (m.includes("already taken") || m.includes("already exists") || m.includes("is already in use") || m.includes("duplicateemail")) {
    return "Bu e-posta adresi zaten kullanımda.";
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
  if (m.includes("emailconfirmed") || m.includes("email is not confirmed")) {
    return "Lütfen e-posta adresinizi doğrulayın.";
  }
  if (m.includes("invalid credentials") || m.includes("username or password") || m.includes("e-posta veya şifre hatalı")) {
    return "E-posta veya şifre hatalı.";
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
  return new ApiError({
    message: translateErrorMessage(responseData.message || "İşlem başarısız oldu."),
    code: responseData.code || "business_error",
    status,
    traceId: responseData.traceId || traceId,
    errors: responseData.errors
  });
}

