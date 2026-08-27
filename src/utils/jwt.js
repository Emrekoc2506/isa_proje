export function getJwtPayload(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function isJwtExpired(token) {
  if (!token) return true;
  const payload = getJwtPayload(token);
  if (!payload || !payload.exp) return true;
  // Add 10-second safety buffer so expiring tokens are handled before failing
  return payload.exp * 1000 - 10000 < Date.now();
}

export function getJwtRemainingTimeMs(token) {
  const payload = getJwtPayload(token);
  if (!payload || !payload.exp) return 0;
  const expMs = payload.exp > 100000000000 ? payload.exp : payload.exp * 1000;
  return Math.max(0, expMs - Date.now());
}
