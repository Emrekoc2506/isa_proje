import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import {
  urlBase64ToUint8Array,
  isPushSupported,
  isIosDevice,
  isStandaloneMode,
  getPushSubscriptionStatus,
  subscribeToPush,
  unsubscribeFromPush,
} from "../services/webPushService";
import * as accountApi from "../services/accountApi";
import AdminPushToggle from "../components/AdminPushToggle/AdminPushToggle";

vi.mock("../services/accountApi", () => ({
  getPushPublicKey: vi.fn(),
  subscribePush: vi.fn(),
  unsubscribePush: vi.fn(),
}));

describe("Web Push Service Unit Tests", () => {
  const originalNavigator = global.navigator;
  const originalNotification = global.Notification;
  const originalWindow = global.window;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("urlBase64ToUint8Array", () => {
    it("converts a base64 string to a Uint8Array correctly", () => {
      // "test" in base64 is "dGVzdA=="
      const result = urlBase64ToUint8Array("dGVzdA==");
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(4);
      expect(Array.from(result)).toEqual([116, 101, 115, 116]);
    });

    it("handles URL-safe base64 characters (- and _)", () => {
      const result = urlBase64ToUint8Array("-_==");
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("returns empty Uint8Array for empty input", () => {
      const result = urlBase64ToUint8Array("");
      expect(result.length).toBe(0);
    });
  });

  describe("isPushSupported", () => {
    it("returns true when serviceWorker, PushManager, and Notification exist", () => {
      const mockNav = { serviceWorker: {} };
      const mockWin = { PushManager: function () {}, Notification: {} };

      vi.stubGlobal("navigator", mockNav);
      vi.stubGlobal("window", mockWin);
      vi.stubGlobal("Notification", {});

      expect(isPushSupported()).toBe(true);
    });

    it("returns false when serviceWorker is not supported", () => {
      vi.stubGlobal("navigator", {});
      vi.stubGlobal("window", {
        PushManager: function () {},
        Notification: {},
      });

      expect(isPushSupported()).toBe(false);
    });
  });

  describe("subscribeToPush", () => {
    it("returns error if Web Push is not supported", async () => {
      vi.stubGlobal("navigator", {});
      vi.stubGlobal("window", {});

      const res = await subscribeToPush();
      expect(res.success).toBe(false);
      expect(res.permission).toBe("unsupported");
    });

    it("returns error if permission is denied", async () => {
      const mockNotification = {
        requestPermission: vi.fn().mockResolvedValue("denied"),
        permission: "denied",
      };
      vi.stubGlobal("Notification", mockNotification);
      vi.stubGlobal("navigator", { serviceWorker: {} });
      vi.stubGlobal("window", {
        PushManager: function () {},
        Notification: mockNotification,
      });

      const res = await subscribeToPush();
      expect(res.success).toBe(false);
      expect(res.permission).toBe("denied");
    });

    it("successfully registers service worker and backend subscription when permission is granted", async () => {
      const mockNotification = {
        requestPermission: vi.fn().mockResolvedValue("granted"),
        permission: "granted",
      };
      const mockSubscription = {
        endpoint: "https://push.example.com/sub/123",
        toJSON: () => ({
          endpoint: "https://push.example.com/sub/123",
          keys: {
            p256dh: "mock-p256dh-key",
            auth: "mock-auth-secret",
          },
        }),
      };
      const mockPushManager = {
        subscribe: vi.fn().mockResolvedValue(mockSubscription),
      };
      const mockRegistration = {
        pushManager: mockPushManager,
      };
      const mockServiceWorker = {
        register: vi.fn().mockResolvedValue(mockRegistration),
        ready: Promise.resolve(mockRegistration),
        getRegistration: vi.fn().mockResolvedValue(mockRegistration),
      };

      vi.stubGlobal("Notification", mockNotification);
      vi.stubGlobal("navigator", {
        serviceWorker: mockServiceWorker,
        userAgent: "VitestBrowser/1.0",
      });
      vi.stubGlobal("window", {
        PushManager: function () {},
        Notification: mockNotification,
        atob: (str) => Buffer.from(str, "base64").toString("binary"),
      });

      accountApi.getPushPublicKey.mockResolvedValue({
        publicKey:
          "BPzXj2Q9B1ItZLCHxtrq7ukrey5ogyStwczakJsja9mmLJJSmhH3ppMIJaW9t1TmtdiFrfZFUJNTMLTUxGPnZ3E",
      });
      accountApi.subscribePush.mockResolvedValue({ success: true });

      const res = await subscribeToPush("test-access-token");
      expect(res.success).toBe(true);
      expect(res.permission).toBe("granted");
      expect(accountApi.getPushPublicKey).toHaveBeenCalled();
      expect(accountApi.subscribePush).toHaveBeenCalledWith(
        {
          endpoint: "https://push.example.com/sub/123",
          p256dh: "mock-p256dh-key",
          auth: "mock-auth-secret",
          userAgent: "VitestBrowser/1.0",
        },
        "test-access-token",
      );
    });
  });

  describe("unsubscribeFromPush", () => {
    it("unsubscribes from pushManager and backend", async () => {
      const mockUnsubscribe = vi.fn().mockResolvedValue(true);
      const mockSubscription = {
        endpoint: "https://push.example.com/sub/123",
        unsubscribe: mockUnsubscribe,
      };
      const mockRegistration = {
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue(mockSubscription),
        },
      };

      vi.stubGlobal("Notification", { permission: "granted" });
      vi.stubGlobal("navigator", {
        serviceWorker: {
          getRegistration: vi.fn().mockResolvedValue(mockRegistration),
        },
      });
      vi.stubGlobal("window", {
        PushManager: function () {},
        Notification: {},
      });

      accountApi.unsubscribePush.mockResolvedValue({ success: true });

      const res = await unsubscribeFromPush("test-token");
      expect(res.success).toBe(true);
      expect(accountApi.unsubscribePush).toHaveBeenCalledWith(
        "https://push.example.com/sub/123",
        "test-token",
      );
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});

describe("AdminPushToggle Component UI Tests", () => {
  it("renders the notification toggle button", async () => {
    await act(async () => {
      render(<AdminPushToggle />);
    });
    const btn = screen.getByRole("button", { name: /Sipariş Bildirim/i });
    expect(btn).toBeInTheDocument();
  });
});

