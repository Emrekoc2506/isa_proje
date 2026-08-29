import { request } from "./apiClient";

/**
 * Banka Havalesi / EFT Bilgilerini Getirir
 * GET /api/payment-methods/bank-transfer
 * @returns {Promise<{ enabled: boolean, bankName: string, accountHolder: string, iban: string, currency: string, transferDescription?: string }>}
 */
export function getBankTransferInfo() {
  return request("/payment-methods/bank-transfer");
}

/**
 * Müşteri Dekont Yükleme (Kayıtlı veya Misafir Kullanıcı)
 * POST /api/orders/{id}/bank-transfer/receipt
 * @param {string} orderId 
 * @param {FormData|{ file: File, senderName?: string, transferDate?: string }} payload 
 * @param {string|null} [guestToken]
 */
export function uploadBankTransferReceipt(orderId, payload, guestToken = null) {
  let body;
  if (payload instanceof FormData) {
    body = payload;
  } else {
    body = new FormData();
    if (payload.file) body.append("file", payload.file);
    if (payload.senderName) body.append("senderName", payload.senderName);
    if (payload.transferDate) body.append("transferDate", payload.transferDate);
  }

  const token =
    guestToken ||
    (typeof window !== "undefined"
      ? sessionStorage.getItem("guestOrderAccessToken")
      : null);

  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["X-Guest-Access-Token"] = token;
    headers["X-Guest-Token"] = token;
  }

  const query = token ? `?token=${encodeURIComponent(token)}` : "";

  return request(`/orders/${orderId}/bank-transfer/receipt${query}`, {
    method: "POST",
    headers,
    body
  });
}

/**
 * Müşteri Kendi Dekontunu Görüntüleme / İndirme Bilgisi
 * GET /api/orders/{id}/bank-transfer/receipt
 */
export function getBankTransferReceipt(orderId) {
  return request(`/orders/${orderId}/bank-transfer/receipt`);
}

/**
 * Admin: Havale Ödemesini Onayla ("Ödeme Alındı")
 * POST /api/admin/orders/{id}/bank-transfer/confirm
 */
export function adminConfirmBankTransfer(orderId, payload = {}) {
  const bodyData = payload && Object.keys(payload).length > 0 ? payload : { isConfirmed: true, note: "Onaylandı" };
  return request(`/admin/orders/${orderId}/bank-transfer/confirm`, {
    method: "POST",
    body: JSON.stringify(bodyData)
  });
}

/**
 * Admin: Havale Ödeme Bildirimini Reddet
 * POST /api/admin/orders/{id}/bank-transfer/reject
 * @param {string} orderId 
 * @param {string} reason 
 */
export function adminRejectBankTransfer(orderId, reason = "") {
  return request(`/admin/orders/${orderId}/bank-transfer/reject`, {
    method: "POST",
    body: JSON.stringify({ reason })
  });
}

/**
 * Admin: Dekont Bilgisini Görüntüleme
 * GET /api/admin/orders/{id}/bank-transfer/receipt
 */
export function getAdminBankTransferReceipt(orderId) {
  return request(`/admin/orders/${orderId}/bank-transfer/receipt`);
}
