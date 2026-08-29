import { describe, expect, test } from 'vitest';
import { hasExplicitStock, isOutOfStock } from '../utils/stockUtils';
import { normalizeProducts } from '../context/ProductContext';

describe('stock utilities', () => {
  test('does not treat null or missing stock as sold out', () => {
    expect(hasExplicitStock({ stockQuantity: null })).toBe(false);
    expect(isOutOfStock({ stockQuantity: null })).toBe(false);
    expect(isOutOfStock({ availableStock: null })).toBe(false);
    expect(isOutOfStock({})).toBe(false);
  });

  test('accepts numeric zero and numeric strings as explicit stock', () => {
    expect(hasExplicitStock({ availableStock: 0 })).toBe(true);
    expect(hasExplicitStock({ availableStock: '5' })).toBe(true);
    expect(hasExplicitStock({ stockQuantity: 0 })).toBe(true);
    expect(hasExplicitStock({ stockQuantity: '5' })).toBe(true);
  });

  test('only explicit zero stock is sold out', () => {
    expect(isOutOfStock({ availableStock: 0 })).toBe(true);
    expect(isOutOfStock({ stockQuantity: 0 })).toBe(true);
    expect(isOutOfStock({ stockQuantity: 50, availableStock: 50 })).toBe(false);
    expect(isOutOfStock({ stockQuantity: 50, availableStock: 47 })).toBe(false);
    expect(isOutOfStock({ stockQuantity: NaN })).toBe(false);
    expect(isOutOfStock({ stockQuantity: '' })).toBe(false);
  });

  test('preserves stock fields only when the backend sent them', () => {
    const [withStock] = normalizeProducts({
      items: [{ id: 'with-stock', stockQuantity: 50, availableStock: 47 }],
    });
    const [withoutStock] = normalizeProducts({ items: [{ id: 'without-stock' }] });

    expect(withStock.stockQuantity).toBe(50);
    expect(withStock.availableStock).toBe(47);
    expect(withoutStock).not.toHaveProperty('stockQuantity');
    expect(withoutStock).not.toHaveProperty('availableStock');
    expect(withoutStock).not.toHaveProperty('stock');
  });
});
