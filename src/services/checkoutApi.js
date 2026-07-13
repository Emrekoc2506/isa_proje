import { request } from "./apiClient";

export function previewCheckout(payload) {
  return request("/checkout/preview", {
    method: "POST",
    body: JSON.stringify({
      shippingAddressId: payload.shippingAddressId || null,
      guestShippingAddress: payload.guestShippingAddress || null,
      billingAddressId: payload.billingAddressId || null,
      guestBillingAddress: payload.guestBillingAddress || null,
      couponCode: payload.couponCode || null,
      shippingMethodCode: payload.shippingMethodCode || "standard"
    })
  });
}
