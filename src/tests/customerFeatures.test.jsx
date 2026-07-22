import { describe, test, expect, beforeAll, afterEach, afterAll } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

import { getReviewsByProduct, addReview } from "../services/reviewApi";
import { getRecentlyViewed, addRecentlyViewed, clearRecentlyViewed } from "../utils/recentlyViewed";
import ProductReviews from "../components/ProductReviews/ProductReviews";
import StockNotifyModal from "../components/StockNotifyModal/StockNotifyModal";
import { AuthProvider } from "../context/AuthContext";

const server = setupServer(
  http.get("*/api/products/p-test-1/reviews", () => {
    return HttpResponse.json([
      {
        id: "rev-100",
        productId: "p-test-1",
        userName: "Ahmet T.",
        rating: 5,
        isVerified: true,
        title: "Süper Kalite",
        comment: "Çok memnun kaldım, kargo hızlıydı.",
        createdAt: "2026-07-20T12:00:00Z"
      }
    ]);
  }),
  http.post("*/api/products/p-test-1/reviews", async ({ request: req }) => {
    const body = await req.json().catch(() => ({}));
    return HttpResponse.json({
      id: "rev-new",
      productId: "p-test-1",
      userName: body.userName || "Test User",
      rating: body.rating || 5,
      isVerified: true,
      title: body.title || "",
      comment: body.comment || "",
      createdAt: new Date().toISOString()
    });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

describe("Recently Viewed Products Utility Tests", () => {
  test("should add and retrieve viewed products cleanly", () => {
    clearRecentlyViewed();
    expect(getRecentlyViewed()).toEqual([]);

    const mockProduct1 = { id: "prod-1", name: "Gümüş Yüzük", price: 350 };
    const mockProduct2 = { id: "prod-2", name: "Altın Kolye", price: 1200 };

    addRecentlyViewed(mockProduct1);
    addRecentlyViewed(mockProduct2);

    const list = getRecentlyViewed();
    expect(list.length).toBe(2);
    expect(list[0].id).toBe("prod-2"); // Most recent at top
    expect(list[1].id).toBe("prod-1");
  });

  test("should deduplicate items and place most recent at top", () => {
    clearRecentlyViewed();
    const mockProduct1 = { id: "prod-1", name: "Gümüş Yüzük", price: 350 };
    const mockProduct2 = { id: "prod-2", name: "Altın Kolye", price: 1200 };

    addRecentlyViewed(mockProduct1);
    addRecentlyViewed(mockProduct2);
    addRecentlyViewed(mockProduct1); // View prod-1 again

    const list = getRecentlyViewed();
    expect(list.length).toBe(2);
    expect(list[0].id).toBe("prod-1");
  });
});

describe("Review API Tests", () => {
  test("should fetch reviews for a product", async () => {
    const reviews = await getReviewsByProduct("p-test-1");
    expect(Array.isArray(reviews)).toBe(true);
    expect(reviews.length).toBeGreaterThan(0);
  });

  test("should add a new review", async () => {
    const newRev = await addReview("p-test-1", {
      rating: 5,
      title: "Harika",
      comment: "Çok güzel ürün",
      userName: "Deneme"
    });

    expect(newRev).toBeDefined();
    expect(newRev.comment).toBe("Çok güzel ürün");
  });
});

describe("ProductReviews Component Tests", () => {
  test("should render product reviews heading and rating summary", async () => {
    render(
      <AuthProvider>
        <ProductReviews productId="p-test-1" />
      </AuthProvider>
    );

    await act(async () => {
      await new Promise(r => setTimeout(r, 100));
    });

    expect(screen.getByText(/Müşteri Değerlendirmeleri/i)).toBeInTheDocument();
  });
});

describe("StockNotifyModal Component Tests", () => {
  test("should render stock notification modal when open", () => {
    const mockProduct = { id: "prod-out", name: "Tükenmiş Çelik Bileklik" };
    render(
      <AuthProvider>
        <StockNotifyModal isOpen={true} onClose={() => {}} product={mockProduct} />
      </AuthProvider>
    );

    expect(screen.getByText(/Stoka Gelince Bildir/i)).toBeInTheDocument();
    expect(screen.getByText(/Tükenmiş Çelik Bileklik/i)).toBeInTheDocument();
  });
});
