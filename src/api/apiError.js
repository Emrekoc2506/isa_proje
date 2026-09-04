/**
 * API Hata Kodları ve Mesajları Türkçe Çeviri Sözlüğü
 */

export function translateErrorCode(code) {
  if (!code) return null;
  const c = String(code).toLowerCase();

  switch (c) {
    // Auth & Hesap
    case "abuse_blocked":                return "Bu işlem gerçekleştirilemiyor. Yardım için destek ekibiyle iletişime geçebilirsiniz.";
    case "invalid_credentials":           return "E-posta veya şifre hatalı.";
    case "email_not_confirmed":          return "E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzu kontrol edin.";
    case "email_already_registered":     return "Bu e-posta adresi zaten kayıtlı.";
    case "account_inactive":             return "Hesabınız pasif durumda. Lütfen destek ekibiyle iletişime geçin.";
    case "account_locked":               return "Çok fazla hatalı deneme nedeniyle hesabınız kilitlendi. Lütfen bir süre bekleyin.";
    case "registration_failed":          return "Kayıt işlemi başarısız oldu. Lütfen bilgilerinizi kontrol edin.";
    case "invalid_refresh_token":        return "Oturum süresi doldu. Lütfen tekrar giriş yapın.";
    case "token_expired":                return "Oturum süresi doldu. Lütfen tekrar giriş yapın.";
    case "unauthorized":                 return "Bu işlem için giriş yapmanız gerekmektedir.";
    case "forbidden":                    return "Bu işlemi yapmaya yetkiniz bulunmuyor.";
    
    // Genel & Validasyon
    case "not_found":                    return "İstenilen kayıt bulunamadı.";
    case "validation_error":             return "Lütfen form alanlarını kontrol edin.";
    case "confirmation_required":        return "Bu işlemi onaylamanız gerekiyor.";
    case "slug_conflict":                return "Bu bağlantı adı (slug) zaten kullanılıyor. Lütfen farklı bir isim girin.";
    case "too_many_requests":            return "Çok fazla istek gönderildi. Lütfen birkaç saniye bekleyip tekrar deneyin.";
    case "network_error":                return "Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.";
    case "method_not_allowed":           return "İşlem sunucu tarafından desteklenmiyor.";

    // Sepet & Stok & Ürün
    case "insufficient_stock":
    case "insufficient_available_stock": return "Bu ürün için yeterli stok bulunmuyor.";
    case "out_of_stock":                 return "Bu ürünün stoğu tükenmiştir.";
    case "product_unavailable":          return "Bu ürün artık satışta değil.";
    case "product_variant_unavailable":  return "Seçtiğiniz ürün seçeneği artık satışta değil.";
    case "quantity_limit_exceeded":      return "Bu ürün için izin verilen sipariş miktarı aşıldı.";
    case "cart_concurrency_conflict":    return "Sepetiniz şu anda güncelleniyor. Lütfen tekrar deneyin.";

    // Kupon
    case "invalid_coupon":
    case "coupon_not_found":             return "Kupon kodu geçersiz veya bulunamadı.";
    case "coupon_expired":               return "Bu kuponun kullanım süresi dolmuştur.";
    case "coupon_inactive":              return "Bu kupon şu anda aktif değil.";
    case "coupon_limit_exceeded":        return "Bu kuponun maksimum kullanım sınırına ulaşıldı.";
    case "coupon_min_amount_not_met":    return "Sepet tutarınız kuponun minimum sepet tutarını karşılamıyor.";
    case "coupon_already_used":          return "Bu kuponu daha önce kullandınız.";

    // Adres & Checkout
    case "guest_shipping_invalid":
    case "guest_shipping_address_invalid": return "Misafir teslimat adresi bilgileri eksik veya geçersiz.";
    case "guest_billing_invalid":
    case "guest_billing_address_invalid":  return "Misafir fatura adresi bilgileri eksik veya geçersiz.";
    case "shipping_address_required":    return "Lütfen bir teslimat adresi seçin veya ekleyin.";
    case "billing_address_required":     return "Lütfen bir fatura adresi seçin veya ekleyin.";

    default:                             return null;
  }
}

export function translateErrorMessage(msg) {
  if (!msg) return "Bilinmeyen bir hata oluştu.";
  
  const m = String(msg).trim().toLowerCase();

  // 0. Güvenlik & Anti-Abuse
  if (m.includes("abuse_blocked") || m.includes("abuse blocked")) {
    return "Bu işlem gerçekleştirilemiyor. Yardım için destek ekibiyle iletişime geçebilirsiniz.";
  }

  // 1. Stok & Ürün Hataları
  if (m.includes("insufficient available stock") || m.includes("insufficient stock") || m.includes("not enough stock")) {
    return "Bu ürün için yeterli stok bulunmuyor.";
  }
  if (m.includes("out of stock") || m.includes("ürün tükendi") || m.includes("stokta yok")) {
    return "Bu ürünün stoğu tükenmiştir.";
  }
  if (m.includes("product unavailable") || m.includes("product is unavailable") || m.includes("artık satışta değil")) {
    return "Bu ürün artık satışta değil.";
  }
  if (m.includes("product not found")) {
    return "Ürün bulunamadı veya satıştan kaldırıldı.";
  }
  if (m.includes("quantity limit exceeded") || m.includes("max quantity")) {
    return "Bu ürün için izin verilen sipariş miktarı aşıldı.";
  }
  if (m.includes("cart item not found") || m.includes("cart is empty")) {
    return "Sepetinizde ürün bulunamadı.";
  }

  // 2. Adres & Misafir Checkout Hataları
  if (m.includes("guest shipping address is invalid") || m.includes("guest shipping address")) {
    return "Misafir teslimat adresi bilgileri eksik veya geçersiz.";
  }
  if (m.includes("guest billing address is invalid") || m.includes("guest billing address")) {
    return "Misafir fatura adresi bilgileri eksik veya geçersiz.";
  }
  if (m.includes("shipping address is invalid") || m.includes("shipping address is required")) {
    return "Teslimat adresi geçersiz veya eksik.";
  }
  if (m.includes("billing address is invalid") || m.includes("billing address is required")) {
    return "Fatura adresi geçersiz veya eksik.";
  }
  if (m.includes("address not found")) {
    return "Adres bulunamadı.";
  }

  // 3. Form Zorunlu Alan Doğrulamaları (.NET DataAnnotations)
  if (m.includes("the phonenumber field is required") || m.includes("phonenumber is required")) {
    return "Telefon numarası zorunlu bir alandır.";
  }
  if (m.includes("the fullname field is required") || m.includes("fullname is required")) {
    return "Ad Soyad alanı zorunludur.";
  }
  if (m.includes("the title field is required") || m.includes("title is required")) {
    return "Adres başlığı zorunludur.";
  }
  if (m.includes("the addressline field is required") || m.includes("addressline is required")) {
    return "Açık adres satırı zorunludur.";
  }
  if (m.includes("the city field is required") || m.includes("city is required")) {
    return "İl alanı zorunludur.";
  }
  if (m.includes("the district field is required") || m.includes("district is required")) {
    return "İlçe alanı zorunludur.";
  }
  if (m.includes("the email field is required") || m.includes("email is required")) {
    return "E-posta adresi zorunludur.";
  }
  if (m.includes("the password field is required") || m.includes("password is required")) {
    return "Şifre alanı zorunludur.";
  }

  // 4. Kupon Hataları
  if (m.includes("coupon code is invalid") || m.includes("invalid coupon") || m.includes("coupon not found")) {
    return "Kupon kodu geçersiz veya bulunamadı.";
  }
  if (m.includes("coupon has expired") || m.includes("coupon expired")) {
    return "Bu kuponun kullanım süresi dolmuştur.";
  }
  if (m.includes("coupon is not active") || m.includes("coupon inactive")) {
    return "Bu kupon şu anda aktif değil.";
  }
  if (m.includes("coupon max usage") || m.includes("usage limit exceeded")) {
    return "Bu kuponun maksimum kullanım sınırına ulaşıldı.";
  }
  if (m.includes("coupon min order") || m.includes("minimum order amount")) {
    return "Sepet tutarınız kuponun minimum sepet tutarını karşılamıyor.";
  }
  if (m.includes("coupon already used")) {
    return "Bu kuponu daha önce kullandınız.";
  }

  // 5. Auth, Kullanıcı & Şifre Hataları
  if (m.includes("already registered") || m.includes("already taken") || m.includes("already exists") || m.includes("is already in use") || m.includes("duplicateemail")) {
    return "Bu e-posta adresi zaten kayıtlı.";
  }
  if (m.includes("incorrect password") || m.includes("invalid password") || m.includes("password is incorrect") || m.includes("wrong password")) {
    return "Şifreniz hatalı.";
  }
  if (m.includes("passwords do not match") || m.includes("password confirmation does not match")) {
    return "Girdiğiniz şifreler birbiriyle eşleşmiyor.";
  }
  if (m.includes("current password is incorrect")) {
    return "Mevcut şifrenizi hatalı girdiniz.";
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
  if (m.includes("invalid email or password") || m.includes("invalid credentials") || m.includes("username or password")) {
    return "E-posta veya şifre hatalı.";
  }
  if (m.includes("account is inactive")) {
    return "Hesabınız pasif durumda. Lütfen destek ekibiyle iletişime geçin.";
  }
  if (m.includes("account is locked")) {
    return "Çok fazla hatalı deneme nedeniyle hesabınız kilitlendi. Lütfen bir süre bekleyin.";
  }
  if (m.includes("must be at least") || m.includes("minimumlength") || m.includes("too short")) {
    if (m.includes("password") || m.includes("şifre")) {
      return "Şifreniz en az 8 karakter olmalıdır.";
    }
  }

  // 6. Ödeme & Dekont & Sipariş Hataları
  if (m.includes("order not found")) {
    return "Sipariş bulunamadı.";
  }
  if (m.includes("order already completed") || m.includes("order already paid")) {
    return "Bu siparişin ödemesi zaten tamamlanmış.";
  }
  if (m.includes("payment failed") || m.includes("payment could not be processed")) {
    return "Ödeme işlemi tamamlanamadı. Lütfen bilgilerinizi kontrol edin.";
  }
  if (m.includes("receipt already uploaded") || m.includes("receipt exists")) {
    return "Bu sipariş için zaten ödeme dekontu yüklenmiş.";
  }

  // 7. Yorum & Değerlendirme
  if (m.includes("review already submitted") || m.includes("already reviewed")) {
    return "Bu ürünü zaten daha önce değerlendirdiniz.";
  }
  if (m.includes("you must purchase this product") || m.includes("must purchase")) {
    return "Yorum yapabilmek için bu ürünü satın almış olmanız gerekmektedir.";
  }

  // 8. Sunucu & Bağlantı Hataları
  if (m.includes("failed to fetch") || m.includes("network error") || m.includes("connection refused") || m.includes("err_connection_refused")) {
    return "Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.";
  }
  if (m.includes("method not allowed") || m.includes("405")) {
    return "İşlem sunucu tarafından reddedildi (Method Not Allowed).";
  }
  if (m.includes("unauthorized") || m.includes("401")) {
    return "Bu işlem için oturum açmanız gerekmektedir.";
  }
  if (m.includes("forbidden") || m.includes("403")) {
    return "Bu işlemi yapmaya yetkiniz bulunmuyor.";
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

  if (status === 429) {
    return new ApiError({
      message: "Sunucu çok fazla istek algıladı (429 Rate Limit). Lütfen 5 saniye bekleyip tekrar deneyin.",
      code: "too_many_requests",
      status: 429,
      traceId
    });
  }

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
