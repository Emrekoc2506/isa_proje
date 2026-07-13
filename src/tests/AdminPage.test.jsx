import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminPage from '../pages/AdminPage/AdminPage';
import { AuthProvider } from '../context/AuthContext';
import { ProductProvider } from '../context/ProductContext';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('https://localhost:7148/api/auth/me', () => {
    return HttpResponse.json({ id: 'admin-id', roles: ['SuperAdmin'], email: 'admin@gmail.com' });
  }),
  http.get('https://localhost:7148/api/admin/dashboard', () => {
    return HttpResponse.json({
      totalRevenue: 15400,
      totalOrders: 42,
      totalCustomers: 12,
      lowStockCount: 2
    });
  }),
  http.get('https://localhost:7148/api/admin/products', () => {
    return HttpResponse.json({
      items: [
        { id: 'p1', name: 'Gumus Kolye', price: 250, stockQuantity: 2, isNew: true, isSale: false, isActive: true }
      ],
      totalPages: 1
    });
  }),
  http.get('https://localhost:7148/api/admin/inventory/low-stock', () => {
    return HttpResponse.json([
      { id: 'p1', name: 'Gumus Kolye', price: 250, stockQuantity: 2 }
    ]);
  }),
  http.get('https://localhost:7148/api/categories/tree', () => {
    return HttpResponse.json([]);
  }),
  http.get('https://localhost:7148/api/admin/categories', () => {
    return HttpResponse.json([]);
  }),
  http.get('https://localhost:7148/api/banners', () => {
    return HttpResponse.json([]);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AdminPage Integration Tests', () => {
  test('should render dashboard summary stats cards', async () => {
    localStorage.setItem('accessToken', 'mock-admin-token');
    
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
