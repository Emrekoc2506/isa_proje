import { getPushPublicKey, subscribePush, unsubscribePush } from "./accountApi";

/**
 * VAPID public key'i tarayıcının beklediği Uint8Array formatına dönüştürür.
 * @param {string} base64String
 * @returns {Uint8Array}
 */
export function urlBase64ToUint8Array(base64String) {
  if (!base64String) {
    return new Uint8Array(0);
  }
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Tarayıcının Web Push bildirimlerini destekleyip desteklemediğini kontrol eder.
 * @returns {boolean}
 */
export function isPushSupported() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Cihazın iOS Safari olup olmadığını kontrol eder.
 * @returns {boolean}
 */
export function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/**
 * Uygulamanın ana ekrana eklenmiş PWA (Standalone) olarak çalışıp çalışmadığını kontrol eder.
 * @returns {boolean}
 */
export function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator?.standalone === true
  );
}


/**
 * Mevcut bildirim izin ve abonelik durumunu döner.
 * @returns {Promise<{
 *   isSupported: boolean,
 *   permission: NotificationPermission | 'unsupported',
 *   isSubscribed: boolean,
 *   isIos: boolean,
 *   isStandalone: boolean,
 *   endpoint?: string
 * }>}
 */
export async function getPushSubscriptionStatus() {
  const isSupported = isPushSupported();
  const isIos = isIosDevice();
  const isStandalone = isStandaloneMode();

  if (!isSupported) {
    return {
      isSupported: false,
      permission: "unsupported",
      isSubscribed: false,
      isIos,
      isStandalone,
    };
  }

  const permission = Notification.permission;
  try {
    const registration = await navigator.serviceWorker.getRegistration("/push-sw.js");
    if (!registration) {
      return { isSupported, permission, isSubscribed: false, isIos, isStandalone };
    }
    const subscription = await registration.pushManager.getSubscription();
    return {
      isSupported,
      permission,
      isSubscribed: Boolean(subscription),
      isIos,
      isStandalone,
      endpoint: subscription?.endpoint,
    };
  } catch (error) {
    console.warn("Push subscription status error:", error);
    return { isSupported, permission, isSubscribed: false, isIos, isStandalone };
  }
}

/**
 * Web Push bildirimlerine abone olur ve backend'e kaydeder.
 * @param {string} [accessToken] - Opsiyonel Bearer token (verilmezse apiClient storage'dan alır)
 * @returns {Promise<{ success: boolean, permission: string, error?: string, subscription?: PushSubscription }>}
 */
export async function subscribeToPush(accessToken) {
  if (!isPushSupported()) {
    const msg = "Bu tarayıcı Web Push bildirimlerini desteklemiyor.";
    console.warn(msg);
    return { success: false, permission: "unsupported", error: msg };
  }

  try {
    // 1. İzin iste
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      const msg = permission === "denied"
        ? "Bildirim izni engellendi. Tarayıcı ayarlarından bildirimlere izin vermeniz gerekir."
        : "Bildirim izni verilmedi.";
      return { success: false, permission, error: msg };
    }

    // 2. Service Worker'ı kaydet
    const registration = await navigator.serviceWorker.register("/push-sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;

    // 3. Backend'den VAPID public key al
    const keyRes = await getPushPublicKey();
    const publicKey = keyRes?.publicKey;
    if (!publicKey) {
      throw new Error("VAPID public key backend servisinden alınamadı.");
    }

    // 4. Tarayıcı PushManager üzerinden abone ol
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const subJson = subscription.toJSON();
    if (!subJson?.endpoint || !subJson?.keys?.p256dh || !subJson?.keys?.auth) {
      throw new Error("Tarayıcı abonelik anahtarları eksik üretildi.");
    }

    // 5. Backend'e kaydet
    await subscribePush(
      {
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      },
      accessToken
    );

    return {
      success: true,
      permission,
      subscription,
    };
  } catch (error) {
    console.error("Web Push abonelik hatası:", error);
    return {
      success: false,
      permission: typeof Notification !== "undefined" ? Notification.permission : "unknown",
      error: error.message || "Bildirim aboneliği oluşturulurken bir hata oluştu.",
    };
  }
}

/**
 * Web Push bildirim aboneliğini hem tarayıcıdan hem backend'den kaldırır.
 * @param {string} [accessToken]
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function unsubscribeFromPush(accessToken) {
  if (!isPushSupported()) {
    return { success: true };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration("/push-sw.js");
    const subscription = await registration?.pushManager?.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      // Backend'den silmeyi dene
      try {
        await unsubscribePush(endpoint, accessToken);
      } catch (apiErr) {
        console.warn("Backend abonelik silme uyarısı:", apiErr);
      }
      // Tarayıcıdan aboneliği kaldır
      await subscription.unsubscribe();
    }

    return { success: true };
  } catch (error) {
    console.error("Web Push abonelik iptal hatası:", error);
    return {
      success: false,
      error: error.message || "Abonelik iptal edilirken bir hata oluştu.",
    };
  }
}
