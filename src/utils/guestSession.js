import { safeGetItem, safeSetItem } from "./storage";

const key = "isa_guest_session_id";

export function createSecureRandomId(prefix = '') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}${crypto.randomUUID()}`;
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10xx
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${prefix}${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  throw new Error('Secure random number generation is unavailable.');
}

export function generateSecureUUID() {
  return createSecureRandomId();
}

export function getGuestSessionId() {
  let value = safeGetItem(key);

  if (!value) {
    value = generateSecureUUID();
    safeSetItem(key, value);
  }

  return value;
}
