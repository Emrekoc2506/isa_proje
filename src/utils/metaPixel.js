/**
 * Meta (Facebook) Pixel Entegrasyon Yardımcısı
 *
 * Muhristan reklam ve dönüşüm takibi için standart Pixel istemcisi.
 * Reklam engelleyiciler veya ağ hataları durumunda uygulamanın çökmesini engellemek için
 * tüm çağrılar hata korumalı (try/catch ve fail-safe) olarak çalışır.
 *
 * ÖNEMLİ: Meta Access Token (EAAF...) asla bu dosyada veya frontend'de yer almaz.
 */

export const DEFAULT_PIXEL_ID = '28067782329510498';

export function getPixelId() {
  try {
    return import.meta.env?.VITE_META_PIXEL_ID || DEFAULT_PIXEL_ID;
  } catch {
    return DEFAULT_PIXEL_ID;
  }
}

let isInitialized = false;

/**
 * Meta Pixel scriptini sayfaya ekler ve verilen Pixel ID ile başlatır.
 * Sayfa ömrü boyunca yalnızca bir defa çalışır.
 */
export function initMetaPixel(customPixelId = null) {
  if (typeof window === 'undefined') return;

  const pixelId = customPixelId || getPixelId();

  try {
    if (isInitialized && window.fbq) {
      return;
    }

    /* Standart Meta Pixel taban kodu */
    if (!window.fbq) {
      const fbq = function () {
        if (fbq.callMethod) {
          fbq.callMethod.apply(fbq, arguments);
        } else {
          fbq.queue.push(arguments);
        }
      };
      if (!window._fbq) window._fbq = fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = '2.0';
      fbq.queue = [];
      window.fbq = fbq;

      // Script elementini güvenli şekilde ekle
      if (typeof document !== 'undefined') {
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://connect.facebook.net/en_US/fbevents.js';
        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(script, firstScript);
        } else if (document.head) {
          document.head.appendChild(script);
        }
      }
    }

    if (typeof window.fbq === 'function') {
      window.fbq('init', pixelId);
      isInitialized = true;
    }
  } catch (err) {
    // Tracking hatası veya reklam engelleyici uygulamayı asla durdurmamalıdır
    console.warn('Meta Pixel başlatılamadı:', err);
  }
}

/**
 * SPA rota geçişlerinde PageView event'i gönderir.
 */
export function trackPageView() {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  } catch (err) {
    // Fail-safe
  }
}

/**
 * Standart ve özel Meta Pixel event'lerini tetikler.
 * Conversions API ile tekilleştirme için options.eventID destekler.
 *
 * @param {string} eventName - Örn: 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'CompleteRegistration'
 * @param {object} [data={}] - Event parametreleri (value, currency, content_ids vb.)
 * @param {object} [options={}] - Meta event opsiyonları (örn: { eventID: 'purchase_123' })
 */
export function trackMetaEvent(eventName, data = {}, options = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      if (options && options.eventID) {
        window.fbq('track', eventName, data, { eventID: options.eventID });
      } else {
        window.fbq('track', eventName, data);
      }
    }
  } catch (err) {
    // Fail-safe
  }
}

/**
 * Test ortamında durumu sıfırlamak için yardımcı fonksiyon.
 */
export function _resetMetaPixelForTesting() {
  isInitialized = false;
  if (typeof window !== 'undefined') {
    delete window.fbq;
    delete window._fbq;
  }
}
