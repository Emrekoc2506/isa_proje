const ORDER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeOrderId(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return ORDER_ID_PATTERN.test(normalized) ? normalized : null;
}

export function invalidOrderIdError() {
  return new TypeError("Geçersiz sipariş ID'si.");
}
