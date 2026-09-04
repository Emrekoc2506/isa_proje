import { request } from './apiClient';

/**
 * Müşteri hesabı üzerinden güvenlik engeli (ban) uygular.
 * @param {string|number} customerId 
 * @param {Object} payload 
 * @param {string} payload.reason - Engelleme gerekçesi
 * @param {boolean} payload.banAccount - Hesabı engelle
 * @param {boolean} payload.banPhone - Telefonu engelle
 * @param {boolean} payload.banDevices - Bilinen cihazları engelle
 * @param {boolean} payload.banIp - IP adresini geçici engelle
 * @param {number} [payload.ipBanHours=72] - IP engelleme süresi (saat)
 * @returns {Promise<any>}
 */
export function banCustomer(customerId, payload) {
  return request(`/admin/customers/${encodeURIComponent(customerId)}/ban`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Sipariş kaynağı (müşteri/misafir, telefon, cihaz, IP) üzerinden güvenlik engeli uygular.
 * @param {string|number} orderId 
 * @param {Object} payload 
 * @param {string} payload.reason 
 * @param {boolean} payload.banAccount 
 * @param {boolean} payload.banPhone 
 * @param {boolean} payload.banDevices 
 * @param {boolean} payload.banIp 
 * @param {number} [payload.ipBanHours=72] 
 * @returns {Promise<any>}
 */
export function banOrderSource(orderId, payload) {
  return request(`/admin/orders/${encodeURIComponent(orderId)}/ban-source`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Uygulanan anti-abuse ban kayıtlarını listeler.
 * @param {Object} [params={}] 
 * @param {string} [params.type] - Ban türü (Account, Phone, Device, Ip)
 * @param {boolean} [params.activeOnly] - Sadece aktif olanlar
 * @param {string} [params.userId] - Belirli bir kullanıcı ID
 * @param {number} [params.page] 
 * @param {number} [params.pageSize] 
 * @returns {Promise<any>}
 */
export function getAbuseBans(params = {}) {
  const query = new URLSearchParams();
  if (params.type && params.type !== 'ALL') query.append('type', params.type);
  if (params.activeOnly !== undefined && params.activeOnly !== null && params.activeOnly !== '') {
    query.append('activeOnly', String(params.activeOnly));
  }
  if (params.userId) query.append('userId', params.userId);
  if (params.page) query.append('page', String(params.page));
  if (params.pageSize) query.append('pageSize', String(params.pageSize));

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return request(`/admin/abuse/bans${queryString}`);
}

/**
 * Aktif bir güvenlik engelini kaldırır (revoke).
 * @param {string|number} banId 
 * @returns {Promise<any>}
 */
export function revokeAbuseBan(banId) {
  return request(`/admin/abuse/bans/${encodeURIComponent(banId)}/revoke`, {
    method: 'POST'
  });
}
