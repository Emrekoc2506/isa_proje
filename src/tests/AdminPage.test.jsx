import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminPage from '../pages/AdminPage/AdminPage';
import { AuthProvider } from '../context/AuthContext';
import { ProductProvider } from '../context/ProductContext';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1MjQ2MDgwMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const server = setupServer(
  http.get('*/api/auth/me', () => {
    return HttpResponse.json({ id: 'admin-id', roles: ['SuperAdmin'], email: 'admin@gmail.com' });
  }),
  http.get('*/api/admin/dashboard', () => {
    return HttpResponse.json({
      totalRevenue: 15400,
      totalOrders: 42,
      totalCustomers: 12,
      lowStockCount: 2
    });
  }),
  http.get('*/api/admin/products', () => {
    return HttpResponse.json({
      items: [
        { id: 'p1', name: 'Gumus Kolye', price: 250, stockQuantity: 2, isNew: true, isSale: false, isActive: true }
      ],
      totalPages: 1
    });
  }),
  http.get('*/api/admin/inventory/low-stock', () => {
    return HttpResponse.json([
      { id: 'p1', name: 'Gumus Kolye', price: 250, stockQuantity: 2 }
    ]);
  }),
  http.get('*/api/categories/tree', () => {
    return HttpResponse.json([]);
  }),
  http.get('*/api/admin/categories', () => {
    return HttpResponse.json([]);
  }),
  http.get('*/api/banners', () => {
    return HttpResponse.json([]);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AdminPage Integration Tests', () => {
  test('should render dashboard summary stats cards', async () => {
    localStorage.setItem('accessToken', MOCK_JWT);
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <ProductProvider>
            <AdminPage />
          </ProductProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Let MSW responses load
    await act(async () => {
      await new Promise(r => setTimeout(r, 150));
    });

    // Verify title or specific sections
    const pageTitle = screen.getByRole('heading', { name: 'Yönetim Özeti' });
    expect(pageTitle).toBeInTheDocument();
    
    expect(screen.getByText('15400 ₺')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
