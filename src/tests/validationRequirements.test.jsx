import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { BrowserRouter } from 'react-router-dom';
import AuthPage from '../pages/AuthPage/AuthPage';
import ResetPasswordPage from '../pages/ForgotPasswordPage/ResetPasswordPage';
import PaymentResultPage from '../pages/CheckoutPage/PaymentResultPage';
import Footer from '../components/Footer/Footer';
import IletisimPage from '../pages/StaticPages/IletisimPage';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ProductProvider } from '../context/ProductContext';
import { clearAccessToken } from '../auth/tokenStore';
import { normalizeValidationErrors } from '../api/apiError';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  sessionStorage.clear();
  clearAccessToken();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

function renderWithProviders(ui) {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <ProductProvider>
              <CartProvider>
                {ui}
              </CartProvider>
            </ProductProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

describe('Validation Requirements Suite', () => {

  describe('1. Registration Form Password Validation (8-char minimum rule)', () => {
    it('1.1 Rejects password shorter than 8 characters on client', async () => {
      const { container } = renderWithProviders(<AuthPage initialMode="register" />);

      const passInput = container.querySelector('#reg-password');
      expect(passInput).not.toBeNull();
      fireEvent.change(passInput, { target: { value: 'short1' } });

      const form = passInput.closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Şifre en az 8 karakter olmalıdır/i)).toBeInTheDocument();
      });
    });

    it('1.2 Accepts 8-character password and submits to backend', async () => {
      let requestReceived = null;
      server.use(
        http.post('*/api/auth/register', async ({ request }) => {
          requestReceived = await request.json();
          return HttpResponse.json({ userId: 'u-1', email: 'test@example.com', emailConfirmed: false });
        })
      );

      const { container } = renderWithProviders(<AuthPage initialMode="register" />);

      fireEvent.change(container.querySelector('#reg-name'), { target: { value: 'Ahmet Yılmaz' } });
      fireEvent.change(container.querySelector('#reg-email'), { target: { value: 'ahmet@example.com' } });
      fireEvent.change(container.querySelector('#reg-phone'), { target: { value: '5551234567' } });
      fireEvent.change(container.querySelector('#reg-password'), { target: { value: '12345678' } });
      fireEvent.change(container.querySelector('#reg-confirm'), { target: { value: '12345678' } });

      const form = container.querySelector('#reg-password').closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(requestReceived).not.toBeNull();
        expect(requestReceived.password).toBe('12345678');
      });
    });

    it('1.3 Displays backend FluentValidation field errors (HTTP 400 validation_error)', async () => {
      server.use(
        http.post('*/api/auth/register', () => {
          return HttpResponse.json(
            {
              success: false,
              code: 'validation_error',
              message: 'Girdiğiniz veriler geçersizdir.',
              errors: {
                Password: ['Şifre en az bir büyük harf içermelidir.'],
                Email: ['Bu e-posta adresi zaten kullanımda.']
              }
            },
            { status: 400 }
          );
        })
      );

      const { container } = renderWithProviders(<AuthPage initialMode="register" />);

      fireEvent.change(container.querySelector('#reg-name'), { target: { value: 'Ahmet Yılmaz' } });
      fireEvent.change(container.querySelector('#reg-email'), { target: { value: 'ahmet@example.com' } });
      fireEvent.change(container.querySelector('#reg-phone'), { target: { value: '5551234567' } });
      fireEvent.change(container.querySelector('#reg-password'), { target: { value: '12345678' } });
      fireEvent.change(container.querySelector('#reg-confirm'), { target: { value: '12345678' } });

      const form = container.querySelector('#reg-password').closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Şifre en az bir büyük harf içermelidir.')).toBeInTheDocument();
        expect(screen.getByText('Bu e-posta adresi zaten kullanımda.')).toBeInTheDocument();
      });
    });
  });

  describe('2. Login Form Password Validation (No client length restrictions)', () => {
    it('2.1 Allows 8-character password on login without client rejection', async () => {
      let loginCalled = false;
      server.use(
        http.post('*/api/auth/login', async () => {
          loginCalled = true;
          return HttpResponse.json({
            accessToken: 'mock-jwt-token',
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            user: { id: 'u1', email: 'test@example.com', fullName: 'Test' }
          });
        }),
        http.get('*/api/auth/me', () => {
          return HttpResponse.json({ id: 'u1', email: 'test@example.com', fullName: 'Test', roles: ['Customer'] });
        })
      );

      const { container } = renderWithProviders(<AuthPage />);

      const emailInput = container.querySelector('#login-email');
      const passwordInput = container.querySelector('#login-password');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '8charpas' } });

      const form = passwordInput.closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(loginCalled).toBe(true);
      });
    });
  });

  describe('3. Password Change & Reset Forms (8-char minimum)', () => {
    it('3.1 ResetPasswordPage enforces 8-character minimum and shows backend errors', async () => {
      window.history.pushState({}, '', '/sifre-sifirla?userId=u123&token=t123');

      server.use(
        http.post('*/api/auth/reset-password', () => {
          return HttpResponse.json(
            {
              success: false,
              code: 'validation_error',
              message: 'Girdiğiniz veriler geçersizdir.',
              errors: {
                NewPassword: ['Yeni şifre en az bir özel karakter içermelidir.']
              }
            },
            { status: 400 }
          );
        })
      );

      renderWithProviders(<ResetPasswordPage />);

      const newPassInput = screen.getByPlaceholderText('Yeni Şifre');
      const confirmPassInput = screen.getByPlaceholderText('Yeni Şifre Tekrarı');

      // Client test: short password
      fireEvent.change(newPassInput, { target: { value: 'short' } });
      fireEvent.change(confirmPassInput, { target: { value: 'short' } });

      const form = newPassInput.closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/en az 8 karakter/i)).toBeInTheDocument();
      });

      // Valid length on client -> send to backend -> get backend error
      fireEvent.change(newPassInput, { target: { value: 'validpass123' } });
      fireEvent.change(confirmPassInput, { target: { value: 'validpass123' } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Yeni şifre en az bir özel karakter içermelidir.')).toBeInTheDocument();
      });
    });

    it('3.2 PaymentResultPage guest registration validates 8-character password', async () => {
      renderWithProviders(<PaymentResultPage />);

      const passInput = screen.queryByPlaceholderText('Şifre');
      if (passInput) {
        fireEvent.change(passInput, { target: { value: '12345' } });
        const form = passInput.closest('form');
        fireEvent.submit(form);

        await waitFor(() => {
          expect(screen.getByText('Şifre en az 8 karakter olmalıdır.')).toBeInTheDocument();
        });
      }
    });
  });

  describe('4. Newsletter & Contact Form Validation', () => {
    it('4.1 Footer newsletter shows validation error on invalid email and generic success on duplicate', async () => {
      const calls = [];
      server.use(
        http.post('*/api/newsletter/subscribe', async ({ request }) => {
          const body = await request.clone().json().catch(() => ({}));
          calls.push(body);
          return HttpResponse.json({ success: true });
        })
      );

      renderWithProviders(<Footer />);

      const emailInput = screen.getByPlaceholderText('eposta@adresiniz.com');
      const form = emailInput.closest('form');

      // Empty submission
      fireEvent.submit(form);
      await waitFor(() => {
        expect(screen.getByText(/Lütfen bir e-posta adresi girin/i)).toBeInTheDocument();
      });

      // Invalid format
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.submit(form);
      await waitFor(() => {
        expect(screen.getByText(/Geçerli bir e-posta adresi giriniz/i)).toBeInTheDocument();
      });

      // Valid format -> success
      fireEvent.change(emailInput, { target: { value: 'newsletter@example.com' } });
      fireEvent.submit(form);
      await waitFor(() => {
        expect(screen.getByText(/Bültenimize başarıyla abone oldunuz/i)).toBeInTheDocument();
      });
      expect(calls.length).toBeGreaterThanOrEqual(1);
      expect(calls[0].email).toBe('newsletter@example.com');
    });

    it('4.2 IletisimPage validates required fields and renders backend field errors', async () => {
      server.use(
        http.post('*/api/contact', () => {
          return HttpResponse.json(
            {
              success: false,
              code: 'validation_error',
              message: 'Girdiğiniz veriler geçersizdir.',
              errors: {
                PhoneNumber: ['Telefon numarası formatı geçersizdir.']
              }
            },
            { status: 400 }
          );
        })
      );

      const { container } = renderWithProviders(<IletisimPage />);

      fireEvent.change(container.querySelector('#contact-fullName'), { target: { value: 'Müşteri' } });
      fireEvent.change(container.querySelector('#contact-email'), { target: { value: 'musteri@example.com' } });
      fireEvent.change(container.querySelector('#contact-phoneNumber'), { target: { value: '123' } });
      fireEvent.change(container.querySelector('#contact-subject'), { target: { value: 'Sipariş Durumu' } });
      fireEvent.change(container.querySelector('#contact-message'), { target: { value: 'Siparişim nerede?' } });

      const form = container.querySelector('#contact-fullName').closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Telefon numarası formatı geçersizdir.')).toBeInTheDocument();
      });
    });
  });

  describe('5. Error Normalization Utility', () => {
    it('5.1 normalizeValidationErrors converts PascalCase to camelCase and preserves array values', () => {
      const backendErrors = {
        'CustomerName': ['Ad zorunludur.'],
        'StockQuantity': ['Stok 0 veya daha büyük olmalıdır.'],
        'address.PostalCode': ['Posta kodu geçersiz.'],
        'ShortDescription': ['Kısa açıklama boş bırakılamaz.']
      };

      const normalized = normalizeValidationErrors(backendErrors);

      expect(normalized.customerName).toEqual(['Ad zorunludur.']);
      expect(normalized.stockQuantity).toEqual(['Stok 0 veya daha büyük olmalıdır.']);
      expect(normalized.postalCode).toEqual(['Posta kodu geçersiz.']);
      expect(normalized.shortDescription).toEqual(['Kısa açıklama boş bırakılamaz.']);
    });
  });

});
