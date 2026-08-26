import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import {
  ProductProvider,
  useProducts,
  isTransientError,
  fetchProductsWithRetry
} from '../context/ProductContext';
import * as productApi from '../services/productApi';
import * as categoryApi from '../services/categoryApi';
import * as bannerApi from '../services/bannerApi';

vi.mock('../services/productApi');
vi.mock('../services/categoryApi');
vi.mock('../services/bannerApi');

function TestConsumer() {
  const { products, categories, loading, error, retry } = useProducts();
  return (
    <div>
      <div data-testid="loading-status">{loading ? 'loading' : 'idle'}</div>
      <div data-testid="error-status">{error || 'none'}</div>
      <div data-testid="product-count">{products.length}</div>
      <div data-testid="category-count">{categories.length}</div>
      <button data-testid="retry-btn" onClick={() => retry()}>
        Tekrar Dene
      </button>
      <ul data-testid="product-list">
        {products.map((p) => (
          <li key={p.id} data-testid={`prod-${p.id}`}>
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

describe('Product Retry & Hardening Requirements (Section 16 Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    bannerApi.getBanners.mockResolvedValue([]);
    categoryApi.getCategoryTree.mockResolvedValue([]);
    categoryApi.getCategories.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('isTransientError correct classifications', () => {
    expect(isTransientError({ status: 400 })).toBe(false);
    expect(isTransientError({ status: 401 })).toBe(false);
    expect(isTransientError({ status: 403 })).toBe(false);
    expect(isTransientError({ status: 404 })).toBe(false);
    expect(isTransientError({ status: 422 })).toBe(false);

    expect(isTransientError({ status: 500 })).toBe(true);
    expect(isTransientError({ status: 502 })).toBe(true);
    expect(isTransientError({ status: 503 })).toBe(true);
    expect(isTransientError({ status: 504 })).toBe(true);
    expect(isTransientError({ code: 'network_error' })).toBe(true);
    expect(isTransientError({ name: 'AbortError' })).toBe(true);
  });

  it('Test 1 — İlk request fail (network error -> retry -> success)', async () => {
    const sampleProducts = [{ id: 'p1', name: 'Kolye' }];
    productApi.getProducts
      .mockRejectedValueOnce({ code: 'network_error', message: 'Network failed' })
      .mockResolvedValueOnce(sampleProducts);

    render(
      <ProductProvider>
        <TestConsumer />
      </ProductProvider>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    await waitFor(() => {
      expect(screen.getByTestId('product-count').textContent).toBe('1');
    });

    expect(productApi.getProducts).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('error-status').textContent).toBe('none');
  });

  it('Test 2 — 503 (Request 1 -> 503, Request 2 -> success)', async () => {
    const sampleProducts = [{ id: 'p1', name: 'Yüzük' }];
    productApi.getProducts
      .mockRejectedValueOnce({ status: 503, message: 'Service Unavailable' })
      .mockResolvedValueOnce(sampleProducts);

    render(
      <ProductProvider>
        <TestConsumer />
      </ProductProvider>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    await waitFor(() => {
      expect(screen.getByTestId('product-count').textContent).toBe('1');
    });

    expect(productApi.getProducts).toHaveBeenCalledTimes(2);
  });

  it('Test 3 — 504 (Request 1 -> 504, Request 2 -> 504, Request 3 -> success)', async () => {
    const sampleProducts = [{ id: 'p1', name: 'Bileklik' }];
    productApi.getProducts
      .mockRejectedValueOnce({ status: 504, message: 'Gateway Timeout' })
      .mockRejectedValueOnce({ status: 504, message: 'Gateway Timeout' })
      .mockResolvedValueOnce(sampleProducts);

    render(
      <ProductProvider>
        <TestConsumer />
      </ProductProvider>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });

    await waitFor(() => {
      expect(screen.getByTestId('product-count').textContent).toBe('1');
    });

    expect(productApi.getProducts).toHaveBeenCalledTimes(3);
  });

  it('Test 4 — 404 (Request -> 404 -> no retry)', async () => {
    productApi.getProducts.mockRejectedValue({ status: 404, message: 'Not Found' });

    render(
      <ProductProvider>
        <TestConsumer />
      </ProductProvider>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading-status').textContent).toBe('idle');
    });

    expect(productApi.getProducts).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('error-status').textContent).not.toBe('none');
  });

  it('Test 5 — Tüm retry başarısız (mevcut products state korunur, products=[] yapılmaz)', async () => {
    const initialProducts = [{ id: 'p1', name: 'Mevcut Ürün' }];
    productApi.getProducts.mockResolvedValueOnce(initialProducts);

    const { rerender } = render(
      <ProductProvider>
        <TestConsumer />
      </ProductProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('product-count').textContent).toBe('1');
    });

    // Sub-sequent load fail with 503 (3 retries)
    productApi.getProducts
      .mockRejectedValueOnce({ status: 503 })
      .mockRejectedValueOnce({ status: 503 })
      .mockRejectedValueOnce({ status: 503 });

    act(() => {
      screen.getByTestId('retry-btn').click();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading-status').textContent).toBe('idle');
    });

    // Product count must remain 1 (NOT cleared to 0)
    expect(screen.getByTestId('product-count').textContent).toBe('1');
    expect(screen.getByTestId('error-status').textContent).toBe('Ürünler yüklenirken bir hata oluştu.');
  });

  it('Test 6 — Gerçek empty response (HTTP 200 + [])', async () => {
    productApi.getProducts.mockResolvedValue([]);

    render(
      <ProductProvider>
        <TestConsumer />
      </ProductProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-status').textContent).toBe('idle');
    });

    expect(screen.getByTestId('product-count').textContent).toBe('0');
    expect(screen.getByTestId('error-status').textContent).toBe('none');
  });

  it('Test 7 — Category failure (Categories -> 503, Products -> 200)', async () => {
    categoryApi.getCategoryTree.mockRejectedValue({ status: 503 });
    categoryApi.getCategories.mockRejectedValue({ status: 503 });
    productApi.getProducts.mockResolvedValue([{ id: 'p1', name: 'Kolye' }]);

    render(
      <ProductProvider>
        <TestConsumer />
      </ProductProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('product-count').textContent).toBe('1');
    });

    expect(screen.getByTestId('category-count').textContent).toBe('0');
    expect(screen.getByTestId('product-count').textContent).toBe('1');
  });

  it('Test 8 — Race condition (Latest request wins)', async () => {
    let resolveA;
    const promiseA = new Promise((res) => { resolveA = res; });
    let resolveB;
    const promiseB = new Promise((res) => { resolveB = res; });

    productApi.getProducts
      .mockImplementationOnce(() => promiseA)
      .mockImplementationOnce(() => promiseB);

    render(
      <ProductProvider>
        <TestConsumer />
      </ProductProvider>
    );

    // Initial load A triggered
    act(() => {
      screen.getByTestId('retry-btn').click(); // Trigger load B
    });

    // Resolve B first with 2 items
    await act(async () => {
      resolveB([{ id: 'b1', name: 'B1' }, { id: 'b2', name: 'B2' }]);
    });

    await waitFor(() => {
      expect(screen.getByTestId('product-count').textContent).toBe('2');
    });

    // Now resolve late Request A with 1 item
    await act(async () => {
      resolveA([{ id: 'a1', name: 'A1' }]);
    });

    // Request B's result (count 2) MUST be preserved! Late Request A must NOT overwrite B!
    expect(screen.getByTestId('product-count').textContent).toBe('2');
  });
});
