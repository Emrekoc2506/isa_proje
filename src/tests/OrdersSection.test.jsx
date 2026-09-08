import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import OrdersSection from "../pages/AdminPage/sections/OrdersSection";
import { ThemeProvider } from "../context/ThemeContext";
import * as orderApi from "../services/orderApi";
import { isProtectedOrder, DISMISSED_ORDERS_KEY } from "../utils/orderProtection";

vi.mock("../services/orderApi", () => ({
  getAdminOrders: vi.fn(),
  getAdminOrderById: vi.fn(),
  deleteAdminOrder: vi.fn()
}));

describe("isProtectedOrder rule checks", () => {
  it("protects paid and pending-verification orders from backend deletion", () => {
    expect(isProtectedOrder({ paymentStatus: "Paid" })).toBe(true);
    expect(isProtectedOrder({ paymentStatus: "paid" })).toBe(true);
    expect(isProtectedOrder({ paymentStatus: "ödendi" })).toBe(true);
    expect(isProtectedOrder({ paymentStatus: "PendingVerification" })).toBe(true);
    expect(isProtectedOrder({ paymentStatus: "kontrol bekliyor" })).toBe(true);
  });

  it("protects orders in fulfillment pipeline", () => {
    expect(isProtectedOrder({ status: "Preparing" })).toBe(true);
    expect(isProtectedOrder({ status: "Shipped" })).toBe(true);
    expect(isProtectedOrder({ status: "Delivered" })).toBe(true);
    expect(isProtectedOrder({ orderStatus: "hazırlanıyor" })).toBe(true);
    expect(isProtectedOrder({ orderStatus: "kargoya verildi" })).toBe(true);
  });

  it("allows non-protected orders to be deleted in backend", () => {
    expect(isProtectedOrder({ paymentStatus: "Pending", status: "Beklemede" })).toBe(false);
    expect(isProtectedOrder({ paymentStatus: "Unpaid", status: "New" })).toBe(false);
    expect(isProtectedOrder({ paymentStatus: "Rejected", status: "Cancelled" })).toBe(false);
    expect(isProtectedOrder({ paymentStatus: "Failed", status: "Failed" })).toBe(false);
    expect(isProtectedOrder(null)).toBe(false);
  });
});

describe("OrdersSection component", () => {
  const orderId1 = "fcec0825-5d1b-4bd2-9a7a-123456789abc";
  const orderId2 = "a1b2c3d4-e5f6-7a8b-9c0d-0987654321fe";

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    orderApi.getAdminOrders.mockResolvedValue({
      items: [
        {
          id: orderId1,
          orderNumber: "ISH-1001",
          customerName: "Test Customer",
          totalAmount: 100,
          paymentMethod: "BankTransfer",
          paymentStatus: "Pending"
        },
        {
          id: orderId2,
          orderNumber: "ISH-1002",
          customerName: "Paid Customer",
          totalAmount: 250,
          paymentMethod: "OnlineCard",
          paymentStatus: "Paid"
        }
      ],
      totalPages: 1
    });

    orderApi.getAdminOrderById.mockResolvedValue({
      id: orderId1,
      orderNumber: "ISH-1001",
      customerName: "Test Customer",
      items: []
    });

    orderApi.deleteAdminOrder.mockResolvedValue({ success: true });
  });

  it("fetches one detail request with the order list id", async () => {
    render(
      <ThemeProvider>
        <OrdersSection />
      </ThemeProvider>
    );

    const detailButtons = await screen.findAllByRole("button", { name: /Detay/i });
    fireEvent.click(detailButtons[0]);

    await waitFor(() => {
      expect(orderApi.getAdminOrderById).toHaveBeenCalledTimes(1);
    });
    expect(orderApi.getAdminOrderById).toHaveBeenCalledWith(orderId1);
    expect(await screen.findByText("Sipariş Detayı: #ISH-1001")).toBeInTheDocument();
  });

  it("deletes an unpaid order from backend and removes it from UI after confirmation", async () => {
    render(
      <ThemeProvider>
        <OrdersSection />
      </ThemeProvider>
    );

    // Wait for table to load
    expect(await screen.findByText("#ISH-1001")).toBeInTheDocument();

    // Click single delete button for ISH-1001
    const deleteButtons = screen.getAllByRole("button", { name: /Sil/i });
    fireEvent.click(deleteButtons[0]);

    // Check confirmation modal opens
    expect(await screen.findByText("Siparişi Sil")).toBeInTheDocument();
    expect(screen.getByText(/#ISH-1001 numaralı siparişi silmek istediğinize emin misiniz/i)).toBeInTheDocument();

    // Click confirm "Evet, Sil"
    const confirmBtn = screen.getByRole("button", { name: /Evet, Sil/i });
    fireEvent.click(confirmBtn);

    // Wait for backend call and UI update
    await waitFor(() => {
      expect(orderApi.deleteAdminOrder).toHaveBeenCalledWith(orderId1);
    });

    await waitFor(() => {
      expect(screen.queryByText("#ISH-1001")).not.toBeInTheDocument();
    });
  });

  it("removes a paid order from UI view without calling backend delete (protecting database record)", async () => {
    render(
      <ThemeProvider>
        <OrdersSection />
      </ThemeProvider>
    );

    expect(await screen.findByText("#ISH-1002")).toBeInTheDocument();

    // Click Sil button for ISH-1002 (second item in list)
    const deleteButtons = screen.getAllByRole("button", { name: /Sil/i });
    fireEvent.click(deleteButtons[1]);

    expect(await screen.findByText("Siparişi Sil")).toBeInTheDocument();
    expect(screen.getByText(/#ISH-1002 numaralı siparişi silmek istediğinize emin misiniz/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /Evet, Sil/i });
    fireEvent.click(confirmBtn);

    // Should NOT call backend deleteAdminOrder because order is Paid!
    await waitFor(() => {
      expect(orderApi.deleteAdminOrder).not.toHaveBeenCalledWith(orderId2);
    });

    // Should be saved to dismissed orders in localStorage
    const saved = JSON.parse(localStorage.getItem(DISMISSED_ORDERS_KEY) || "[]");
    expect(saved).toContain(orderId2);

    // Should be removed from UI view
    await waitFor(() => {
      expect(screen.queryByText("#ISH-1002")).not.toBeInTheDocument();
    });
  });

  it("supports bulk selection with dynamic count and bulk delete confirmation", async () => {
    render(
      <ThemeProvider>
        <OrdersSection />
      </ThemeProvider>
    );

    expect(await screen.findByText("#ISH-1001")).toBeInTheDocument();
    expect(screen.getByText("#ISH-1002")).toBeInTheDocument();

    // Select All using header checkbox
    const selectAllCheckbox = screen.getByLabelText("Tümünü Seç");
    fireEvent.click(selectAllCheckbox);

    // Bulk delete button should appear with count (2)
    const bulkDeleteBtn = await screen.findByRole("button", { name: /Seçilenleri Sil \(2\)/i });
    expect(bulkDeleteBtn).toBeInTheDocument();

    // Click bulk delete
    fireEvent.click(bulkDeleteBtn);

    // Confirmation modal should show count
    expect(await screen.findByText("Seçilen Siparişleri Sil")).toBeInTheDocument();
    expect(screen.getByText(/Seçtiğiniz 2 adet siparişi silmek istediğinize emin misiniz/i)).toBeInTheDocument();

    // Confirm deletion
    const confirmBtn = screen.getByRole("button", { name: /Evet, Sil/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      // Non-protected order should have backend delete called
      expect(orderApi.deleteAdminOrder).toHaveBeenCalledWith(orderId1);
      // Protected order should NOT have backend delete called
      expect(orderApi.deleteAdminOrder).not.toHaveBeenCalledWith(orderId2);
    });

    // Both should disappear from UI
    await waitFor(() => {
      expect(screen.queryByText("#ISH-1001")).not.toBeInTheDocument();
      expect(screen.queryByText("#ISH-1002")).not.toBeInTheDocument();
    });
  });
});
