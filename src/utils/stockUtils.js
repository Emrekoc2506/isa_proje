/**
 * Safe stock quantity extractor for products and variants.
 * Prioritizes availableStock (satılabilir stok) over physical stock.
 * Handles all backend DTO field variations and calculates total stock from variants if needed.
 */
export function getSafeStockQuantity(item) {
  if (!item || typeof item !== 'object') return 0;

  const available = item.availableStock ?? item.AvailableStock;
  if (available !== undefined && available !== null && available !== '') {
    const parsedAv = parseInt(available, 10);
    if (!isNaN(parsedAv)) return Math.max(0, parsedAv);
  }

  const val = item.stockQuantity ?? item.StockQuantity ?? item.stock ?? item.Stock ??
              item.unitsInStock ?? item.UnitsInStock ?? item.quantity ?? item.Quantity ??
              item.inventoryQuantity ?? item.InventoryQuantity;

  if (val !== undefined && val !== null && val !== '') {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) return Math.max(0, parsed);
  }

  if (Array.isArray(item.variants) && item.variants.length > 0) {
    return item.variants.reduce((sum, variant) => {
      const variantAvailable = variant.availableStock ?? variant.AvailableStock;
      if (variantAvailable !== undefined && variantAvailable !== null && variantAvailable !== '') {
        const parsedAvailable = parseInt(variantAvailable, 10);
        if (!isNaN(parsedAvailable)) return sum + Math.max(0, parsedAvailable);
      }

      const variantValue = variant.stockQuantity ?? variant.StockQuantity ?? variant.stock ?? variant.Stock ?? 0;
      const parsedVariant = parseInt(variantValue, 10);
      return sum + (isNaN(parsedVariant) ? 0 : Math.max(0, parsedVariant));
    }, 0);
  }

  return 0;
}

const STOCK_FIELDS = [
  ['availableStock', 'AvailableStock'],
  ['stockQuantity', 'StockQuantity'],
  ['stock', 'Stock'],
  ['unitsInStock', 'UnitsInStock'],
  ['quantity', 'Quantity'],
  ['inventoryQuantity', 'InventoryQuantity'],
];

function getField(item, camelCaseName, pascalCaseName) {
  if (Object.prototype.hasOwnProperty.call(item ?? {}, camelCaseName)) {
    return item[camelCaseName];
  }

  if (Object.prototype.hasOwnProperty.call(item ?? {}, pascalCaseName)) {
    return item[pascalCaseName];
  }

  return undefined;
}

function toExplicitStock(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string' && value.trim() === '') return null;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function getDirectExplicitStock(item) {
  for (const [camelCaseName, pascalCaseName] of STOCK_FIELDS) {
    const value = toExplicitStock(getField(item, camelCaseName, pascalCaseName));
    if (value !== null) return value;
  }

  return null;
}

function getStockItem(item) {
  return item?.selectedVariant || item?.variant || item;
}

export function getExplicitStock(item) {
  const stockItem = getStockItem(item);
  const directStock = getDirectExplicitStock(stockItem);
  if (directStock !== null) return directStock;

  if (stockItem !== item) return null;

  if (Array.isArray(item?.variants)) {
    const variantStocks = item.variants
      .map(getDirectExplicitStock)
      .filter(stock => stock !== null);
    if (variantStocks.length > 0) {
      return variantStocks.reduce((sum, stock) => sum + stock, 0);
    }
  }

  return null;
}

export function hasExplicitStock(item) {
  return getExplicitStock(item) !== null;
}

export function getKnownStockQuantity(item) {
  const stock = getExplicitStock(item);
  return stock === null ? null : Math.max(0, Math.trunc(stock));
}

export function isOutOfStock(item) {
  if (item?.isOutOfStock === true || item?.IsOutOfStock === true) return true;

  const stock = getExplicitStock(item);
  return stock !== null && stock === 0;
}
