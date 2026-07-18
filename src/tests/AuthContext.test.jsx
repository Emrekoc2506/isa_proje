import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.post('https://localhost:7148/api/auth/login', () => {
    return HttpResponse.json({
      accessToken: 'mock-access',
      refreshToken: 'mock-refresh',
      user: {
        id: 'test-user-id',
        email: 'admin@gmail.com',
        fullName: 'Admin User',
        roles: ['SuperAdmin']
      }
    });
  }),
  http.get('https://localhost:7148/api/auth/me', () => {
    return HttpResponse.json({
      id: 'test-user-id',
      email: 'admin@gmail.com',
      fullName: 'Admin User',
      roles: ['SuperAdmin']
    });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function TestComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-state">{isAuthenticated ? 'logged-in' : 'logged-out'}</span>
      <span data-testid="user-email">{user?.email || 'no-email'}</span>
      <button onClick={() => login({ email: 'admin@gmail.com', password: 'Admin123*' })} data-testid="btn-login">Login</button>
      <button onClick={logout} data-testid="btn-logout">Logout</button>
    </div>
  );
}

describe('AuthContext Tests', () => {
  test('should initialize as logged-out', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-state').textContent).toBe('logged-out');
  });

  test('should login successfully and update state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = screen.getByTestId('btn-login');
    await act(async () => {
      loginBtn.click();
    });

    expect(localStorage.getItem('accessToken')).toBe('mock-access');
    expect(screen.getByTestId('auth-state').textContent).toBe('logged-in');
    expect(screen.getByTestId('user-email').textContent).toBe('admin@gmail.com');
  });

  test('should clear tokens on logout', async () => {
    localStorage.setItem('accessToken', 'test-token');
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const logoutBtn = screen.getByTestId('btn-logout');
    await act(async () => {
      logoutBtn.click();
    });

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(screen.getByTestId('auth-state').textContent).toBe('logged-out');
  });
});
