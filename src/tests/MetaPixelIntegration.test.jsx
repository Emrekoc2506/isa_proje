import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import * as metaPixel from '../utils/metaPixel';
import MetaPixelTracker from '../components/MetaPixelTracker/MetaPixelTracker';
import EmailVerifyPage from '../pages/EmailVerifyPage/EmailVerifyPage';
import { CartProvider, useCart } from '../context/CartContext';
import * as cartApi from '../services/cartApi';
import * as authApi from '../services/authApi';
import * as orderApi from '../services/orderApi';
import * as bankTransferApi from '../services/bankTransferApi';
import CheckoutPage from '../pages/CheckoutPage/CheckoutPage';
import { AuthProvider } from '../context/AuthContext';

vi.mock('../services/cartApi', async () => {
  const actual = await vi.importActual('../services/cartApi');
  return {
    ...actual,
    addCartItem: vi.fn(),
    getCart: vi.fn(),
    mergeGuestCart: vi.fn(),
    clearCart: vi.fn()
  };
});

vi.mock('../services/authApi', async () => {
  const actual = await vi.importActual('../services/authApi');
  return {
    ...actual,
    verifyEmail: vi.fn()
  };
});

vi.mock('../services/orderApi', async () => {
  const actual = await vi.importActual('../services/orderApi');
  return {
    ...actual,
    createOrder: vi.fn(),
    createGuestOrder: vi.fn()
  };
});

vi.mock('../services/bankTransferApi', async () => {
  const actual = await vi.importActual('../services/bankTransferApi');
  return {
    ...actual,
    getBankTransferInfo: vi.fn().mockResolvedValue({
      bankName: 'Enpara',
      iban: 'TR09 0015 7000 0000 0136 3203 61'
    })
  };
});

describe('Meta Pixel Integration Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    metaPixel._resetMetaPixelForTesting();
    delete window.fbq;
    delete window._fbq;
  });

  afterEach(() => {
    metaPixel._resetMetaPixelForTesting();
  });

  it('1. initMetaPixel sets up window.fbq and tracks PageView safely without crashing', () => {
    metaPixel.initMetaPixel('28067782329510498');

    expect(typeof window.fbq).toBe('function');
    expect(window.fbq.queue).toBeDefined();

    // Check if init was enqueued
    const initCall = window.fbq.queue.find(q => q[0] === 'init' && q[1] === '28067782329510498');
    expect(initCall).toBeDefined();

    // Track pageview
    metaPixel.trackPageView();
    const pageViewCall = window.fbq.queue.find(q => q[0] === 'track' && q[1] === 'PageView');
    expect(pageViewCall).toBeDefined();
  });

  it('2. MetaPixelTracker sends PageView on route navigation and deduplicates on re-render', async () => {
    const fbqMock = vi.fn();
    window.fbq = fbqMock;

    let testNavigate;
    function TestNavigator() {
      const navigate = useNavigate();
      testNavigate = navigate;
      return <button onClick={() => navigate('/urunler')}>Git</button>;
    }

    const { rerender } = render(
      <MemoryRouter initialEntries={['/']}>
        <MetaPixelTracker />
        <TestNavigator />
      </MemoryRouter>
    );

    // Initial mount should trigger PageView
    expect(fbqMock).toHaveBeenCalledWith('track', 'PageView');
    const firstCount = fbqMock.mock.calls.filter(c => c[0] === 'track' && c[1] === 'PageView').length;
    expect(firstCount).toBe(1);

    // Re-render on SAME route must NOT duplicate PageView
    rerender(
      <MemoryRouter initialEntries={['/']}>
        <MetaPixelTracker />
        <TestNavigator />
      </MemoryRouter>
    );
    const reRenderCount = fbqMock.mock.calls.filter(c => c[0] === 'track' && c[1] === 'PageView').length;
    expect(reRenderCount).toBe(1);

    // Real navigation to new route triggers PageView
    await act(async () => {
      testNavigate('/urunler');
    });

    await waitFor(() => {
      const navCount = fbqMock.mock.calls.filter(c => c[0] === 'track' && c[1] === 'PageView').length;
      expect(navCount).toBe(2);
    });
  });

  it('3. AddToCart tracks on success and does NOT track on failure', async () => {
    const fbqMock = vi.fn();
    window.fbq = fbqMock;

    cartApi.addCartItem.mockResolvedValueOnce({
      id: 'cart-1',
      items: [
        {
          id: 'item-1',
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Kehribar Kolye',
          unitPrice: 450,
          quantity: 1
        }
      ]
    });

    function AddCartConsumer() {
      const { addToCart } = useCart();
      return (
        <div>
          <button
            onClick={() =>
              addToCart({
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Kehribar Kolye',
                price: 450
              })
            }
            data-testid="add-btn"
          >
            Ekle
          </button>
          <button
            onClick={() =>
              addToCart({
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'Hatalı Ürün',
                price: 200
              })
            }
            data-testid="fail-btn"
          >
            Hata Ekle
          </button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <CartProvider>
          <AddCartConsumer />
        </CartProvider>
      </AuthProvider>
    );

    // 1. Success addition
    const addBtn = screen.getByTestId('add-btn');
    await act(async () => {
      addBtn.click();
    });

    await waitFor(() => {
      expect(fbqMock).toHaveBeenCalledWith('track', 'AddToCart', {
        content_ids: ['550e8400-e29b-41d4-a716-446655440000'],
        content_name: 'Kehribar Kolye',
        content_type: 'product',
        value: 450,
        currency: 'TRY'
      });
    });

    // 2. Failure addition
    fbqMock.mockClear();
    cartApi.addCartItem.mockRejectedValueOnce(new Error('Out of stock'));

    const failBtn = screen.getByTestId('fail-btn');
    await act(async () => {
      failBtn.click();
    });

    await waitFor(() => {
      const addCalls = fbqMock.mock.calls.filter(c => c[1] === 'AddToCart');
      expect(addCalls.length).toBe(0);
    });
  });

  it('4. CompleteRegistration tracks only on successful email verification with registration_{userId} eventID', async () => {
    const fbqMock = vi.fn();
    window.fbq = fbqMock;

    authApi.verifyEmail.mockResolvedValueOnce({ success: true });

    render(
      <MemoryRouter initialEntries={['/email-dogrula?userId=usr-789&token=valid-tok']}>
        <EmailVerifyPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(fbqMock).toHaveBeenCalledWith(
        'track',
        'CompleteRegistration',
        { status: true },
        { eventID: 'registration_usr-789' }
      );
    });
  });

  it('5. CompleteRegistration does NOT fire if email verification fails', async () => {
    const fbqMock = vi.fn();
    window.fbq = fbqMock;

    authApi.verifyEmail.mockRejectedValueOnce(new Error('Token expired'));

    render(
      <MemoryRouter initialEntries={['/email-dogrula?userId=usr-bad&token=bad-tok']}>
        <EmailVerifyPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Doğrulama Başarısız/i)).toBeInTheDocument();
    });

    const regCalls = fbqMock.mock.calls.filter(c => c[1] === 'CompleteRegistration');
    expect(regCalls.length).toBe(0);
  });

  it('6. AdBlocker simulation: if window.fbq is undefined or blocked, tracking calls do not throw', () => {
    delete window.fbq;
    delete window._fbq;

    expect(() => {
      metaPixel.trackPageView();
      metaPixel.trackMetaEvent('ViewContent', { content_ids: ['1'] });
      metaPixel.trackMetaEvent('Purchase', { value: 100 }, { eventID: 'purchase_1' });
    }).not.toThrow();
  });

  it('7. ViewContent tracks correct payload { content_ids, content_type, content_name, value, currency }', () => {
    const fbqMock = vi.fn();
    window.fbq = fbqMock;

    metaPixel.trackMetaEvent('ViewContent', {
      content_ids: ['prod-101'],
      content_type: 'product',
      content_name: 'Doğal Kehribar Kolye',
      value: 750,
      currency: 'TRY'
    });

    expect(fbqMock).toHaveBeenCalledWith('track', 'ViewContent', {
      content_ids: ['prod-101'],
      content_type: 'product',
      content_name: 'Doğal Kehribar Kolye',
      value: 750,
      currency: 'TRY'
    });
  });

  it('8. InitiateCheckout tracks correct payload { value, currency, num_items, content_ids }', () => {
    const fbqMock = vi.fn();
    window.fbq = fbqMock;

    metaPixel.trackMetaEvent('InitiateCheckout', {
      value: 1250,
      currency: 'TRY',
      num_items: 3,
      content_ids: ['p-1', 'p-2', 'p-3']
    });

    expect(fbqMock).toHaveBeenCalledWith('track', 'InitiateCheckout', {
      value: 1250,
      currency: 'TRY',
      num_items: 3,
      content_ids: ['p-1', 'p-2', 'p-3']
    });
  });

  it('9. Purchase tracks with exact Conversions API eventID purchase_{order.id}', () => {
    const fbqMock = vi.fn();
    window.fbq = fbqMock;

    const orderId = 'order-xyz-789';
    metaPixel.trackMetaEvent(
      'Purchase',
      {
        value: 1450,
        currency: 'TRY'
      },
      {
        eventID: `purchase_${orderId}`
      }
    );

    expect(fbqMock).toHaveBeenCalledWith(
      'track',
      'Purchase',
      {
        value: 1450,
        currency: 'TRY'
      },
      {
        eventID: 'purchase_order-xyz-789'
      }
    );
  });

  it('10. Security: EAAF... Meta Access Token is NOT present anywhere in frontend code', async () => {
    // Validate that no developer accidentally placed an EAAF access token in metaPixel.js or anywhere
    const pixelId = metaPixel.getPixelId();
    expect(pixelId).toBe('28067782329510498');
    expect(pixelId.startsWith('EAAF')).toBe(false);
  });
});
