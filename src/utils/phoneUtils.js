/**
 * Türkiye Telefon Numarası Formatlama ve Doğrulama Yardımcıları
 */

/**
 * Kullanıcı girdisini 5XX XXX XX XX formatına dönüştürür.
 * @param {string} val 
 * @returns {string}
 */
export function formatTurkishPhone(val) {
  if (!val) return '';
  let digits = String(val).replace(/\D/g, '');
  
  // Ülke kodu +90 ile başlarsa kaldır
  if (digits.startsWith('90') && digits.length > 10) {
    digits = digits.substring(2);
  }
  // Baştaki 0'ı kaldır
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  
  digits = digits.substring(0, 10);
  
  let res = '';
  if (digits.length > 0) res += digits.substring(0, 3);
  if (digits.length > 3) res += ' ' + digits.substring(3, 6);
  if (digits.length > 6) res += ' ' + digits.substring(6, 8);
  if (digits.length > 8) res += ' ' + digits.substring(8, 10);
  return res;
}

/**
 * Telefon numarasını temizler (sadece rakamlar, 10 hane veya +90 prefix ile).
 * @param {string} val 
 * @param {Object} options 
 * @param {boolean} options.withCountryCode - true ise +905XXXXXXXXX, false ise 5XXXXXXXXX döner.
 * @returns {string}
 */
export function normalizeTurkishPhone(val, { withCountryCode = false } = {}) {
  if (!val) return '';
  let digits = String(val).replace(/\D/g, '');
  
  if (digits.startsWith('90') && digits.length > 10) {
    digits = digits.substring(2);
  }
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  
  digits = digits.substring(0, 10);
  if (!digits) return '';

  return withCountryCode ? `+90${digits}` : digits;
}

/**
 * Türkiye mobil numarasının geçerli olup olmadığını kontrol eder (10 hane ve 5 ile başlamalı).
 * @param {string} val 
 * @returns {boolean}
 */
export function isValidTurkishMobile(val) {
  if (!val) return false;
  const digits = normalizeTurkishPhone(val, { withCountryCode: false });
  return digits.length === 10 && digits.startsWith('5');
}
