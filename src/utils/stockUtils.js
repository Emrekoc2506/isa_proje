/**
 * Safe stock quantity extractor for products and variants.
 * Prioritizes availableStock (satılabilir stok) over physical stock.
 * Handles all backend DTO field variations and calculates total stock from variants if needed.
 */
export function getSafeStockQuantity(item) {
  if (!item || typeof item !== 'object') return 0;

  // 1. Available stock has top priority (satılabilir stok = physical stock - active reservations)
  const available = item.availableStock ?? item.AvailableStock;
  if (available !== undefined && available !== null && available !== '') {
    const parsedAv = parseInt(available, 10);
    if (!isNaN(parsedAv)) return Math.max(0, parsedAv);
  }

  // 2. Direct physical stock field checks on item
  const val = item.stockQuantity ?? item.StockQuantity ?? item.stock ?? item.Stock ?? 
              item.unitsInStock ?? item.UnitsInStock ?? item.quantity ?? item.Quantity ?? 
              item.inventoryQuantity ?? item.InventoryQuantity;

  if (val !== undefined && val !== null && val !== '') {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) return Math.max(0, parsed);
  }

  // 3. Fallback to variants total if item has variants
  if (Array.isArray(item.variants) && item.variants.length > 0) {
    const totalVariantStock = item.variants.reduce((sum, v) => {
      const vAv = v.availableStock ?? v.AvailableStock;
      if (vAv !== undefined && vAv !== null && vAv !== '') {
        const parsedVAv = parseInt(vAv, 10);
        if (!isNaN(parsedVAv)) return sum + Math.max(0, parsedVAv);
      }
      const vVal = v.stockQuantity ?? v.StockQuantity ?? v.stock ?? v.Stock ?? 0;
      const parsedV = parseInt(vVal, 10);
      return sum + (isNaN(parsedV) ? 0 : Math.max(0, parsedV));
    }, 0);
    return totalVariantStock;
  }

  return 0;
}
