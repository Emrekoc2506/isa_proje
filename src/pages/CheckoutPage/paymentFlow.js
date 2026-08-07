export const PAYMENT_METHODS = Object.freeze({
  ONLINE_CARD: "OnlineCard",
  BANK_TRANSFER: "BankTransfer",
  CASH_ON_DELIVERY: "CashOnDelivery",
});

export function isManualPayment(method) {
  return method === PAYMENT_METHODS.BANK_TRANSFER || method === PAYMENT_METHODS.CASH_ON_DELIVERY;
}

export function shouldInitializePayment(method) {
  return method === PAYMENT_METHODS.ONLINE_CARD;
}

export function isManualOrderSuccess(order) {
  const method = String(order?.paymentMethod || "").toLowerCase();
  return String(order?.paymentStatus || "").toLowerCase() === "unpaid"
    && ["banktransfer", "cashondelivery"].includes(method);
}

export function shouldClearCart(order) {
  return String(order?.paymentStatus || "").toLowerCase() === "paid" || isManualOrderSuccess(order);
}
