import {
  isManualOrderSuccess,
  isManualPayment,
  shouldClearCart,
  shouldInitializePayment,
  PAYMENT_METHODS,
} from "../pages/CheckoutPage/paymentFlow";

describe("checkout payment flow", () => {
  test("manual methods never initialize online payment", () => {
    expect(isManualPayment(PAYMENT_METHODS.BANK_TRANSFER)).toBe(true);
    expect(isManualPayment(PAYMENT_METHODS.CASH_ON_DELIVERY)).toBe(true);
    expect(shouldInitializePayment(PAYMENT_METHODS.BANK_TRANSFER)).toBe(false);
    expect(shouldInitializePayment(PAYMENT_METHODS.CASH_ON_DELIVERY)).toBe(false);
    expect(shouldInitializePayment(PAYMENT_METHODS.ONLINE_CARD)).toBe(true);
  });

  test("manual unpaid orders are successful checkout results", () => {
    expect(isManualOrderSuccess({ paymentMethod: "BankTransfer", paymentStatus: "Unpaid" })).toBe(true);
    expect(isManualOrderSuccess({ paymentMethod: "CashOnDelivery", paymentStatus: "Unpaid" })).toBe(true);
    expect(isManualOrderSuccess({ paymentMethod: "OnlineCard", paymentStatus: "Unpaid" })).toBe(false);
    expect(shouldClearCart({ paymentMethod: "BankTransfer", paymentStatus: "Unpaid" })).toBe(true);
    expect(shouldClearCart({ paymentMethod: "OnlineCard", paymentStatus: "Failed" })).toBe(false);
    expect(shouldClearCart({ paymentMethod: "OnlineCard", paymentStatus: "Paid" })).toBe(true);
  });
});
