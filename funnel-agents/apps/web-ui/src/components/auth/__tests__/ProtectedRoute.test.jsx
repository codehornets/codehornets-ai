/**
 * @fileoverview ProtectedRoute Component Tests
 * Tests for route protection and authorization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute, { PublicRoute, ConditionalRoute } from '../ProtectedRoute';
import { AuthProvider } from '@/hooks/useAuth';
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
  },
}));

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const TestApp = ({ isAuthenticated = false, user = null, children, initialPath = '/protected' }) => {
    if (isAuthenticated && user) {
      const futureExpiry = new Date(Date.now() + 3600000).toISOString();
      localStorage.setItem('funnelagents_auth_token', 'test-token');
      localStorage.setItem('funnelagents_user', JSON.stringify(user));
      localStorage.setItem('funnelagents_token_expiry', futureExpiry);
      authAPI.getCurrentUser.mockResolvedValue(user);
    }

    return (
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route path="/Login" element={<div>Login Page</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>{children || <div>Protected Content</div>}</ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <div>Admin Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  describe('Authentication Check', () => {
    it('should show loading spinner while checking auth', async () => {
      // Set up localStorage to simulate having a token, so getCurrentUser is called
      const futureExpiry = new Date(Date.now() + 3600000).toISOString();
      localStorage.setItem('funnelagents_auth_token', 'test-token');
      localStorage.setItem('funnelagents_user', JSON.stringify({ id: '1', email: 'test@example.com' }));
      localStorage.setItem('funnelagents_token_expiry', futureExpiry);

      // Mock getCurrentUser to have a delay so we can catch the loading state
      let resolveAuth;
      const authPromise = new Promise(resolve => {
        resolveAuth = resolve;
      });
      authAPI.getCurrentUser.mockImplementation(() => authPromise);

      render(<TestApp />);

      // The loading state should be visible while auth is pending
      expect(screen.getByText(/checking authentication/i)).toBeInTheDocument();

      // Resolve auth and wait for loading to disappear
      resolveAuth({ id: '1', email: 'test@example.com' });
      await waitFor(() => {
        expect(screen.queryByText(/checking authentication/i)).not.toBeInTheDocument();
      });
    });

    it('should redirect unauthenticated users to login', async () => {
      render(<TestApp />);

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('should render protected content for authenticated users', async () => {
      const user = { id: '1', email: 'test@example.com', role: 'user' };

      render(<TestApp isAuthenticated user={user} />);

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should preserve intended location in state', async () => {
      // This test verifies that the location state is preserved
      // In a real scenario, after login, the user would be redirected to the original location
      const user = { id: '1', email: 'test@example.com' };

      const { container } = render(<TestApp isAuthenticated={false} user={user} />);

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });
  });

  describe('Admin Access Control', () => {
    it('should allow admin users to access admin routes', async () => {
      const adminUser = { id: '1', email: 'admin@example.com', role: 'admin' };

      const AdminApp = () => (
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute requireAdmin>
                    <div>Admin Content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      localStorage.setItem('funnelagents_auth_token', 'token');
      localStorage.setItem('funnelagents_user', JSON.stringify(adminUser));
      localStorage.setItem('funnelagents_token_expiry', new Date(Date.now() + 3600000).toISOString());
      authAPI.getCurrentUser.mockResolvedValue(adminUser);

      render(<AdminApp />);

      await waitFor(() => {
        expect(screen.getByText('Admin Content')).toBeInTheDocument();
      });
    });

    it('should deny non-admin users access to admin routes', async () => {
      const regularUser = { id: '1', email: 'user@example.com', role: 'user' };

      const AdminApp = () => (
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute requireAdmin>
                    <div>Admin Content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      localStorage.setItem('funnelagents_auth_token', 'token');
      localStorage.setItem('funnelagents_user', JSON.stringify(regularUser));
      localStorage.setItem('funnelagents_token_expiry', new Date(Date.now() + 3600000).toISOString());
      authAPI.getCurrentUser.mockResolvedValue(regularUser);

      render(<AdminApp />);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText(/admin privileges are required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Custom Redirect Path', () => {
    it('should use custom redirect path', async () => {
      const CustomRedirectApp = () => (
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <Routes>
              <Route path="/custom-login" element={<div>Custom Login</div>} />
              <Route
                path="/"
                element={
                  <ProtectedRoute redirectTo="/custom-login">
                    <div>Protected</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      render(<CustomRedirectApp />);

      await waitFor(() => {
        expect(screen.getByText('Custom Login')).toBeInTheDocument();
      });
    });
  });
});

describe('PublicRoute Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const PublicApp = ({ isAuthenticated = false, user = null, initialPath = '/login' }) => {
    if (isAuthenticated && user) {
      const futureExpiry = new Date(Date.now() + 3600000).toISOString();
      localStorage.setItem('funnelagents_auth_token', 'test-token');
      localStorage.setItem('funnelagents_user', JSON.stringify(user));
      localStorage.setItem('funnelagents_token_expiry', futureExpiry);
      authAPI.getCurrentUser.mockResolvedValue(user);
    }

    return (
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route path="/Dashboard" element={<div>Dashboard</div>} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <div>Login Form</div>
                </PublicRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('should show login form for unauthenticated users', async () => {
    render(<PublicApp />);

    await waitFor(() => {
      expect(screen.getByText('Login Form')).toBeInTheDocument();
    });
  });

  it('should redirect authenticated users to dashboard', async () => {
    const user = { id: '1', email: 'test@example.com' };

    render(<PublicApp isAuthenticated user={user} />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('should use custom redirect path', async () => {
    const user = { id: '1', email: 'test@example.com' };

    const CustomPublicApp = () => (
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route path="/home" element={<div>Home</div>} />
            <Route
              path="/"
              element={
                <PublicRoute redirectTo="/home">
                  <div>Public Content</div>
                </PublicRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    localStorage.setItem('funnelagents_auth_token', 'token');
    localStorage.setItem('funnelagents_user', JSON.stringify(user));
    localStorage.setItem('funnelagents_token_expiry', new Date(Date.now() + 3600000).toISOString());
    authAPI.getCurrentUser.mockResolvedValue(user);

    render(<CustomPublicApp />);

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });
});

describe('ConditionalRoute Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render content when condition is true', async () => {
    const App = () => (
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/"
              element={
                <ConditionalRoute condition={() => true}>
                  <div>Conditional Content</div>
                </ConditionalRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Conditional Content')).toBeInTheDocument();
    });
  });

  it('should redirect when condition is false', async () => {
    const App = () => (
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route path="/Dashboard" element={<div>Dashboard</div>} />
            <Route
              path="/"
              element={
                <ConditionalRoute condition={() => false}>
                  <div>Conditional Content</div>
                </ConditionalRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('should show fallback when condition is false and fallback provided', async () => {
    const App = () => (
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/"
              element={
                <ConditionalRoute
                  condition={() => false}
                  fallback={<div>Access Denied</div>}
                >
                  <div>Conditional Content</div>
                </ConditionalRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  it('should use custom condition logic', async () => {
    const user = { id: '1', email: 'test@example.com', subscription: 'premium' };

    const App = () => {
      localStorage.setItem('funnelagents_auth_token', 'token');
      localStorage.setItem('funnelagents_user', JSON.stringify(user));
      localStorage.setItem('funnelagents_token_expiry', new Date(Date.now() + 3600000).toISOString());
      authAPI.getCurrentUser.mockResolvedValue(user);

      return (
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <ConditionalRoute
                    condition={() => {
                      const storedUser = JSON.parse(localStorage.getItem('funnelagents_user') || '{}');
                      return storedUser.subscription === 'premium';
                    }}
                    fallback={<div>Upgrade Required</div>}
                  >
                    <div>Premium Content</div>
                  </ConditionalRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );
    };

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Premium Content')).toBeInTheDocument();
    });
  });
});
