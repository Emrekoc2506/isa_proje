import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import CustomersSection from '../pages/AdminPage/sections/CustomersSection';
import InventorySection from '../pages/AdminPage/sections/InventorySection';
import { AuthProvider } from '../context/AuthContext';
import * as productApi from '../services/productApi';

const MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1MjQ2MDgwMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

describe('Admin Role & Stock Persistence Suite (Section 14 Tests)', () => {
  it('Test 1 — Role update uses POST method (PATCH is NOT called)', async () => {
    let methodUsed = null;
    let requestPayload = null;

    server.use(
      http.get('*/api/auth/me', () => HttpResponse.json({ id: 's1', email: 'super@admin.com', roles: ['SuperAdmin'] })),
      http.get('*/api/admin/customers', () => HttpResponse.json([
        { id: 'c1', fullName: 'Ahmet Yılmaz', email: 'ahmet@example.com', role: 'Customer', isAdmin: false }
      ])),
      http.post('*/api/admin/customers/c1/role', async ({ request }) => {
        methodUsed = request.method;
        try {
          requestPayload = await request.clone().json();
        } catch {
          requestPayload = null;
        }
        return HttpResponse.json({ userId: 'c1', roles: ['Customer', 'Admin'] });
      })
    );

    localStorage.setItem('accessToken', MOCK_JWT);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <AuthProvider>
        <CustomersSection />
      </AuthProvider>
    );

    const adminBtn = await screen.findByRole('button', { name: /Admin Yap/i });
    await act(async () => {
      fireEvent.click(adminBtn);
    });

    expect(methodUsed).toBe('POST');
    expect(requestPayload).toEqual({ role: 'Admin' });
  });

  it('Test 2 — Role API success re-fetches customer list and displays backend role', async () => {
    let fetchCount = 0;
    server.use(
      http.get('*/api/auth/me', () => HttpResponse.json({ id: 's1', email: 'super@admin.com', roles: ['SuperAdmin'] })),
      http.get('*/api/admin/customers', () => {
        fetchCount++;
        if (fetchCount === 1) {
          return HttpResponse.json([
            { id: 'c1', fullName: 'Mehmet Kaya', email: 'mehmet@example.com', role: 'Customer', isAdmin: false }
          ]);
        }
        return HttpResponse.json([
          { id: 'c1', fullName: 'Mehmet Kaya', email: 'mehmet@example.com', role: 'Admin', isAdmin: true, roles: ['Admin'] }
        ]);
      }),
      http.post('*/api/admin/customers/c1/role', () => HttpResponse.json({ userId: 'c1', roles: ['Admin'] }))
    );

    localStorage.setItem('accessToken', MOCK_JWT);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <AuthProvider>
        <CustomersSection />
      </AuthProvider>
    );

    const adminBtn = await screen.findByRole('button', { name: /Admin Yap/i });
    await act(async () => {
      fireEvent.click(adminBtn);
    });

    await waitFor(() => {
      expect(fetchCount).toBeGreaterThanOrEqual(2);
    });

    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
  });

  it('Test 3 — Role API failure retains original role, skips success alert, and displays error alert', async () => {
    server.use(
      http.get('*/api/auth/me', () => HttpResponse.json({ id: 's1', email: 'super@admin.com', roles: ['SuperAdmin'] })),
      http.get('*/api/admin/customers', () => HttpResponse.json([
        { id: 'c1', fullName: 'Ayşe Demir', email: 'ayse@example.com', role: 'Customer', isAdmin: false }
      ])),
      http.post('*/api/admin/customers/c1/role', () => new HttpResponse(null, { status: 403 }))
    );

    localStorage.setItem('accessToken', MOCK_JWT);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <AuthProvider>
        <CustomersSection />
      </AuthProvider>
    );

    const adminBtn = await screen.findByRole('button', { name: /Admin Yap/i });
    await act(async () => {
      fireEvent.click(adminBtn);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('SuperAdmin yetkisi gereklidir'));
    });

    // Customer role badge must remain Customer (NOT changed to Admin!)
    expect(screen.getByText('Müşteri')).toBeDefined();
  });

  it('Test 4 — Stock update uses POST /api/admin/products/{id}/stock method', async () => {
    let methodUsed = null;
    let requestPayload = null;

    server.use(
      http.get('*/api/admin/products', () => HttpResponse.json([
        { id: 'p1', name: 'Kehribar Kolye', stockQuantity: 10 }
      ])),
      http.get('*/api/admin/inventory/low-stock', () => HttpResponse.json([])),
      http.post('*/api/admin/products/p1/stock', async ({ request }) => {
        methodUsed = request.method;
        try {
          requestPayload = await request.clone().json();
        } catch {
          requestPayload = null;
        }
        return HttpResponse.json({ productId: 'p1', stockQuantity: 25 });
      })
    );

    render(<InventorySection />);

    await waitFor(() => {
      expect(screen.getByText('Kehribar Kolye')).toBeDefined();
    });

    const editBtn = screen.getByRole('button', { name: /Stok Güncelle/i });
    fireEvent.click(editBtn);

    const input = screen.getByDisplayValue('10');
    fireEvent.change(input, { target: { value: '25' } });

    const saveBtn = screen.getByTitle('Kaydet');
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(methodUsed).toBe('POST');
    expect(requestPayload.stockQuantity).toBe(25);
  });

  it('Test 5 — Stock success updates the local row with the server value', async () => {
    let fetchCount = 0;
    server.use(
      http.get('*/api/admin/products', () => {
        fetchCount++;
        if (fetchCount === 1) {
          return HttpResponse.json([
            { id: 'p1', name: 'Gümüş Yüzük', stockQuantity: 5 }
          ]);
        }
        return HttpResponse.json([
          { id: 'p1', name: 'Gümüş Yüzük', stockQuantity: 50 }
        ]);
      }),
      http.get('*/api/admin/inventory/low-stock', () => HttpResponse.json([])),
      http.post('*/api/admin/products/p1/stock', () => HttpResponse.json({ productId: 'p1', stockQuantity: 50 }))
    );

    render(<InventorySection />);

    await waitFor(() => {
      expect(screen.getByText('Gümüş Yüzük')).toBeDefined();
    });
    const initialFetchCount = fetchCount;

    fireEvent.click(screen.getByRole('button', { name: /Stok Güncelle/i }));
    fireEvent.change(screen.getByDisplayValue('5'), { target: { value: '50' } });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Kaydet'));
    });

    expect(fetchCount).toBe(initialFetchCount);
    expect(screen.getByText('50 Adet')).toBeDefined();
  });

  it('Test 6 — Stock API failure retains original stock and displays error', async () => {
    server.use(
      http.get('*/api/admin/products', () => HttpResponse.json([
        { id: 'p1', name: 'Bakır Bileklik', stockQuantity: 8 }
      ])),
      http.get('*/api/admin/inventory/low-stock', () => HttpResponse.json([])),
      http.post('*/api/admin/products/p1/stock', () => new HttpResponse(null, { status: 500 }))
    );

    render(<InventorySection />);

    await waitFor(() => {
      expect(screen.getByText('Bakır Bileklik')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /Stok Güncelle/i }));
    fireEvent.change(screen.getByDisplayValue('8'), { target: { value: '99' } });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Kaydet'));
    });

    await waitFor(() => {
      expect(screen.getByText(/başarısız|500/i)).toBeDefined();
    });

    expect(screen.getByText('8 Adet')).toBeDefined();
  });

  it('Test 7 — Double click protection prevents duplicate concurrent requests', async () => {
    let postCallCount = 0;
    server.use(
      http.get('*/api/auth/me', () => HttpResponse.json({ id: 's1', email: 'super@admin.com', roles: ['SuperAdmin'] })),
      http.get('*/api/admin/customers', () => HttpResponse.json([
        { id: 'c1', fullName: 'Ali Can', email: 'ali@example.com', role: 'Customer', isAdmin: false }
      ])),
      http.post('*/api/admin/customers/c1/role', async () => {
        postCallCount++;
        await new Promise(r => setTimeout(r, 100));
        return HttpResponse.json({ userId: 'c1', roles: ['Admin'] });
      })
    );

    localStorage.setItem('accessToken', MOCK_JWT);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <AuthProvider>
        <CustomersSection />
      </AuthProvider>
    );

    const adminBtn = await screen.findByRole('button', { name: /Admin Yap/i });
    
    // Simulate rapid double click
    act(() => {
      fireEvent.click(adminBtn);
      fireEvent.click(adminBtn);
    });

    await waitFor(() => {
      expect(postCallCount).toBe(1);
    });
  });

  it('Test 8 — Variant stock update uses POST method and displays server value', async () => {
    let methodUsed = null;
    let requestPayload = null;

    server.use(
      http.get('*/api/admin/products', () => HttpResponse.json([
        {
          id: 'p1',
          name: 'Vefkli Kolye',
          stockQuantity: 10,
          variants: [
            { id: 'v1', name: 'Kırmızı', stockQuantity: 3 }
          ]
        }
      ])),
      http.get('*/api/admin/inventory/low-stock', () => HttpResponse.json([])),
      http.post('*/api/admin/products/p1/variants/v1/stock', async ({ request }) => {
        methodUsed = request.method;
        try {
          requestPayload = await request.clone().json();
        } catch {
          requestPayload = null;
        }
        return HttpResponse.json({ variantId: 'v1', stockQuantity: 15 });
      })
    );

    render(<InventorySection />);

    await waitFor(() => {
      expect(screen.getByText('Vefkli Kolye')).toBeDefined();
    });

    // Expand variants row
    const toggleBtn = screen.getByText(/Varyant\)/i);
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(screen.getByText(/Kırmızı/i)).toBeDefined();
    });

    const editVariantBtn = screen.getByRole('button', { name: 'Düzenle' });
    fireEvent.click(editVariantBtn);

    const input = screen.getByDisplayValue('3');
    fireEvent.change(input, { target: { value: '15' } });

    const saveBtn = screen.getByTitle('Kaydet');
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(methodUsed).toBe('POST');
    expect(requestPayload.stockQuantity).toBe(15);
  });

  it('Test 9 — Mobile inventory saves with Enter and does not refetch the catalog', async () => {
    let adminFetchCount = 0;

    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));

    server.use(
      http.get('*/api/admin/products', () => {
        adminFetchCount++;
        return HttpResponse.json([
          { id: 'mobile-p1', name: 'Mobil Ürün', sku: 'MOB-1', stockQuantity: 4 }
        ]);
      }),
      http.get('*/api/admin/inventory/low-stock', () => HttpResponse.json([]))
    );
    const stockUpdateSpy = vi.spyOn(productApi, 'updateAdminProductStock')
      .mockResolvedValue({ productId: 'mobile-p1', stockQuantity: 9 });

    render(<InventorySection />);

    await waitFor(() => {
      expect(screen.getByText('Mobil Ürün')).toBeDefined();
    });
    const initialAdminFetchCount = adminFetchCount;

    fireEvent.click(screen.getByRole('button', { name: 'Stok Güncelle' }));
    const input = screen.getByLabelText('Mobil Ürün stok adedi');
    fireEvent.change(input, { target: { value: '9' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(stockUpdateSpy).toHaveBeenCalledTimes(1);
      expect(screen.getAllByText('9 Adet')).toHaveLength(2);
    });
    expect(adminFetchCount).toBe(initialAdminFetchCount);
  });
});
