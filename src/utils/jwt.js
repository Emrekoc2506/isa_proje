export function getJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    let jsonStr;
    try {
      const binary = atob(base64);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      jsonStr = new TextDecoder().decode(bytes);
    } catch {
      jsonStr = atob(base64);
    }
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export function isJwtExpired(token) {
  if (!token || typeof token !== 'string') return true;
  const payload = getJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  const expMs = payload.exp > 100000000000 ? payload.exp : payload.exp * 1000;
  // Add 10-second safety buffer so expiring tokens are handled before failing
  return expMs - 10000 < Date.now();
}

export function getJwtRemainingTimeMs(token) {
  if (!token || typeof token !== 'string') return 0;
  const payload = getJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return 0;
  const expMs = payload.exp > 100000000000 ? payload.exp : payload.exp * 1000;
  return Math.max(0, expMs - Date.now());
}
