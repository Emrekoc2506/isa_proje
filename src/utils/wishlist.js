export function isValidGuid(value) {
  if (value === null || value === undefined) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value)
  );
}

export function isValidProductId(value) {
  if (value === null || value === undefined) return false;
  const str = String(value).trim();
  if (!str) return false;
  return isValidGuid(str) || /^\d+$/.test(str);
}

export function prepareWishlistProductIds(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return [
    ...new Set(
      items
        .map(item => {
          if (item === null || item === undefined) return null;
          if (typeof item === "string" || typeof item === "number") {
            return String(item);
          }
          const idVal = item.databaseId ?? item.productId ?? item.id;
          return idVal != null ? String(idVal) : null;
        })
        .filter(Boolean)
        .filter(isValidProductId)
    )
  ].slice(0, 100);
}
