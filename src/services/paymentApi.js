import { request } from "./apiClient";

export function initializePayment(payload) {
  const headers = {};
  if (payload.idempotencyKey) {
    headers["X-Idempotency-Key"] = payload.idempotencyKey;
  }

  return request("/payments/init", {
    method: "POST",
    headers,
    body: JSON.stringify({
      orderId: payload.orderId,
      provider: payload.provider || "iyzico",
      returnUrl: payload.returnUrl,
      idempotencyKey: payload.idempotencyKey || null
    })
  });
}
