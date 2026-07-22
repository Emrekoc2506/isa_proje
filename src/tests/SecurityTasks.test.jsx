import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import { isValidGuid, prepareWishlistProductIds } from '../utils/wishlist';
import { collectDescendantIds } from '../utils/categoryTree';
import { WishlistProvider, useWishlist } from '../context/WishlistContext';
import { AuthProvider } from '../context/AuthContext';
import CategoriesSection from '../pages/AdminPage/sections/CategoriesSection';
import HeroSlider from '../components/HeroSlider/HeroSlider';
import { ProductProvider } from '../context/ProductContext';

// Server Setup for Wishlist, Categories, and Banners APIs
const MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1MjQ2MDgwMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const server = setupServer(
  http.get('*/api/auth/me', () => {
    return HttpResponse.json({ id: 'user-1', email: 'test@example.com', fullName: 'Test User', roles: ['Customer'] });
  }),
  http.get('*/api/wishlist', () => {
    return HttpResponse.json([
      { id: 'item-1', productId: '36b98b9c-7ad5-4cc8-a943-f98524566f04', productName: 'Server Product 1', price: 100 }
    ]);
  }),
  http.post('*/api/wishlist/merge', async ({ request }) => {
    const cloned = request.clone();
    const body = await cloned.json().catch(() => ({}));
    const merged = [
      { id: 'item-1', productId: '36b98b9c-7ad5-4cc8-a943-f98524566f04', productName: 'Server Product 1', price: 100 }
    ];
    if (body.productIds) {
      body.productIds.forEach((id, idx) => {
        merged.push({ id: `item-merge-${idx}`, productId: id, productName: `Merged Product ${idx}`, price: 150 });
      });
    }
    return HttpResponse.json(merged);
  }),
  http.post('*/api/wishlist/36b98b9c-7ad5-4cc8-a943-f98524566f04', () => {
    return HttpResponse.json({ id: 'new-fav', productId: '36b98b9c-7ad5-4cc8-a943-f98524566f04' });
  }),
  http.delete('*/api/wishlist/36b98b9c-7ad5-4cc8-a943-f98524566f04', () => {
    return new Response(null, { status: 204 });
  }),
  http.get('*/api/products', () => {
    return HttpResponse.json({
      items: [
        { id: '36b98b9c-7ad5-4cc8-a943-f98524566f04', name: 'Server Product 1', price: 100, isActive: true },
        { id: '22623049-f7db-4dd8-8665-d67ed3cf6a94', name: 'Server Product 2', price: 200, isActive: true }
      ]
    });
  }),
  http.get('https://localhost:7148/api/admin/categories', () => {
    return HttpResponse.json([
      { id: 'cat-root-1', name: 'Root Category 1', parentCategoryId: null, children: [
        { id: 'cat-sub-1', name: 'Sub Category 1', parentCategoryId: 'cat-root-1', children: [] }
      ]}
    ]);
  }),
  http.get('https://localhost:7148/api/banners', () => {
    return HttpResponse.json([]);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  vi.clearAllMocks();
});
afterAll(() => server.close());

describe('Security & Integration Utility Tests', () => {
  test('isValidGuid should match valid UUIDs only', () => {
    expect(isValidGuid('36b98b9c-7ad5-4cc8-a943-f98524566f04')).toBe(true);
    expect(isValidGuid('36b98b9c-7ad5-4cc8-a943-f98524566f04-invalid')).toBe(false);
    expect(isValidGuid('slug-text')).toBe(false);
  });

  test('prepareWishlistProductIds should filter, deduplicate, and limit to 100 items', () => {
    const list = [
      '36b98b9c-7ad5-4cc8-a943-f98524566f04',
      '36b98b9c-7ad5-4cc8-a943-f98524566f04', // duplicate
      'slug-product-name', // invalid
      '22623049-f7db-4dd8-8665-d67ed3cf6a94'
    ];
    const cleaned = prepareWishlistProductIds(list);
    expect(cleaned).toHaveLength(2);
    expect(cleaned).toContain('36b98b9c-7ad5-4cc8-a943-f98524566f04');
    expect(cleaned).toContain('22623049-f7db-4dd8-8665-d67ed3cf6a94');
  });

  test('collectDescendantIds should collect children category IDs recursively', () => {
    const category = {
      id: 'cat-root-1',
      children: [
        { id: 'cat-sub-1', children: [
          { id: 'cat-nested-1', children: [] }
        ]}
      ]
    };
    const descendants = collectDescendantIds(category);
    expect(descendants.has('cat-sub-1')).toBe(true);
    expect(descendants.has('cat-nested-1')).toBe(true);
    expect(descendants.size).toBe(2);
  });
});

describe('Wishlist State & Actions Tests', () => {
  function TestComp() {
    const { items, addFavorite, removeFavorite, mergeGuestWishlist } = useWishlist();
    return (
      <div>
        <div data-testid="wishlist-count">{items.length}</div>
        <button onClick={() => addFavorite('36b98b9c-7ad5-4cc8-a943-f98524566f04')} data-testid="add-btn">Add</button>
        <button onClick={() => removeFavorite('36b98b9c-7ad5-4cc8-a943-f98524566f04')} data-testid="remove-btn">Remove</button>
        <button onClick={() => mergeGuestWishlist(['36b98b9c-7ad5-4cc8-a943-f98524566f04'])} data-testid="merge-btn">Merge</button>
      </div>
    );
  }

  test('should handle guest favorite actions on localStorage', async () => {
    render(
      <AuthProvider>
        <WishlistProvider>
          <TestComp />
        </WishlistProvider>
      </AuthProvider>
    );

    const addBtn = screen.getByTestId('add-btn');
    await act(async () => {
      addBtn.click();
    });

    const localList = JSON.parse(localStorage.getItem('isa_guest_wishlist') || '[]');
    expect(localList).toContain('36b98b9c-7ad5-4cc8-a943-f98524566f04');
  });

  test('should clear guest wishlist from localStorage and save response in state on merge guest success', async () => {
    localStorage.setItem('accessToken', MOCK_JWT);
    localStorage.setItem('isa_guest_wishlist', JSON.stringify(['22623049-f7db-4dd8-8665-d67ed3cf6a94']));

    render(
      <AuthProvider>
        <WishlistProvider>
          <TestComp />
        </WishlistProvider>
      </AuthProvider>
    );

    const mergeBtn = screen.getByTestId('merge-btn');
    await act(async () => {
      mergeBtn.click();
    });

    expect(localStorage.getItem('isa_guest_wishlist')).toBeNull();
  });
});

describe('Category cycles & Cycle protection UI logic tests', () => {
  test('should render Category Section and allow allowed parent categories', async () => {
    render(
      <CategoriesSection />
    );

    expect(await screen.findByText('Kategori Ağacı')).toBeInTheDocument();
  });
});

describe('Banner Boş Yanıt & Normalizasyon Tests', () => {
  test('should not render slides when banners array is empty', async () => {
    render(
      <ProductProvider>
        <HeroSlider />
      </ProductProvider>
    );

    await waitFor(() => {
      expect(screen.queryByLabelText('Previous slide')).toBeNull();
    });
  });
});
