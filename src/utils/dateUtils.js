/**
 * Güvenli Türkçe Tarih ve Saat Formatlayıcıları
 * Hiçbir geçersiz girdi (null, undefined, invalid date string vb.) durumunda çökmez.
 */

/**
 * Türkçe tarih formatlama (Örn: "29 Ağustos 2026")
 * @param {Date|string|number|null|undefined} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export const formatTurkishDate = (value, options = {}) => {
  if (!value) return '-';

  try {
    const date = typeof value === 'object' && value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    const defaultOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      ...options
    };

    return new Intl.DateTimeFormat('tr-TR', defaultOptions).format(date);
  } catch (err) {
    console.error('Tarih formatlama hatası:', err);
    return '-';
  }
};

/**
 * Türkçe tarih ve saat formatlama (Örn: "29 Ağustos 2026 14:30")
 * @param {Date|string|number|null|undefined} value
 * @returns {string}
 */
export const formatTurkishDateTime = (value) => {
  if (!value) return '-';

  try {
    const date = typeof value === 'object' && value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    const datePart = new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);

    const timePart = new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);

    return `${datePart} ${timePart}`;
  } catch (err) {
    console.error('Tarih saat formatlama hatası:', err);
    return '-';
  }
};

/**
 * Kısa Türkçe tarih formatlama (Örn: "29.08.2026")
 * @param {Date|string|number|null|undefined} value
 * @returns {string}
 */
export const formatShortTurkishDate = (value) => {
  if (!value) return '-';

  try {
    const date = typeof value === 'object' && value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (err) {
    console.error('Kısa tarih formatlama hatası:', err);
    return '-';
  }
};
