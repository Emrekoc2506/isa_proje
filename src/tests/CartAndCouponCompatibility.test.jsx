import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import * as cartApi from '../services/cartApi';
import * as couponApi from '../services/couponApi';
import { CartProvider, useCart } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import CouponsSection from '../pages/AdminPage/sections/CouponsSection';

const server = setupServer(
  http.get('*/api/auth/me', () => {
    return HttpResponse.json({ id: 'user-1', email: 'test@example.com', fullName: 'Test User' });
  }),
  http.get('*/api/cart', () => {
    return HttpResponse.json({
      id: 'cart-1',
      totalQuantity: 2,
      subtotal: 300,
      items: [
        {
          id: 'item-101',
          cartItemId: 'item-101',
          productId: '00000000-0000-0000-0000-000000000001',
          productName: 'Tılsımlı Kolye',
          unitPrice: 150,
          quantity: 2,
          imageUrl: '/kolye.jpg'
        }
      ]
    });
  }),
  http.get('*/api/admin/coupons', () => {
    return HttpResponse.json([
      { id: 'c1', code: 'YUZDE20', discountType: 0, discountValue: 20, isPercentage: true, isActive: true },
      { id: 'c2', code: 'TUTAR50', discountType: 1, discountValue: 50, isPercentage: false, isActive: true }
    ]);
  })
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
  localStorage.setItem('accessToken', 'mock-valid-token');
});

afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  localStorage.clear();
});

describe('Cart Delete & Coupon Compatibility Suite (Section 21 Tests)', () => {
  test('Test 1 — Cart remove uses POST /cart/items/{id}/delete (DELETE is NOT called)', async () => {
    let deleteMethodCalled = false;
    let postRemoveCalled = false;
    let targetId = null;

    server.use(
      http.delete('*/api/cart/items/:id', () => {
        deleteMethodCalled = true;
        return HttpResponse.json({ success: false });
      }),
      http.post('*/api/cart/items/:id/delete', ({ params }) => {
        postRemoveCalled = true;
        targetId = params.id;
        return HttpResponse.json({ id: 'cart-1', items: [], totalQuantity: 0, subtotal: 0 });
      })
    );

    const res = await cartApi.removeCartItem('item-101');
    expect(res).toBeDefined();
    expect(deleteMethodCalled).toBe(false);
    expect(postRemoveCalled).toBe(true);
    expect(targetId).toBe('item-101');
  });

  test('Test 2 — Cart update uses POST /cart/items/{id}/update (PATCH is NOT called)', async () => {
    let patchMethodCalled = false;
    let postUpdateCalled = false;

    server.use(
      http.patch('*/api/cart/items/:id', () => {
        patchMethodCalled = true;
        return HttpResponse.json({ success: false });
      }),
      http.post('*/api/cart/items/:id/update', async ({ request }) => {
        postUpdateCalled = true;
        const body = await request.json();
        return HttpResponse.json({
          id: 'cart-1',
          items: [{ id: 'item-101', quantity: body.quantity, unitPrice: 150 }],
          totalQuantity: body.quantity
        });
      })
    );

    const res = await cartApi.updateCartItem('item-101', { quantity: 5 });
    expect(res).toBeDefined();
    expect(patchMethodCalled).toBe(false);
    expect(postUpdateCalled).toBe(true);
  });

  test('Test 3 — Cart clear uses POST /cart/clear (DELETE is NOT called)', async () => {
    let deleteCartCalled = false;
    let postClearCalled = false;

    server.use(
      http.delete('*/api/cart', () => {
        deleteCartCalled = true;
        return HttpResponse.json({ success: false });
      }),
      http.post('*/api/cart/clear', () => {
        postClearCalled = true;
        return HttpResponse.json({ id: 'cart-1', items: [], totalQuantity: 0, subtotal: 0 });
      })
    );

    const res = await cartApi.clearCart();
    expect(res).toBeDefined();
    expect(deleteCartCalled).toBe(false);
    expect(postClearCalled).toBe(true);
  });

  test('Test 4 — Cart delete failure retains item in UI and sets cartError without optimistic removal', async () => {
    server.use(
      http.post('*/api/cart/items/:id/delete', () => {
        return new HttpResponse(JSON.stringify({ message: "Ürün sepetten kaldırılamadı." }), { status: 500 });
      })
    );

    let testCart = null;
    function TestComponent() {
      testCart = useCart();
      return (
        <div>
          <span data-testid="cart-count">{testCart.items.length}</span>
          <button data-testid="remove-btn" onClick={() => testCart.removeFromCart('item-101')}>Remove</button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <CartProvider>
          <TestComponent />
        </CartProvider>
      </AuthProvider>
    );

    await act(async () => {
      await new Promise(r => setTimeout(r, 200));
    });

    expect(screen.getByTestId('cart-count').textContent).toBe('1');

    await act(async () => {
      fireEvent.click(screen.getByTestId('remove-btn'));
    });

    expect(screen.getByTestId('cart-count').textContent).toBe('1');
    expect(testCart.cartError).toBeDefined();
  });

  test('Test 5 — Percentage coupon payload uses discountType = 0 and discountValue', async () => {
    let sentBody = null;
    server.use(
      http.post('*/api/admin/coupons', async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ id: 'c10', ...sentBody });
      })
    );

    await couponApi.createAdminCoupon({
      code: 'YUZDE20',
      isPercentage: true,
      discountPercentage: 20
    });

    expect(sentBody).toBeDefined();
    expect(sentBody.discountType).toBe(0);
    expect(sentBody.discountValue).toBe(20);
  });

  test('Test 6 — Fixed amount coupon payload uses discountType = 1 and discountValue', async () => {
    let sentBody = null;
    server.use(
      http.post('*/api/admin/coupons', async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ id: 'c11', ...sentBody });
      })
    );

    await couponApi.createAdminCoupon({
      code: 'TUTAR200',
      isPercentage: false,
      discountAmount: 200
    });

    expect(sentBody).toBeDefined();
    expect(sentBody.discountType).toBe(1);
    expect(sentBody.discountValue).toBe(200);
  });

  test('Test 7 — Free shipping coupon payload uses discountType = 2', async () => {
    let sentBody = null;
    server.use(
      http.post('*/api/admin/coupons', async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ id: 'c12', ...sentBody });
      })
    );

    await couponApi.createAdminCoupon({
      code: 'KARGOFREEE',
      isFreeShipping: true
    });

    expect(sentBody).toBeDefined();
    expect(sentBody.discountType).toBe(2);
    expect(sentBody.isFreeShipping).toBe(true);
  });

  test('Test 8 — Coupon create success triggers backend list refresh', async () => {
    let fetchCount = 0;
    server.use(
      http.get('*/api/admin/coupons', () => {
        fetchCount++;
        return HttpResponse.json([
          { id: 'c1', code: 'TEST1', discountType: 0, discountValue: 10, isActive: true }
        ]);
      }),
      http.post('*/api/admin/coupons', () => {
        return HttpResponse.json({ id: 'c1', code: 'TEST1', discountType: 0 });
      })
    );

    render(
      <MemoryRouter>
        <ThemeProvider>
          <CouponsSection />
        </ThemeProvider>
      </MemoryRouter>
    );

    await act(async () => {
      await new Promise(r => setTimeout(r, 200));
    });

    const initialFetches = fetchCount;

    await act(async () => {
      fireEvent.click(screen.getByText('Yeni Kupon Ekle'));
    });

    const codeInput = screen.getByPlaceholderText('ÖRN: MISTIK20');
    fireEvent.change(codeInput, { target: { value: 'YENİKUPON' } });

    const percentInput = screen.getByPlaceholderText('Örn: 20');
    fireEvent.change(percentInput, { target: { value: '15' } });

    const nextBtn = screen.getByText('İleri');
    await act(async () => {
      fireEvent.click(nextBtn);
      await new Promise(r => setTimeout(r, 100));
    });

    const submitBtn = screen.getByText('Kuponu Oluştur');
    await act(async () => {
      fireEvent.click(submitBtn);
      await new Promise(r => setTimeout(r, 100));
    });

    expect(fetchCount).toBeGreaterThan(initialFetches);
  });

  test('Test 9 — Coupon create failure does not add fake local coupon', async () => {
    server.use(
      http.post('*/api/admin/coupons', () => {
        return new HttpResponse(JSON.stringify({ message: "Kupon kodu zaten mevcut." }), { status: 400 });
      })
    );

    render(
      <MemoryRouter>
        <ThemeProvider>
          <CouponsSection />
        </ThemeProvider>
      </MemoryRouter>
    );

    await act(async () => {
      await new Promise(r => setTimeout(r, 200));
    });

    const initialCoupons = screen.getAllByRole('row').length;

    await act(async () => {
      fireEvent.click(screen.getByText('Yeni Kupon Ekle'));
    });

    const codeInput = screen.getByPlaceholderText('ÖRN: MISTIK20');
    fireEvent.change(codeInput, { target: { value: 'MEVCUTKOD' } });

    const percentInput = screen.getByPlaceholderText('Örn: 20');
    fireEvent.change(percentInput, { target: { value: '10' } });

    const nextBtn = screen.getByText('İleri');
    await act(async () => {
      fireEvent.click(nextBtn);
      await new Promise(r => setTimeout(r, 100));
    });

    const submitBtn = screen.getByText('Kuponu Oluştur');
    await act(async () => {
      fireEvent.click(submitBtn);
      await new Promise(r => setTimeout(r, 100));
    });

    expect(screen.getAllByRole('row').length).toBe(initialCoupons);
  });

  test('Test 10 — Coupon update, status, and delete use POST endpoints', async () => {
    let updateCalled = false;
    let statusCalled = false;
    let deleteCalled = false;

    server.use(
      http.put('*/api/admin/coupons/:id', () => {
        return HttpResponse.json({ success: false });
      }),
      http.patch('*/api/admin/coupons/:id/status', () => {
        return HttpResponse.json({ success: false });
      }),
      http.delete('*/api/admin/coupons/:id', () => {
        return HttpResponse.json({ success: false });
      }),
      http.post('*/api/admin/coupons/:id/update', () => {
        updateCalled = true;
        return HttpResponse.json({ success: true });
      }),
      http.post('*/api/admin/coupons/:id/status', async ({ request }) => {
        statusCalled = true;
        const body = await request.clone().json();
        return HttpResponse.json({ id: 'c1', isActive: body.isActive });
      }),
      http.post('*/api/admin/coupons/:id/delete', async ({ request }) => {
        deleteCalled = true;
        const body = await request.clone().json();
        expect(body.confirm).toBe(true);
        return HttpResponse.json({ success: true });
      })
    );

    await couponApi.updateAdminCoupon('c1', { code: 'GUNCEL', discountType: 0, discountValue: 30 });
    await couponApi.updateAdminCouponStatus('c1', false);
    await couponApi.deleteAdminCoupon('c1');

    expect(updateCalled).toBe(true);
    expect(statusCalled).toBe(true);
    expect(deleteCalled).toBe(true);
  });
});
