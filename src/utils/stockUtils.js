/**
 * Safe stock quantity extractor for products and variants.
 * Handles all backend DTO field variations (stockQuantity, StockQuantity, stock, Stock, unitsInStock, etc.)
 * and calculates total stock from variants if main stock is undefined.
 */
export function getSafeStockQuantity(item) {
  if (!item || typeof item !== 'object') return 0;

  // 1. Direct field checks on item
  const val = item.stockQuantity ?? item.StockQuantity ?? item.stock ?? item.Stock ?? 
              item.unitsInStock ?? item.UnitsInStock ?? item.quantity ?? item.Quantity ?? 
              item.inventoryQuantity ?? item.InventoryQuantity;

  if (val !== undefined && val !== null && val !== '') {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) return Math.max(0, parsed);
  }

  // 2. Fallback to variants total if item has variants
  if (Array.isArray(item.variants) && item.variants.length > 0) {
    const totalVariantStock = item.variants.reduce((sum, v) => {
      const vVal = v.stockQuantity ?? v.StockQuantity ?? v.stock ?? v.Stock ?? 0;
      const parsedV = parseInt(vVal, 10);
      return sum + (isNaN(parsedV) ? 0 : Math.max(0, parsedV));
    }, 0);
    return totalVariantStock;
  }

  return 0;
}
