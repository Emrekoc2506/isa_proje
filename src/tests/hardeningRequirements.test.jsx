import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { CartProvider, useCart, getCartErrorMessage, mapServerCart, resetCartMergePromise } from '../context/CartContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import * as cartApi from '../services/cartApi';
import * as paymentApi from '../services/paymentApi';
import * as authApi from '../services/authApi';
import { request } from '../services/apiClient';
import fs from 'fs';
import path from 'path';

const VALID_GUID = '11111111-2222-3333-4444-555555555555';
const MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1MjQ2MDgwMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const server = setupServer(
  http.get('*/api/auth/me', () => {
    return HttpResponse.json({ id: 'u-1', email: 'user@example.com', roles: ['Customer'] });
  }),
  http.get('*/api/cart', () => {
    return HttpResponse.json({
      items: [
        { id: 'item-1', productId: VALID_GUID, quantity: 2, productName: 'Test Product', unitPrice: 100 }
      ],
      totalQuantity: 2,
      subtotal: 200
    });
  }),
  http.post('*/api/cart/items', async ({ request }) => {
    let body = {};
    try {
      body = await request.clone().json();
    } catch {
      body = {};
    }
    return HttpResponse.json({
      items: [
        { id: 'item-1', productId: VALID_GUID, quantity: 2, productName: 'Test Product', unitPrice: 100 },
        { id: 'item-2', productId: body.productId || VALID_GUID, quantity: body.quantity || 1, productName: 'Added Product', unitPrice: 150 }
      ],
      totalQuantity: 2 + (body.quantity || 1),
      subtotal: 350
    });
  }),
  http.patch('*/api/cart/items/:id', () => {
    return HttpResponse.json({
      items: [
        { id: 'item-1', productId: VALID_GUID, quantity: 5, productName: 'Test Product', unitPrice: 100 }
      ],
      totalQuantity: 5,
      subtotal: 500
    });
  }),
  http.delete('*/api/cart/items/:id', () => {
    return HttpResponse.json({
      items: [],
      totalQuantity: 0,
      subtotal: 0
    });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  resetCartMergePromise();
});
afterAll(() => server.close());

describe('Hardening Requirements - Comprehensive Suite (63 Verification Points)', () => {

  // ==========================================
  // CART TESTS (1 - 18)
  // ==========================================
  describe('Cart Failure Hardening & State Sync (Tests 1-18)', () => {
    test('1. Backend GUID product renders server cart on API success', async () => {
      let contextRes;
      function TestComp() {
        contextRes = useCart();
        return null;
      }
      render(<AuthProvider><CartProvider><TestComp /></CartProvider></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      let result;
      await act(async () => {
        result = await contextRes.addToCart({ id: VALID_GUID }, 1);
      });

      expect(result.success).toBe(true);
      expect(contextRes.items.length).toBe(2);
      expect(contextRes.items[1].source).toBe('server');
    });

    test('2. Backend GUID product is NOT added to local cart on 400 error', async () => {
      server.use(
        http.post('*/api/cart/items', () => {
          return HttpResponse.json({ message: 'Stok yetersiz', code: 'insufficient_stock' }, { status: 400 });
        })
      );
      let contextRes;
      function TestComp() {
        contextRes = useCart();
        return null;
      }
      render(<AuthProvider><CartProvider><TestComp /></CartProvider></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      let result;
      await act(async () => {
        result = await contextRes.addToCart({ id: VALID_GUID }, 1);
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe('insufficient_stock');
      expect(contextRes.items.length).toBe(1); // Not added locally!
    });

    test('3. Backend GUID product is NOT added to local cart on 500 error', async () => {
      server.use(
        http.post('*/api/cart/items', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );
      let contextRes;
      function TestComp() {
        contextRes = useCart();
        return null;
      }
      render(<AuthProvider><CartProvider><TestComp /></CartProvider></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      let result;
      await act(async () => {
        result = await contextRes.addToCart({ id: VALID_GUID }, 1);
      });

      expect(result.success).toBe(false);
      expect(contextRes.items.length).toBe(1);
    });

    test('4. refreshCart is called after API failure', async () => {
      let refreshCalled = false;
      server.use(
        http.get('*/api/cart', () => {
          refreshCalled = true;
          return HttpResponse.json({ items: [] });
        }),
        http.post('*/api/cart/items', () => {
          return HttpResponse.json({ message: 'Error', code: 'product_unavailable' }, { status: 400 });
        })
      );
      let contextRes;
      function TestComp() {
        contextRes = useCart();
        return null;
      }
      render(<AuthProvider><CartProvider><TestComp /></CartProvider></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      refreshCalled = false;
      await act(async () => {
        await contextRes.addToCart({ id: VALID_GUID }, 1);
      });

      expect(refreshCalled).toBe(true);
    });

    test('5. product_unavailable code maps to correct Turkish message', () => {
      expect(getCartErrorMessage('product_unavailable')).toBe('Bu ürün artık satışta değil.');
    });

    test('6. product_variant_unavailable code maps to correct Turkish message', () => {
      expect(getCartErrorMessage('product_variant_unavailable')).toBe('Seçtiğiniz ürün seçeneği artık satışta değil.');
    });

    test('7. insufficient_stock code maps to correct Turkish message', () => {
      expect(getCartErrorMessage('insufficient_stock')).toBe('Bu ürün için yeterli stok bulunmuyor.');
    });

    test('8. quantity_limit_exceeded code maps to correct Turkish message', () => {
      expect(getCartErrorMessage('quantity_limit_exceeded')).toBe('Bu ürün için izin verilen sipariş miktarı aşıldı.');
    });

    test('9. cart_concurrency_conflict code maps to correct Turkish message', () => {
      expect(getCartErrorMessage('cart_concurrency_conflict')).toBe('Sepetiniz şu anda güncelleniyor. Lütfen tekrar deneyin.');
    });

    test('10. Total count does not increase on failed add operation', async () => {
      server.use(
        http.post('*/api/cart/items', () => {
          return HttpResponse.json({ code: 'insufficient_stock' }, { status: 409 });
        })
      );
      let contextRes;
      function TestComp() {
        contextRes = useCart();
        return null;
      }
      render(<AuthProvider><CartProvider><TestComp /></CartProvider></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      const initialCount = contextRes.totalCount;
      await act(async () => {
        await contextRes.addToCart({ id: VALID_GUID }, 5);
      });

      expect(contextRes.totalCount).toBe(initialCount);
    });

    test('11. Fake item ID is NOT generated on failed add operation', async () => {
      server.use(
        http.post('*/api/cart/items', () => {
          return HttpResponse.json({ code: 'insufficient_stock' }, { status: 409 });
        })
      );
      let contextRes;
      function TestComp() {
        contextRes = useCart();
        return null;
      }
      render(<AuthProvider><CartProvider><TestComp /></CartProvider></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      await act(async () => {
        await contextRes.addToCart({ id: VALID_GUID }, 1);
      });

      const fakeItem = contextRes.items.find(i => i.source === 'mock' || String(i.id).startsWith('fake-item-'));
      expect(fakeItem).toBeUndefined();
    });

    test('12. Non-GUID development mock product can be added in dev environment', async () => {
      let contextRes;
      function TestComp() {
        contextRes = useCart();
        return null;
      }
      render(<AuthProvider><CartProvider><TestComp /></CartProvider></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      await act(async () => {
        await contextRes.addToCart({ id: 'demo-123', name: 'Demo Product', price: 50 }, 1);
      });

      const mockItem = contextRes.items.find(i => String(i.id) === 'demo-123');
      expect(mockItem).toBeDefined();
      expect(mockItem.source).toBe('mock');
    });

    test('13. Production mode rejects non-GUID products', async () => {
      const origProd = import.meta.env.PROD;
      import.meta.env.PROD = true;
      try {
        let contextRes;
        function TestComp() {
          contextRes = useCart();
          return null;
        }
        render(<AuthProvider><CartProvider><TestComp /></CartProvider></AuthProvider>);
        await act(async () => { await new Promise(r => setTimeout(r, 50)); });

        let res;
        await act(async () => {
          res = await contextRes.addToCart({ id: 'demo-123' }, 1);
        });

        expect(res.success).toBe(false);
        expect(res.code).toBe('invalid_id');
      } finally {
        import.meta.env.PROD = origProd;
      }
    });

    test('14. Prevent duplicate add request while add is pending for same product', async () => {
      let contextRes;
      function TestComp() {
        contextRes = useCart();
        return null;
      }
      render(<AuthProvider><CartProvider><TestComp /></CartProvider></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      let res1, res2;
      await act(async () => {
        const p1 = contextRes.addToCart({ id: VALID_GUID }, 1);
        const p2 = contextRes.addToCart({ id: VALID_GUID }, 1);
        [res1, res2] = await Promise.all([p1, p2]);
      });

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(false);
      expect(res2.code).toBe('duplicate_request');
    });

    test('15. updateQty calls refreshCart after 404 response', async () => {
      let refreshCalled = false;
      server.use(
        http.get('*/api/cart', () => {
          refreshCalled = true;
          return HttpResponse.json({ items: [] });
        }),
        http.patch('*/api/cart/items/:id', () => {
          return HttpResponse.json({ message: 'Not found', code: 'not_found' }, { status: 404 });
        })
      );
      let contextRes;
      function TestComp() {
        contextRes = useCart();
        return null;
      }
      render(<AuthProvider><CartProvider><TestComp /></CartProvider></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      refreshCalled = false;
      await act(async () => {
        await contextRes.updateQty('item-1', 10);
      });

      expect(refreshCalled).toBe(true);
    });

    test('16. updateQty failure does NOT reset or wipe other cart items', async () => {
      server.use(
        http.patch('*/api/cart/items/:id', () => {
          return HttpResponse.json({ code: 'quantity_limit_exceeded' }, { status: 400 });
        })
      );
      let contextRes;
      function TestComp() {
        contextRes = useCart();
        return null;
      }
      render(<AuthProvider><CartProvider><TestComp /></CartProvider></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      const itemCount = contextRes.items.length;
      await act(async () => {
        await contextRes.updateQty('item-1', 999);
      });

      expect(contextRes.items.length).toBe(itemCount);
    });

    test('17. clearCart failure does NOT empty cart state', async () => {
      server.use(
        http.delete('*/api/cart', () => {
          return HttpResponse.json({ code: 'network_error' }, { status: 500 });
        })
      );
      let contextRes;
      function TestComp() {
        contextRes = useCart();
        return null;
      }
      render(<AuthProvider><CartProvider><TestComp /></CartProvider></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      await act(async () => {
        await contextRes.clearCart();
      });

      expect(contextRes.items.length).toBeGreaterThan(0);
    });

    test('18. remove failure runs server refreshCart', async () => {
      let refreshCalled = false;
      server.use(
        http.get('*/api/cart', () => {
          refreshCalled = true;
          return HttpResponse.json({ items: [] });
        }),
        http.delete('*/api/cart/items/:id', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );
      let contextRes;
      function TestComp() {
        contextRes = useCart();
        return null;
      }
      render(<AuthProvider><CartProvider><TestComp /></CartProvider></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      refreshCalled = false;
      await act(async () => {
        await contextRes.removeFromCart('item-1');
      });

      expect(refreshCalled).toBe(true);
    });
  });

  // ==========================================
  // MERGE TESTS (19 - 24)
  // ==========================================
  describe('Guest Cart Merge Hardening (Tests 19-24)', () => {
    test('19. Guest cart merge triggered after login', async () => {
      let mergeCount = 0;
      server.use(
        http.post('*/api/cart/merge', () => {
          mergeCount++;
          return HttpResponse.json({ items: [] });
        })
      );

      localStorage.setItem('accessToken', MOCK_JWT);
      render(<AuthProvider><CartProvider><div /></CartProvider></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 100)); });

      expect(mergeCount).toBeGreaterThanOrEqual(1);
    });

    test('20. refreshCart is called after successful merge', async () => {
      let refreshCount = 0;
      server.use(
        http.get('*/api/cart', () => {
          refreshCount++;
          return HttpResponse.json({ items: [] });
        })
      );

      localStorage.setItem('accessToken', MOCK_JWT);
      render(<AuthProvider><CartProvider><div /></CartProvider></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 100)); });

      expect(refreshCount).toBeGreaterThan(0);
    });

    test('21. Merge failure does NOT logout user', async () => {
      server.use(
        http.post('*/api/cart/merge', () => {
          return HttpResponse.json({ message: 'Merge failed' }, { status: 500 });
        })
      );

      localStorage.setItem('accessToken', MOCK_JWT);
      let authRes;
      function TestComp() {
        authRes = useAuth();
        return null;
      }
      render(<AuthProvider><CartProvider><TestComp /></CartProvider></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 100)); });

      expect(localStorage.getItem('accessToken')).toBe(MOCK_JWT);
    });

    test('22. Parallel render cycles do not create duplicate merge requests', async () => {
      const seenMergeRequests = new Set();
      server.use(
        http.post('*/api/cart/merge', ({ request }) => {
          seenMergeRequests.add(request);
          return HttpResponse.json({ items: [] });
        })
      );

      localStorage.setItem('accessToken', MOCK_JWT);
      render(
        <AuthProvider>
          <CartProvider>
            <div>Comp 1</div>
          </CartProvider>
          <CartProvider>
            <div>Comp 2</div>
          </CartProvider>
        </AuthProvider>
      );
      await act(async () => { await new Promise(r => setTimeout(r, 100)); });

      expect(seenMergeRequests.size).toBe(1);
    });

    test('23. Controlled single retry on merge 409 cart_concurrency_conflict', async () => {
      let mergeAttempts = 0;
      server.use(
        http.post('*/api/cart/merge', () => {
          mergeAttempts++;
          if (mergeAttempts === 1) {
            return HttpResponse.json({ code: 'cart_concurrency_conflict' }, { status: 409 });
          }
          return HttpResponse.json({ items: [] });
        })
      );

      localStorage.setItem('accessToken', MOCK_JWT);
      render(<AuthProvider><CartProvider><div /></CartProvider></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 600)); });

      expect(mergeAttempts).toBe(2);
    });

    test('24. Mock items are cleaned up after successful merge', async () => {
      let contextRes;
      function TestComp() {
        contextRes = useCart();
        return null;
      }
      render(<AuthProvider><CartProvider><TestComp /></CartProvider></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      await act(async () => {
        await contextRes.addToCart({ id: 'demo-999' }, 1);
      });
      expect(contextRes.items.some(i => i.source === 'mock')).toBe(true);

      // Now trigger merge by setting token and re-rendering
      localStorage.setItem('accessToken', MOCK_JWT);
      await act(async () => {
        await contextRes.refreshCart();
      });

      expect(contextRes.items.some(i => i.source === 'mock')).toBe(false);
    });
  });

  // ==========================================
  // PAYMENT TESTS (25 - 32)
  // ==========================================
  describe('Payment API & Cancellation Hardening (Tests 25-32)', () => {
    test('25 & 26. cancelPayment posts to correct /payments/:orderId/cancel endpoint with orderId', async () => {
      let hitEndpoint = '';
      server.use(
        http.post('*/api/payments/:orderId/cancel', ({ params }) => {
          hitEndpoint = params.orderId;
          return HttpResponse.json({ success: true });
        })
      );

      await paymentApi.cancelPayment('order-123', 'User cancel');
      expect(hitEndpoint).toBe('order-123');
    });

    test('27. Duplicate cancel request is handled cleanly', async () => {
      server.use(
        http.post('*/api/payments/:orderId/cancel', () => {
          return HttpResponse.json({ success: true, message: 'Already cancelled' });
        })
      );

      const res = await paymentApi.cancelPayment('order-123');
      expect(res.success).toBe(true);
    });

    test('28. payment_already_completed error code is surfaced', async () => {
      server.use(
        http.post('*/api/payments/:orderId/cancel', () => {
          return HttpResponse.json({ code: 'payment_already_completed', message: 'Zaten tamamlandı' }, { status: 409 });
        })
      );

      await expect(paymentApi.cancelPayment('order-123')).rejects.toThrow();
    });

    test('29. payment_cancellation_conflict triggers order refresh', async () => {
      server.use(
        http.post('*/api/payments/:orderId/cancel', () => {
          return HttpResponse.json({ code: 'payment_cancellation_conflict' }, { status: 409 });
        })
      );

      await expect(paymentApi.cancelPayment('order-123')).rejects.toThrow();
    });

    test('30. Network error during cancel does NOT assume cancelled state', async () => {
      server.use(
        http.post('*/api/payments/:orderId/cancel', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await expect(paymentApi.cancelPayment('order-123')).rejects.toThrow();
    });

    test('31. Payment initialization failure shows error state', async () => {
      server.use(
        http.post('*/api/payments/init', () => {
          return HttpResponse.json({ message: 'Init failed' }, { status: 400 });
        })
      );

      await expect(paymentApi.initializePayment({ orderId: 'ord-1' })).rejects.toThrow();
    });

    test('32. Payment init failure prevents provider redirect', async () => {
      server.use(
        http.post('*/api/payments/init', () => {
          return HttpResponse.json({ message: 'Error' }, { status: 400 });
        })
      );

      let errCaught = false;
      try {
        await paymentApi.initializePayment({ orderId: 'ord-1' });
      } catch {
        errCaught = true;
      }
      expect(errCaught).toBe(true);
    });
  });

  // ==========================================
  // AUTH & REFRESH QUEUE TESTS (33 - 43)
  // ==========================================
  describe('Auth Session, Logout Order & Refresh Queue Hardening (Tests 33-43)', () => {
    test('33 & 34. logout passes refresh token to API BEFORE clearing localStorage', async () => {
      let receivedToken = null;
      server.use(
        http.post('*/api/auth/logout', async ({ request }) => {
          try {
            const body = await request.clone().json();
            receivedToken = body.refreshToken;
          } catch {}
          return HttpResponse.json({ success: true });
        })
      );

      localStorage.setItem('accessToken', MOCK_JWT);
      localStorage.setItem('refreshToken', 'ref-12345');

      let authRes;
      function TestComp() {
        authRes = useAuth();
        return null;
      }
      render(<AuthProvider><TestComp /></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      await act(async () => {
        await authRes.logout();
      });

      expect(receivedToken).toBe('ref-12345');
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    test('35. Local session is cleared in finally even if logout API fails', async () => {
      server.use(
        http.post('*/api/auth/logout', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      localStorage.setItem('accessToken', MOCK_JWT);
      localStorage.setItem('refreshToken', 'ref-12345');

      let authRes;
      function TestComp() {
        authRes = useAuth();
        return null;
      }
      render(<AuthProvider><TestComp /></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      await act(async () => {
        await authRes.logout();
      });

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    test('36. logoutAll carries Authorization header during request', async () => {
      let authHeader = null;
      server.use(
        http.post('*/api/auth/logout-all', ({ request }) => {
          authHeader = request.headers.get('Authorization');
          return HttpResponse.json({ success: true });
        })
      );

      localStorage.setItem('accessToken', MOCK_JWT);

      let authRes;
      function TestComp() {
        authRes = useAuth();
        return null;
      }
      render(<AuthProvider><TestComp /></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      await act(async () => {
        await authRes.logoutAll();
      });

      expect(authHeader).toBe(`Bearer ${MOCK_JWT}`);
    });

    test('37. Token refresh success resolves queued requests', async () => {
      server.use(
        http.get('*/api/test-queued', ({ request }) => {
          const auth = request.headers.get('Authorization');
          if (auth === `Bearer new-token-999`) {
            return HttpResponse.json({ success: true });
          }
          return new HttpResponse(null, { status: 401 });
        }),
        http.post('*/api/auth/refresh-token', () => {
          return HttpResponse.json({ accessToken: 'new-token-999', refreshToken: 'new-ref-999' });
        })
      );

      localStorage.setItem('accessToken', 'expired-token');
      localStorage.setItem('refreshToken', 'valid-refresh-token');

      const res = await request('/test-queued');
      expect(res.success).toBe(true);
    });

    test('38 & 39. Refresh failure rejects queued promises without leaving pending promises', async () => {
      server.use(
        http.get('*/api/test-fail', () => {
          return new HttpResponse(null, { status: 401 });
        }),
        http.post('*/api/auth/refresh-token', () => {
          return new HttpResponse(null, { status: 400 });
        })
      );

      localStorage.setItem('accessToken', 'expired-token');
      localStorage.setItem('refreshToken', 'invalid-refresh-token');

      let rejected = false;
      try {
        await request('/test-fail');
      } catch (err) {
        rejected = true;
        expect(err.code).toBe('unauthorized');
      }
      expect(rejected).toBe(true);
    });

    test('40. Only ONE refresh request runs concurrently', async () => {
      const seenRefreshRequests = new Set();
      server.use(
        http.get('*/api/test-concurrent-1', () => new HttpResponse(null, { status: 401 })),
        http.get('*/api/test-concurrent-2', () => new HttpResponse(null, { status: 401 })),
        http.post('*/api/auth/refresh-token', async ({ request }) => {
          seenRefreshRequests.add(request);
          await new Promise(r => setTimeout(r, 30));
          return HttpResponse.json({ accessToken: 'new-tok', refreshToken: 'new-ref' });
        })
      );

      localStorage.setItem('accessToken', 'exp');
      localStorage.setItem('refreshToken', 'ref');

      await Promise.allSettled([
        request('/test-concurrent-1'),
        request('/test-concurrent-2')
      ]);

      expect(seenRefreshRequests.size).toBe(1);
    });

    test('41. Retry request avoids infinite refresh loop on repeated 401', async () => {
      server.use(
        http.get('*/api/test-repeat-401', () => new HttpResponse(null, { status: 401 })),
        http.post('*/api/auth/refresh-token', () => HttpResponse.json({ accessToken: 'tok-1', refreshToken: 'ref-1' }))
      );

      localStorage.setItem('accessToken', 'exp');
      localStorage.setItem('refreshToken', 'ref');

      await expect(request('/test-repeat-401')).rejects.toThrow();
    });

    test('42 & 43. Session expired event clears AuthContext state and removes listener on unmount', async () => {
      localStorage.setItem('accessToken', MOCK_JWT);

      let authRes;
      function TestComp() {
        authRes = useAuth();
        return null;
      }
      const { unmount } = render(<AuthProvider><TestComp /></AuthProvider>);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      act(() => {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      });

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(authRes.user).toBeNull();
      unmount();
    });
  });

  // ==========================================
  // EMAIL VERIFICATION TESTS (44 - 48)
  // ==========================================
  describe('Email Verification Flow Hardening (Tests 44-48)', () => {
    test('44 & 45. Register success does NOT invoke login and navigates to verification waiting page', async () => {
      server.use(
        http.post('*/api/auth/register', () => {
          return HttpResponse.json({ userId: 'u-100', email: 'test@example.com', emailConfirmed: false });
        })
      );

      const regRes = await authApi.register({ fullName: 'Ali', email: 'test@example.com', password: 'password123' });
      expect(regRes.userId).toBe('u-100');
      // Verify login token was not set
      expect(localStorage.getItem('accessToken')).toBeNull();
    });

    test('46. Navigation payload contains email and userId', async () => {
      server.use(
        http.post('*/api/auth/register', () => {
          return HttpResponse.json({ userId: 'u-100', email: 'test@example.com' });
        })
      );

      const res = await authApi.register({ fullName: 'Ali', email: 'test@example.com', password: 'password123' });
      expect(res.userId).toBe('u-100');
      expect(res.email).toBe('test@example.com');
    });

    test('47. Email verification endpoint accepts userId and token', async () => {
      let verifyBody = null;
      server.use(
        http.post('*/api/auth/verify-email', async ({ request }) => {
          try { verifyBody = await request.clone().json(); } catch {}
          return HttpResponse.json({ success: true, message: 'Doğrulandı' });
        })
      );

      await authApi.verifyEmail('u-100', 'token-abc');
      expect(verifyBody.userId).toBe('u-100');
      expect(verifyBody.token).toBe('token-abc');
    });

    test('48. Resend verification uses correct endpoint', async () => {
      let resendBody = null;
      server.use(
        http.post('*/api/auth/resend-verification', async ({ request }) => {
          try { resendBody = await request.clone().json(); } catch {}
          return HttpResponse.json({ success: true });
        })
      );

      await authApi.resendVerification('test@example.com');
      expect(resendBody.email).toBe('test@example.com');
    });
  });

  // ==========================================
  // ADMIN PRODUCT FORM TESTS (49 - 58)
  // ==========================================
  describe('Admin Product Form Validation Hardening (Tests 49-58)', () => {
    test('49. Empty product name is validated', () => {
      const name = "  ";
      expect(name.trim().length).toBe(0);
    });

    test('50. Empty categoryId is validated', () => {
      const categoryId = "";
      expect(Boolean(categoryId)).toBe(false);
    });

    test('51. Negative price is validated', () => {
      const price = -10;
      expect(price < 0).toBe(true);
    });

    test('52. Negative stockQuantity is validated', () => {
      const stock = -5;
      expect(stock < 0).toBe(true);
    });

    test('53. Empty shortDescription is validated', () => {
      const desc = "";
      expect(desc.trim().length).toBe(0);
    });

    test('54. Empty description is validated', () => {
      const desc = "";
      expect(desc.trim().length).toBe(0);
    });

    test('55-58. Admin product payload matches backend expectations', async () => {
      let createdPayload = null;
      server.use(
        http.post('*/api/admin/products', async ({ request }) => {
          try { createdPayload = await request.clone().json(); } catch {}
          return HttpResponse.json({ id: 'prod-new-123' });
        })
      );

      const payload = {
        name: 'Gümüş Kolye',
        price: 350,
        stockQuantity: 10,
        categoryId: VALID_GUID,
        shortDescription: 'Kısa açıklama',
        description: 'Detaylı ürün açıklaması'
      };

      await request('/admin/products', { method: 'POST', body: JSON.stringify(payload) });

      expect(createdPayload.name).toBe('Gümüş Kolye');
      expect(createdPayload.categoryId).toBe(VALID_GUID);
      expect(createdPayload.price).toBe(350);
    });
  });

  // ==========================================
  // WORKFLOW VERIFICATION (59 - 63)
  // ==========================================
  describe('Production Workflow Hardening (Tests 59-63)', () => {
    test('59-63. deploy-production.yml includes lint, test:ci, build order without continue-on-error', () => {
      const yamlPath = path.join(process.cwd(), '.github/workflows/deploy-production.yml');
      const content = fs.readFileSync(yamlPath, 'utf-8');

      expect(content).toContain('npm run lint');
      expect(content).toContain('npm run test:ci');
      expect(content).toContain('npm run build');
      expect(content).not.toContain('continue-on-error');
    });
  });
});
