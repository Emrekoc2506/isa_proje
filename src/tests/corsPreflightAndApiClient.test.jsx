import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  request,
  refreshAccessToken,
  isPublicEndpoint,
  shouldSendGuestSession,
  PUBLIC_PREFIXES,
} from "../services/apiClient";
import { getGuestSessionId } from "../utils/guestSession";
import { setAccessToken, getAccessToken, clearAccessToken } from "../auth/tokenStore";

const MOCK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQWxpIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1MjQ2MDgwMDB9.123";

describe("CORS Preflight & apiClient Optimization Tests", () => {
  let fetchSpy;

  beforeEach(() => {
    localStorage.clear();
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, opts = {}) => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    localStorage.clear();
  });

  describe("PUBLIC_PREFIXES & Helper Functions", () => {
    it("includes /home/bootstrap in PUBLIC_PREFIXES", () => {
      expect(PUBLIC_PREFIXES).toContain("/home/bootstrap");
    });

    it("identifies public read-only endpoints correctly", () => {
      expect(isPublicEndpoint("/home/bootstrap", "GET")).toBe(true);
      expect(isPublicEndpoint("/products", "GET")).toBe(true);
      expect(isPublicEndpoint("/products/123", "GET")).toBe(true);
      expect(isPublicEndpoint("/categories", "GET")).toBe(true);
      expect(isPublicEndpoint("/banners", "GET")).toBe(true);
      expect(isPublicEndpoint("/blog", "GET")).toBe(true);
      expect(isPublicEndpoint("/payment-methods", "GET")).toBe(true);
      expect(isPublicEndpoint("/seo/meta", "GET")).toBe(true);

      // Cart ve admin asla public GET sayılmamalı
      expect(isPublicEndpoint("/cart", "GET")).toBe(false);
      expect(isPublicEndpoint("/admin/products", "GET")).toBe(false);
    });

    it("shouldSendGuestSession returns false for public GET endpoints", () => {
      expect(shouldSendGuestSession("/home/bootstrap", "GET")).toBe(false);
      expect(shouldSendGuestSession("/products", "GET")).toBe(false);
      expect(shouldSendGuestSession("/categories", "GET")).toBe(false);
      expect(shouldSendGuestSession("/banners", "GET")).toBe(false);
      expect(shouldSendGuestSession("/blog", "GET")).toBe(false);
      expect(shouldSendGuestSession("/payment-methods", "GET")).toBe(false);
    });

    it("shouldSendGuestSession returns true for cart, checkout and guest operations", () => {
      expect(shouldSendGuestSession("/cart", "GET")).toBe(true);
      expect(shouldSendGuestSession("/cart/items", "POST")).toBe(true);
      expect(shouldSendGuestSession("/orders/guest", "POST")).toBe(true);
      expect(shouldSendGuestSession("/checkout", "POST")).toBe(true);
      expect(shouldSendGuestSession("/wishlist", "GET")).toBe(true);
      expect(shouldSendGuestSession("/chat/conversations", "POST")).toBe(true);
    });
  });

  describe("Requirement 6: Header Verifications", () => {
    it("1. GET /home/bootstrap: Content-Type yok, guest header yok, anonim kullanıcıda Authorization yok", async () => {
      localStorage.removeItem("accessToken");
      await request("/home/bootstrap");

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [, opts] = fetchSpy.mock.calls[0];
      const headers = new Headers(opts.headers);

      expect(headers.has("content-type")).toBe(false);
      expect(headers.has("x-guest-session-id")).toBe(false);
      expect(headers.has("x-guest-sessionid")).toBe(false);
      expect(headers.has("authorization")).toBe(false);
    });

    it("2. GET /products: Content-Type yok, guest header yok, anonim kullanıcıda Authorization yok", async () => {
      localStorage.removeItem("accessToken");
      await request("/products");

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [, opts] = fetchSpy.mock.calls[0];
      const headers = new Headers(opts.headers);

      expect(headers.has("content-type")).toBe(false);
      expect(headers.has("x-guest-session-id")).toBe(false);
      expect(headers.has("x-guest-sessionid")).toBe(false);
      expect(headers.has("authorization")).toBe(false);
    });

    it("3. Diğer public GET'ler (categories, banners, blog, payment-methods): Content-Type ve guest header yok", async () => {
      await request("/categories");
      await request("/banners");
      await request("/blog");
      await request("/payment-methods");

      expect(fetchSpy).toHaveBeenCalledTimes(4);
      for (const [, opts] of fetchSpy.mock.calls) {
        const headers = new Headers(opts.headers);
        expect(headers.has("content-type")).toBe(false);
        expect(headers.has("x-guest-session-id")).toBe(false);
        expect(headers.has("x-guest-sessionid")).toBe(false);
      }
    });

    it("4. POST JSON: Content-Type application/json VAR", async () => {
      await request("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId: "p-1", quantity: 2 }),
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [, opts] = fetchSpy.mock.calls[0];
      const headers = new Headers(opts.headers);

      expect(headers.get("content-type")).toBe("application/json");
    });

    it("5. FormData: Content-Type elle set edilmez (tarayıcıya bırakılır)", async () => {
      const formData = new FormData();
      formData.append("file", new Blob(["test"], { type: "text/plain" }));

      await request("/upload-test", {
        method: "POST",
        body: formData,
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [, opts] = fetchSpy.mock.calls[0];
      const headers = new Headers(opts.headers);

      expect(headers.has("content-type")).toBe(false);
    });

    it("6. Guest cart: guest session header VAR", async () => {
      const guestId = getGuestSessionId();
      expect(guestId).toBeDefined();

      await request("/cart");

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [, opts] = fetchSpy.mock.calls[0];
      const headers = new Headers(opts.headers);

      expect(headers.get("x-guest-session-id")).toBe(guestId);
      expect(headers.get("x-guest-sessionid")).toBe(guestId);
      // GET /cart body içermediği için Content-Type olmamalı
      expect(headers.has("content-type")).toBe(false);
    });

    it("7. Authenticated request: Authorization VAR", async () => {
      setAccessToken(MOCK_TOKEN);

      await request("/account/profile");

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [, opts] = fetchSpy.mock.calls[0];
      const headers = new Headers(opts.headers);

      expect(headers.get("authorization")).toBe(`Bearer ${MOCK_TOKEN}`);
    });

    it("8. Refresh flow: 401 durumunda token yenilenir ve istek tekrar denenir", async () => {
      const NEW_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQWxpIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1MjQ2MDgwMDB9.newtoken";
      let profileAttempts = 0;

      fetchSpy.mockImplementation(async (url, opts = {}) => {
        const u = String(url);
        if (u.includes("/auth/refresh-token")) {
          return new Response(JSON.stringify({ accessToken: NEW_TOKEN }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (u.includes("/account/profile")) {
          profileAttempts++;
          const auth = new Headers(opts.headers).get("authorization");
          if (auth === `Bearer ${MOCK_TOKEN}` && profileAttempts === 1) {
            return new Response(JSON.stringify({ code: "unauthorized", message: "Token expired" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }
          return new Response(JSON.stringify({ id: "u-1", fullName: "Ali Veli", updated: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      });

      setAccessToken(MOCK_TOKEN);

      const result = await request("/account/profile");
      expect(result).toEqual({ id: "u-1", fullName: "Ali Veli", updated: true });
      expect(getAccessToken()).toBe(NEW_TOKEN);
      expect(localStorage.getItem("accessToken")).toBeNull();
    });
  });
});
