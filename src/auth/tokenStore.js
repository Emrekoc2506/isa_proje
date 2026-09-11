/**
 * In-Memory Token Store for Access Tokens.
 *
 * Security Guarantee:
 * Access tokens are stored exclusively in JavaScript runtime memory (closure).
 * They are NEVER written to localStorage, sessionStorage, cookies, or IndexedDB,
 * completely preventing token exfiltration via XSS attacks.
 */

let memoryAccessToken = null;

export function getAccessToken() {
  return memoryAccessToken;
}

export function setAccessToken(token) {
  memoryAccessToken = token ? String(token) : null;
}

export function clearAccessToken() {
  memoryAccessToken = null;
}
