import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock SignalR
vi.mock('@microsoft/signalr', () => {
  return {
    HubConnectionBuilder: vi.fn().mockImplementation(() => ({
      withUrl: vi.fn().mockReturnThis(),
      withAutomaticReconnect: vi.fn().mockReturnThis(),
      build: vi.fn().mockImplementation(() => ({
        start: vi.fn().mockResolvedValue(null),
        stop: vi.fn().mockResolvedValue(null),
        on: vi.fn(),
        off: vi.fn(),
        invoke: vi.fn().mockResolvedValue(null),
      })),
    })),
    HubConnectionState: {
      Connected: 'Connected',
      Disconnected: 'Disconnected',
    }
  };
});

// Setup mock server
export const handlers = [
  http.get('*/api/auth/me', () => {
    return HttpResponse.json({ id: 'user-1', email: 'test@example.com', fullName: 'Test User' });
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
        { id: 'p1', name: 'Gumus Kolye', price: 250, stockQuantity: 2, isNew: true, isSale: false, isActive: true },
        { id: 'p2', name: 'Celik Kolye', price: 150, stockQuantity: 10, isNew: false, isSale: true, isActive: true }
      ],
      totalPages: 1
    });
  }),
  http.get('*/api/admin/products/p1', () => {
    return HttpResponse.json({
      id: 'p1',
      name: 'Gumus Kolye',
      price: 250,
      variants: [
        { id: 'v1', name: 'Mavi Tasli', sku: 'GK-M1', additionalPrice: 20, stockQuantity: 1 }
      ]
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
  http.get('*/api/banners', () => {
    return HttpResponse.json([]);
  })
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());
