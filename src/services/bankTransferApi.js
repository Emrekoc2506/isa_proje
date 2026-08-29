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
 * Müşteri Dekont Yükleme
 * POST /api/orders/{id}/bank-transfer/receipt
 * @param {string} orderId 
 * @param {FormData|{ file: File, senderName?: string, transferDate?: string }} payload 
 */
export function uploadBankTransferReceipt(orderId, payload) {
  let body;
  if (payload instanceof FormData) {
    body = payload;
  } else {
    body = new FormData();
    if (payload.file) body.append("file", payload.file);
    if (payload.senderName) body.append("senderName", payload.senderName);
    if (payload.transferDate) body.append("transferDate", payload.transferDate);
  }

  return request(`/orders/${orderId}/bank-transfer/receipt`, {
    method: "POST",
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
