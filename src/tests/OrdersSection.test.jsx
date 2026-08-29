import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import OrdersSection from "../pages/AdminPage/sections/OrdersSection";
import { ThemeProvider } from "../context/ThemeContext";
import * as orderApi from "../services/orderApi";

vi.mock("../services/orderApi", () => ({
  getAdminOrders: vi.fn(),
  getAdminOrderById: vi.fn()
}));

describe("OrdersSection order detail mapping", () => {
  const orderId = "fcec0825-5d1b-4bd2-9a7a-123456789abc";

  beforeEach(() => {
    vi.clearAllMocks();
    orderApi.getAdminOrders.mockResolvedValue({
      items: [
        {
          id: orderId,
          orderNumber: "ISH-1001",
          customerName: "Test Customer",
          totalAmount: 100,
          paymentMethod: "BankTransfer",
          paymentStatus: "Pending"
        }
      ],
      totalPages: 1
    });
    orderApi.getAdminOrderById.mockResolvedValue({
      id: orderId,
      orderNumber: "ISH-1001",
      customerName: "Test Customer",
      items: []
    });
  });

  it("fetches one detail request with the order list id", async () => {
    render(
      <ThemeProvider>
        <OrdersSection />
      </ThemeProvider>
    );

    const detailButton = await screen.findByRole("button", { name: /Detay/i });
    fireEvent.click(detailButton);

    await waitFor(() => {
      expect(orderApi.getAdminOrderById).toHaveBeenCalledTimes(1);
    });
    expect(orderApi.getAdminOrderById).toHaveBeenCalledWith(orderId);
    expect(orderApi.getAdminOrderById).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("undefined")
    );
    expect(await screen.findByText("Sipariş Detayı: #ISH-1001")).toBeInTheDocument();
  });
});
