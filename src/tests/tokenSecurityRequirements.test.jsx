import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { getAccessToken, setAccessToken, clearAccessToken } from '../auth/tokenStore';
import { login, logout, refreshToken } from '../services/authApi';
import { request } from '../services/apiClient';

const MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1LTEwMSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoyNTI0NjA4MDAwfQ.mockSignature';
const REFRESHED_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1LTEwMSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoyNTI0NjA4MDAwfQ.refreshedSignature';

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

function AuthTestComponent() {
  const { user, isAuthenticated, isAdmin, isSuperAdmin, logout: handleLogout, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="auth-loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</span>
      <span data-testid="user-email">{user?.email || 'none'}</span>
      <span data-testid="is-admin">{isAdmin ? 'yes' : 'no'}</span>
      <span data-testid="is-super-admin">{isSuperAdmin ? 'yes' : 'no'}</span>
      <button data-testid="logout-btn" onClick={() => handleLogout()}>Çıkış Yap</button>
    </div>
  );
}

describe('Token Security Requirements Suite (Section 13 & In-Memory Architecture)', () => {

  describe('1. In-Memory Token Store Guarantees (Zero Storage Leakage)', () => {
    it('1.1 getAccessToken, setAccessToken, and clearAccessToken operate exclusively in-memory', () => {
      expect(getAccessToken()).toBeNull();

      setAccessToken(MOCK_JWT);
      expect(getAccessToken()).toBe(MOCK_JWT);

      // Verify ZERO leakage into browser storages
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(sessionStorage.getItem('accessToken')).toBeNull();

      clearAccessToken();
      expect(getAccessToken()).toBeNull();
      expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('1.2 authApi.login stores token strictly in memory, never in localStorage/sessionStorage', async () => {
      server.use(
        http.post('*/api/auth/login', () => {
          return HttpResponse.json({
            accessToken: MOCK_JWT,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            user: { id: 'u-101', email: 'test@example.com', fullName: 'Test User' }
          });
        })
      );

      const res = await login({ email: 'test@example.com', password: 'password123' });

      expect(res.accessToken).toBe(MOCK_JWT);
      expect(getAccessToken()).toBe(MOCK_JWT);
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(sessionStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(sessionStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('2. Authorization Header Security', () => {
    it('2.1 apiClient attaches Bearer token from memory when available', async () => {
      let authHeader = null;
      server.use(
        http.get('*/api/account/profile', ({ request }) => {
          authHeader = request.headers.get('Authorization');
          return HttpResponse.json({ id: 'u-101', fullName: 'Test User' });
        })
      );

      setAccessToken(MOCK_JWT);
      await request('/account/profile');

      expect(authHeader).toBe(`Bearer ${MOCK_JWT}`);
    });

    it('2.2 apiClient does NOT attach Authorization header when memory token is null', async () => {
      let authHeader = null;
      server.use(
        http.get('*/api/products', ({ request }) => {
          authHeader = request.headers.get('Authorization');
          return HttpResponse.json({ items: [] });
        })
      );

      clearAccessToken();
      await request('/products');

      expect(authHeader).toBeNull();
    });
  });

  describe('3. Silent Session Recovery on Page Reload', () => {
    it('3.1 Guest user (has_logged_in !== "1") skips /auth/refresh-token completely', async () => {
      let refreshCalled = false;
      server.use(
        http.post('*/api/auth/refresh-token', () => {
          refreshCalled = true;
          return new HttpResponse(null, { status: 401 });
        })
      );

      render(
        <AuthProvider>
          <AuthTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-loading').textContent).toBe('ready');
      });

      expect(refreshCalled).toBe(false);
      expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
      expect(getAccessToken()).toBeNull();
    });

    it('3.2 Logged-in user (has_logged_in === "1") recovers session silently via session-state + refresh-token', async () => {
      localStorage.setItem('has_logged_in', '1');

      let sessionStateCalled = false;
      let refreshCalled = false;
      let meCalled = false;

      server.use(
        http.get('*/api/auth/session-state', () => {
          sessionStateCalled = true;
          return HttpResponse.json({ isAuthenticated: true });
        }),
        http.post('*/api/auth/refresh-token', () => {
          refreshCalled = true;
          return HttpResponse.json({
            accessToken: REFRESHED_JWT,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            user: { id: 'u-101', email: 'recovered@example.com', fullName: 'Recovered User' }
          });
        }),
        http.get('*/api/auth/me', () => {
          meCalled = true;
          return HttpResponse.json({
            id: 'u-101',
            email: 'recovered@example.com',
            fullName: 'Recovered User',
            roles: ['Customer']
          });
        })
      );

      render(
        <AuthProvider>
          <AuthTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-email').textContent).toBe('recovered@example.com');
      });

      expect(sessionStateCalled).toBe(true);
      expect(refreshCalled).toBe(true);
      expect(meCalled).toBe(true);
      expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
      expect(getAccessToken()).toBe(REFRESHED_JWT);
      expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('3.3 Session recovery failure gracefully clears state without throwing unhandled errors', async () => {
      localStorage.setItem('has_logged_in', '1');

      server.use(
        http.get('*/api/auth/session-state', () => HttpResponse.json({ isAuthenticated: false }))
      );

      render(
        <AuthProvider>
          <AuthTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-loading').textContent).toBe('ready');
      });

      expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
      expect(getAccessToken()).toBeNull();
      expect(localStorage.getItem('has_logged_in')).toBeNull();
    });
  });

  describe('4. Logout Security', () => {
    it('4.1 logout wipes in-memory token, clears has_logged_in, and sets unauthenticated state', async () => {
      setAccessToken(MOCK_JWT);
      localStorage.setItem('has_logged_in', '1');

      let logoutApiCalled = false;
      server.use(
        http.get('*/api/auth/me', () => {
          return HttpResponse.json({ id: 'u-101', email: 'active@example.com', roles: ['Customer'] });
        }),
        http.post('*/api/auth/logout', () => {
          logoutApiCalled = true;
          return HttpResponse.json({ success: true });
        })
      );

      render(
        <AuthProvider>
          <AuthTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-email').textContent).toBe('active@example.com');
      });

      await act(async () => {
        screen.getByTestId('logout-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
      });

      expect(logoutApiCalled).toBe(true);
      expect(getAccessToken()).toBeNull();
      expect(localStorage.getItem('has_logged_in')).toBeNull();
      expect(localStorage.getItem('accessToken')).toBeNull();
    });
  });

  describe('5. Protection against Fake LocalStorage Admin Tampering', () => {
    it('5.1 Tampered localStorage user with role="SuperAdmin" is ignored without valid in-memory token', async () => {
      // Attacker writes fake user role into localStorage
      localStorage.setItem('user', JSON.stringify({ id: 'fake', role: 'SuperAdmin', isSuperAdmin: true }));
      localStorage.setItem('has_logged_in', '1');

      // Backend rejects refresh because no valid HttpOnly refresh cookie exists
      server.use(
        http.get('*/api/auth/session-state', () => HttpResponse.json({ isAuthenticated: false })),
        http.get('*/api/admin/dashboard', () => new HttpResponse(null, { status: 401 }))
      );

      render(
        <AuthProvider>
          <AuthTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-loading').textContent).toBe('ready');
      });

      // User must NOT be recognized as admin
      expect(screen.getByTestId('is-admin').textContent).toBe('no');
      expect(screen.getByTestId('is-super-admin').textContent).toBe('no');
      expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
    });
  });

});
