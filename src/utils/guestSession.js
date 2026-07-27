import { safeGetItem, safeSetItem } from "./storage";

const key = "isa_guest_session_id";

export function getGuestSessionId() {
  let value = safeGetItem(key);

  if (!value) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      value = crypto.randomUUID();
    } else {
      value = 'guest-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
    }
    safeSetItem(key, value);
  }

  return value;
}
