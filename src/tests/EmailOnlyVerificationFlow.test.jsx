import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthPage from '../pages/AuthPage/AuthPage';
import EmailWaitingPage from '../pages/EmailVerifyPage/EmailWaitingPage';
import EmailVerifyPage from '../pages/EmailVerifyPage/EmailVerifyPage';
import { AuthProvider, useAuth } from '../context/AuthContext';
import * as authApi from '../services/authApi';

vi.mock('../services/authApi', async () => {
  const actual = await vi.importActual('../services/authApi');
  return {
    ...actual,
    login: vi.fn(),
    register: vi.fn(),
    resendVerification: vi.fn(),
    verifyEmail: vi.fn(),
    me: vi.fn(),
    refreshToken: vi.fn(),
    getSessionState: vi.fn(),
    logout: vi.fn()
  };
});

const MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1MjQ2MDgwMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

describe('Email Only Verification Flow & Roles Hardening Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('1. Register sends phoneNumber to backend, triggers NO SMS/OTP, and does NOT auto-login', async () => {
    authApi.register.mockResolvedValueOnce({ userId: 'user-xyz-123' });

    let currentPath = '/uye-ol';
    const TestNavigationWrapper = () => (
      <MemoryRouter initialEntries={['/uye-ol']}>
        <AuthProvider>
          <Routes>
            <Route path="/uye-ol" element={<AuthPage />} />
            <Route
              path="/email-dogrulama-bekleniyor"
              element={<div data-testid="waiting-page">Waiting Page</div>}
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    render(<TestNavigationWrapper />);

    // Switch to Register tab
    const registerTab = screen.getByRole('tab', { name: /Üye Ol/i });
    fireEvent.click(registerTab);

    // Wait for animation to reveal register form
    const nameInput = await screen.findByLabelText(/Ad Soyad/i);
    fireEvent.change(nameInput, { target: { value: 'Kemal Sunal' } });
    fireEvent.change(screen.getByLabelText(/^E-posta$/i), { target: { value: 'kemal@sunal.com' } });
    fireEvent.change(screen.getByLabelText(/Telefon Numarası/i), { target: { value: '05421234567' } });
    fireEvent.change(screen.getByLabelText(/^Şifre$/i), { target: { value: 'Secret123*' } });
    fireEvent.change(screen.getByLabelText(/Şifre Tekrar/i), { target: { value: 'Secret123*' } });

    const submitBtn = screen.getByRole('button', { name: /Üye Ol/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledTimes(1);
    });

    expect(authApi.register).toHaveBeenCalledWith({
      fullName: 'Kemal Sunal',
      email: 'kemal@sunal.com',
      phoneNumber: '5421234567',
      password: 'Secret123*'
    });

    // Verify user is NOT auto-logged in
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('has_logged_in')).toBeNull();

    // Verify redirected to email waiting page
    await waitFor(() => {
      expect(screen.getByTestId('waiting-page')).toBeInTheDocument();
    });
  });

  it('2. EmailWaitingPage displays email prompt and resend button calls resendVerification', async () => {
    authApi.resendVerification.mockResolvedValueOnce({ success: true });

    render(
      <MemoryRouter initialEntries={[{ pathname: '/email-dogrulama-bekleniyor', state: { email: 'kemal@sunal.com' } }]}>
        <EmailWaitingPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/kemal@sunal.com/i)).toBeInTheDocument();
    expect(screen.getByText(/adresine bir doğrulama e-postası gönderdik/i)).toBeInTheDocument();

    const resendBtn = screen.getByRole('button', { name: /Tekrar E-posta Gönder/i });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(authApi.resendVerification).toHaveBeenCalledWith('kemal@sunal.com');
      expect(screen.getByText(/Yeni doğrulama bağlantısı e-postanıza gönderildi/i)).toBeInTheDocument();
    });
  });

  it('3. EmailVerifyPage calls verifyEmail with userId and token from search params and does not auto-login', async () => {
    authApi.verifyEmail.mockResolvedValueOnce({ success: true });

    render(
      <MemoryRouter initialEntries={['/email-dogrula?userId=u-123&token=verify-tok-456']}>
        <EmailVerifyPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(authApi.verifyEmail).toHaveBeenCalledWith('u-123', 'verify-tok-456');
      expect(screen.getByText(/E-posta Doğrulandı!/i)).toBeInTheDocument();
      expect(screen.getByText(/Hesabınız başarıyla aktifleştirildi. Artık giriş yapabilirsiniz./i)).toBeInTheDocument();
    });

    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('4. Login with email_not_confirmed redirects to /email-dogrulama-bekleniyor', async () => {
    authApi.login.mockRejectedValueOnce({
      code: 'email_not_confirmed',
      message: 'Email not confirmed'
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/giris']}>
        <AuthProvider>
          <Routes>
            <Route path="/giris" element={<AuthPage />} />
            <Route
              path="/email-dogrulama-bekleniyor"
              element={<div data-testid="waiting-redirected">Waiting Screen</div>}
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = container.querySelector('#login-email');
    const passwordInput = container.querySelector('#login-password');
    fireEvent.change(emailInput, { target: { value: 'unconfirmed@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Secret123*' } });

    const submitBtn = screen.getByRole('button', { name: /Giriş Yap/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/E-posta adresiniz henüz doğrulanmamış/i)).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(screen.getByTestId('waiting-redirected')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('5. Admin login navigates to /admin without roles ReferenceError', async () => {
    authApi.login.mockResolvedValueOnce({
      accessToken: MOCK_JWT,
      refreshToken: 'refresh-admin',
      user: {
        id: 'admin-1',
        email: 'admin@muhristan.com',
        roles: ['Admin']
      }
    });
    authApi.me.mockResolvedValueOnce({
      id: 'admin-1',
      email: 'admin@muhristan.com',
      roles: ['Admin']
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/giris']}>
        <AuthProvider>
          <Routes>
            <Route path="/giris" element={<AuthPage />} />
            <Route path="/admin" element={<div data-testid="admin-dashboard">Admin Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = container.querySelector('#login-email');
    const passwordInput = container.querySelector('#login-password');
    fireEvent.change(emailInput, { target: { value: 'admin@muhristan.com' } });
    fireEvent.change(passwordInput, { target: { value: 'AdminPassword123*' } });

    const submitBtn = screen.getByRole('button', { name: /Giriş Yap/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });

    expect(localStorage.getItem('has_logged_in')).toBe('1');
  });

  it('6. Regular Customer login navigates to / without roles ReferenceError', async () => {
    authApi.login.mockResolvedValueOnce({
      accessToken: MOCK_JWT,
      refreshToken: 'refresh-cust',
      user: {
        id: 'cust-1',
        email: 'cust@muhristan.com',
        roles: ['Customer']
      }
    });
    authApi.me.mockResolvedValueOnce({
      id: 'cust-1',
      email: 'cust@muhristan.com',
      roles: ['Customer']
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/giris']}>
        <AuthProvider>
          <Routes>
            <Route path="/giris" element={<AuthPage />} />
            <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = container.querySelector('#login-email');
    const passwordInput = container.querySelector('#login-password');
    fireEvent.change(emailInput, { target: { value: 'cust@muhristan.com' } });
    fireEvent.change(passwordInput, { target: { value: 'CustPassword123*' } });

    const submitBtn = screen.getByRole('button', { name: /Giriş Yap/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    expect(localStorage.getItem('has_logged_in')).toBe('1');
  });
});
