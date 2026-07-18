export function isValidGuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value)
  );
}

export function prepareWishlistProductIds(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return [
    ...new Set(
      items
        .map(item => {
          if (!item) return null;
          if (typeof item === "string") {
            return item;
          }
          return item.databaseId ?? item.productId ?? item.id;
        })
        .filter(Boolean)
        .filter(isValidGuid)
    )
  ].slice(0, 100);
}
