/**
 * @fileoverview Integration Tests
 * End-to-end integration tests for critical user flows
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import * as authAPI from '@/api/auth';

// Mock auth API
vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  refreshToken: vi.fn(),
}));

// Mock app params
vi.mock('@/lib/app-params', () => ({
  appParams: {
    token: null,
    serverUrl: 'http://localhost:3000',
    appId: 'test-app',
  },
}));

describe('Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should complete full login flow', async () => {
      const user = userEvent.setup();

      // Mock successful login
      authAPI.login.mockResolvedValue({
        token: 'test-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        expires_in: 3600,
      });

      const LoginComponent = () => {
        const { login } = require('@/hooks/useAuth').useAuth();
        const [email, setEmail] = React.useState('');
        const [password, setPassword] = React.useState('');

        const handleSubmit = async (e) => {
          e.preventDefault();
          await login(email, password);
        };

        return (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Login</button>
          </form>
        );
      };

      const App = () => (
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<LoginComponent />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div>Dashboard</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      );

      render(<App />);

      // Fill in login form
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Verify login was called
      await waitFor(() => {
        expect(authAPI.login).toHaveBeenCalledWith('test@example.com', 'password123', false);
      });

      // Verify token was stored
      expect(localStorage.getItem('funnelagents_auth_token')).toBe('test-token');
    });

    it('should handle authentication errors', async () => {
      const user = userEvent.setup();

      // Mock failed login
      authAPI.login.mockRejectedValue(new Error('Invalid credentials'));

      const LoginComponent = () => {
        const { login, authError } = require('@/hooks/useAuth').useAuth();
        const [email, setEmail] = React.useState('');
        const [password, setPassword] = React.useState('');

        const handleSubmit = async (e) => {
          e.preventDefault();
          try {
            await login(email, password);
          } catch (error) {
            // Error handled by hook
          }
        };

        return (
          <div>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit">Login</button>
            </form>
            {authError && <div role="alert">{authError.message}</div>}
          </div>
        );
      };

      const App = () => (
        <BrowserRouter>
          <AuthProvider>
            <LoginComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      render(<App />);

      const emailInput = screen.getByRole('textbox');
      const passwordInput = screen.getByLabelText('', { selector: 'input[type="password"]' });
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
      });
    });
  });

  describe('Protected Route Access', () => {
    it('should redirect unauthenticated users', async () => {
      const App = () => (
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<div>Login Page</div>} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <div>Protected Content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('should allow authenticated users', async () => {
      const mockUser = { id: '1', email: 'test@example.com', role: 'user' };
      const futureExpiry = new Date(Date.now() + 3600000).toISOString();

      localStorage.setItem('funnelagents_auth_token', 'test-token');
      localStorage.setItem('funnelagents_user', JSON.stringify(mockUser));
      localStorage.setItem('funnelagents_token_expiry', futureExpiry);

      authAPI.getCurrentUser.mockResolvedValue(mockUser);

      const App = () => (
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <div>Protected Content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('State Management Integration', () => {
    it('should sync auth state with stores', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test' };

      authAPI.login.mockResolvedValue({
        token: 'token',
        user: mockUser,
        expires_in: 3600,
      });

      const TestComponent = () => {
        const { login, user } = require('@/hooks/useAuth').useAuth();
        const { setUser } = require('@/store/index').useUserStore();

        React.useEffect(() => {
          if (user) {
            setUser(user);
          }
        }, [user, setUser]);

        return (
          <div>
            <button onClick={() => login('test@example.com', 'password')}>Login</button>
            {user && <div data-testid="user-name">{user.name}</div>}
          </div>
        );
      };

      const App = () => (
        <BrowserRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      render(<App />);

      const loginButton = screen.getByRole('button', { name: /login/i });
      await userEvent.setup().click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test');
      });

      // Verify store was updated
      const { useUserStore } = require('@/store/index');
      expect(useUserStore.getState().user).toEqual(mockUser);
    });
  });

  describe('Session Persistence', () => {
    it('should restore session on page reload', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const futureExpiry = new Date(Date.now() + 3600000).toISOString();

      // Simulate existing session
      localStorage.setItem('funnelagents_auth_token', 'existing-token');
      localStorage.setItem('funnelagents_user', JSON.stringify(mockUser));
      localStorage.setItem('funnelagents_token_expiry', futureExpiry);

      authAPI.getCurrentUser.mockResolvedValue(mockUser);

      const TestComponent = () => {
        const { user, isAuthenticated, isLoading } = require('@/hooks/useAuth').useAuth();

        if (isLoading) {
          return <div>Loading...</div>;
        }

        return (
          <div>
            {isAuthenticated ? (
              <div data-testid="user-email">{user.email}</div>
            ) : (
              <div>Not authenticated</div>
            )}
          </div>
        );
      };

      const App = () => (
        <BrowserRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      render(<App />);

      // Should show loading first
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Then restore session
      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      });

      expect(authAPI.getCurrentUser).toHaveBeenCalledWith('existing-token');
    });

    it('should clear expired session', async () => {
      const pastExpiry = new Date(Date.now() - 1000).toISOString();

      // Simulate expired session
      localStorage.setItem('funnelagents_auth_token', 'expired-token');
      localStorage.setItem('funnelagents_user', JSON.stringify({ id: '1' }));
      localStorage.setItem('funnelagents_token_expiry', pastExpiry);

      authAPI.refreshToken.mockRejectedValue(new Error('Token expired'));

      const TestComponent = () => {
        const { isAuthenticated, isLoading } = require('@/hooks/useAuth').useAuth();

        if (isLoading) return <div>Loading...</div>;

        return (
          <div>{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
        );
      };

      const App = () => (
        <BrowserRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Not authenticated')).toBeInTheDocument();
      });

      expect(localStorage.getItem('funnelagents_auth_token')).toBeNull();
    });
  });
});
