/**
 * Google Analytics 4 (GA4) / gtag.js Yardımcısı
 *
 * Muhristan analytics ve dönüşüm takibi için standart GA4 istemcisi.
 * Reklam engelleyiciler veya ağ hataları durumunda uygulamanın çökmesini engellemek için
 * tüm çağrılar fail-safe (güvenli) olarak çalışır.
 */

export const GA_MEASUREMENT_ID = 'G-VH9GF926SN';

/**
 * Güvenli gtag event gönderici
 * @param {string} eventName - Örn: 'page_view', 'purchase', 'add_to_cart', 'login'
 * @param {Record<string, any>} [params] - İsteğe bağlı ek parametreler
 */
export function trackGoogleEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: eventName,
        ...params,
      });
    }
  } catch (err) {
    // Analytics hataları kullanıcı deneyimini asla etkilememelidir
    console.debug?.('Google Analytics track error:', err);
  }
}

/**
 * Sayfa görüntüleme takibi (SPA route geçişleri için)
 * @param {string} pagePath - Örn: '/urun/gumus-kolye'
 * @param {string} [pageTitle] - Örn: 'Gümüş Kolye | Muhristan'
 */
export function trackPageView(pagePath, pageTitle) {
  trackGoogleEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle || (typeof document !== 'undefined' ? document.title : ''),
    send_to: GA_MEASUREMENT_ID,
  });
}
