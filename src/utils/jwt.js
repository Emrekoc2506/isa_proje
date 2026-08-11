export function isJwtExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return false;
    // Add 10-second safety buffer so expiring tokens are handled before failing
    return payload.exp * 1000 - 10000 < Date.now();
  } catch (e) {
    return true;
  }
}
