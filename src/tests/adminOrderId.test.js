import { afterEach, describe, expect, it, vi } from "vitest";
import * as orderApi from "../services/orderApi";
import * as bankTransferApi from "../services/bankTransferApi";

const VALID_ORDER_ID = "fcec0825-5d1b-4bd2-9a7a-123456789abc";

describe("admin order ID guards", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests admin order details with the canonical backend id", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: VALID_ORDER_ID }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    await orderApi.getAdminOrderById(VALID_ORDER_ID);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toContain(
      `/api/admin/orders/${VALID_ORDER_ID}`
    );
    expect(fetchSpy.mock.calls[0][0]).not.toContain("undefined");
  });

  it.each([undefined, null, "", "   ", "[object Object]"])(
    "does not request details for invalid order id %s",
    async (invalidOrderId) => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      await expect(orderApi.getAdminOrderById(invalidOrderId)).rejects.toThrow(
        "Geçersiz sipariş ID'si."
      );

      expect(fetchSpy).not.toHaveBeenCalled();
    }
  );

  it("does not send bank-transfer requests with an invalid order id", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(
      bankTransferApi.adminConfirmBankTransfer("[object Object]")
    ).rejects.toThrow("Geçersiz sipariş ID'si.");
    await expect(
      bankTransferApi.adminRejectBankTransfer(undefined)
    ).rejects.toThrow("Geçersiz sipariş ID'si.");
    await expect(
      bankTransferApi.getAdminBankTransferReceipt("")
    ).rejects.toThrow("Geçersiz sipariş ID'si.");

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
