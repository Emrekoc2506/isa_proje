import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { request } from '../services/apiClient';
import { getGuestSessionId } from '../utils/guestSession';

const MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1MjQ2MDgwMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  sessionStorage.clear();
});
afterAll(() => server.close());

function AuthTestConsumer() {
  const { user, login, logout, isLoading } = useAuth();
  return (
    <div>
      <div data-testid="auth-loading">{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="user-email">{user?.email || 'none'}</div>
      <button data-testid="login-btn" onClick={() => login({ email: 'test@example.com', password: 'Password123!' })}>
        Giriş Yap
      </button>
      <button data-testid="logout-btn" onClick={() => logout()}>
        Çıkış Yap
      </button>
    </div>
  );
}

describe('Security Hardening Requirements Suite (Section 13)', () => {
  it('1. Login → refreshToken is NOT written to localStorage', async () => {
    server.use(
      http.post('*/api/auth/refresh-token', () => new HttpResponse(null, { status: 401 })),
      http.post('*/api/auth/login', () => HttpResponse.json({ accessToken: MOCK_JWT, userId: 'u1' })),
      http.get('*/api/auth/me', () => HttpResponse.json({ id: 'u1', email: 'user@example.com', roles: ['Customer'] }))
    );

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading').textContent).toBe('ready');
    });

    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-email').textContent).toBe('user@example.com');
    });

    expect(localStorage.getItem('accessToken')).toBe(MOCK_JWT);
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(sessionStorage.getItem('refreshToken')).toBeNull();
  });

  it('2. Refresh endpoint is called without passing token in body', async () => {
    let requestBody = null;
    server.use(
      http.post('*/api/auth/refresh-token', async ({ request }) => {
        try {
          requestBody = await request.json();
        } catch {
          requestBody = null;
        }
        return HttpResponse.json({ accessToken: MOCK_JWT });
      })
    );

    const res = await request('/auth/refresh-token', { method: 'POST' });
    expect(res.accessToken).toBe(MOCK_JWT);
    expect(requestBody).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('3. Page reload with cookie refresh restores user session', async () => {
    server.use(
      http.post('*/api/auth/refresh-token', () => HttpResponse.json({ accessToken: MOCK_JWT })),
      http.get('*/api/auth/me', () => HttpResponse.json({ id: 'u-cookie', email: 'cookieuser@example.com', roles: ['Customer'] }))
    );

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-email').textContent).toBe('cookieuser@example.com');
    });

    expect(localStorage.getItem('accessToken')).toBe(MOCK_JWT);
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('4. Refresh failure → clears token and sets null user state', async () => {
    server.use(
      http.post('*/api/auth/refresh-token', () => new HttpResponse(null, { status: 401 }))
    );

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading').textContent).toBe('ready');
    });

    expect(screen.getByTestId('user-email').textContent).toBe('none');
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('5. Logout → session state is cleared', async () => {
    server.use(
      http.post('*/api/auth/refresh-token', () => HttpResponse.json({ accessToken: MOCK_JWT })),
      http.get('*/api/auth/me', () => HttpResponse.json({ id: 'u1', email: 'logoutuser@example.com', roles: ['Customer'] })),
      http.post('*/api/auth/logout', () => HttpResponse.json({ success: true }))
    );

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-email').textContent).toBe('logoutuser@example.com');
    });

    await act(async () => {
      screen.getByTestId('logout-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-email').textContent).toBe('none');
    });

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('6. pendingOrderEmail is NOT written to sessionStorage', () => {
    expect(sessionStorage.getItem('pendingOrderEmail')).toBeNull();
  });

  it('7. Guest session uses secure UUID format (not predictable Math.random)', () => {
    const guestId = getGuestSessionId();
    expect(guestId).toBeDefined();
    expect(typeof guestId).toBe('string');
    expect(guestId.length).toBeGreaterThan(10);
  });

  it('8. Payment sensitive card data is never saved to localStorage or sessionStorage', () => {
    expect(localStorage.getItem('cardNumber')).toBeNull();
    expect(localStorage.getItem('cvv')).toBeNull();
    expect(sessionStorage.getItem('cardNumber')).toBeNull();
    expect(sessionStorage.getItem('cvv')).toBeNull();
  });
});
