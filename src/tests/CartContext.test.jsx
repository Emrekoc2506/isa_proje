import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('https://localhost:7148/api/cart', () => {
    return HttpResponse.json({
      items: [
        { id: 'cart-item-1', productId: 'p1', variantId: 'v1', quantity: 2, productName: 'Gumus Kolye', unitPrice: 250 }
      ],
      totalAmount: 500
    });
  }),
  http.post('https://localhost:7148/api/cart/items', () => {
    return HttpResponse.json({
      items: [
        { id: 'cart-item-1', productId: 'p1', variantId: 'v1', quantity: 2, productName: 'Gumus Kolye', unitPrice: 250 },
        { id: 'cart-item-new', productId: 'p1', variantId: null, quantity: 1, productName: 'Gumus Kolye 2', unitPrice: 250 }
      ]
    });
  }),
  http.post('https://localhost:7148/api/cart/merge', () => {
    return HttpResponse.json({ items: [] });
  }),
  http.delete('https://localhost:7148/api/cart/items/cart-item-1', () => {
    return new HttpResponse(null, { status: 204 });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function CartTestComponent() {
  const { items, totalPrice, addToCart, removeFromCart } = useCart();
  return (
    <div>
      <span data-testid="cart-count">{items.length}</span>
      <span data-testid="cart-total">{totalPrice}</span>
      <button onClick={() => addToCart({ id: 'p1' }, 1, null)} data-testid="btn-add">Add</button>
      <button onClick={() => removeFromCart('cart-item-1')} data-testid="btn-remove">Remove</button>
    </div>
  );
}

describe('CartContext Tests', () => {
  test('should load items from server', async () => {
    localStorage.setItem('accessToken', 'mock-token');

    render(
      <AuthProvider>
        <CartProvider>
          <CartTestComponent />
        </CartProvider>
      </AuthProvider>
    );

    await act(async () => {
      await new Promise(r => setTimeout(r, 100));
    });

    expect(screen.getByTestId('cart-count').textContent).toBe('1');
    expect(screen.getByTestId('cart-total').textContent).toBe('500');
  });

  test('should handle item additions', async () => {
    localStorage.setItem('accessToken', 'mock-token');

    render(
      <AuthProvider>
        <CartProvider>
          <CartTestComponent />
        </CartProvider>
      </AuthProvider>
    );

    await act(async () => {
      await new Promise(r => setTimeout(r, 100));
    });

    const addBtn = screen.getByTestId('btn-add');
    await act(async () => {
      addBtn.click();
      await new Promise(r => setTimeout(r, 50));
    });

    expect(screen.getByTestId('cart-count').textContent).toBe('2');
  });
});
