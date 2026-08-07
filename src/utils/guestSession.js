import { safeGetItem, safeSetItem } from "./storage";

const key = "isa_guest_session_id";

export function createSecureRandomId(prefix = "") {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) {
    return `${prefix}${cryptoApi.randomUUID()}`;
  }

  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const uuid = [...bytes].map((byte, index) => {
      const value = byte.toString(16).padStart(2, "0");
      return [4, 6, 8, 10].includes(index) ? `-${value}` : value;
    }).join("");
    return `${prefix}${uuid}`;
  }

  throw new Error("Secure random number generation is unavailable.");
}

export function getGuestSessionId() {
  let value = safeGetItem(key);

  if (!value) {
    value = createSecureRandomId();
    safeSetItem(key, value);
  }

  return value;
}
