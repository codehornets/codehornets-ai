/**
 * @fileoverview useAuth Hook Tests
 * Comprehensive tests for authentication hook functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../useAuth';
import * as authAPI from '@/api/auth';

// Mock the auth API
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

describe('useAuth Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  describe('Initialization', () => {
    it('should initialize with unauthenticated state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.authError).toBeNull();
    });

    it('should restore session from localStorage with valid token', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      const futureExpiry = new Date(Date.now() + 3600000).toISOString();

      localStorage.setItem('funnelagents_auth_token', 'valid-token');
      localStorage.setItem('funnelagents_user', JSON.stringify(mockUser));
      localStorage.setItem('funnelagents_token_expiry', futureExpiry);

      authAPI.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(authAPI.getCurrentUser).toHaveBeenCalledWith('valid-token');
    });

    it('should clear expired token on initialization', async () => {
      const pastExpiry = new Date(Date.now() - 1000).toISOString();

      localStorage.setItem('funnelagents_auth_token', 'expired-token');
      localStorage.setItem('funnelagents_user', JSON.stringify({ id: '1' }));
      localStorage.setItem('funnelagents_token_expiry', pastExpiry);

      authAPI.refreshToken.mockRejectedValue(new Error('Token expired'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('funnelagents_auth_token')).toBeNull();
    });
  });

  describe('Login', () => {
    it('should successfully login and store credentials', async () => {
      const mockResponse = {
        token: 'new-auth-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        expires_in: 3600,
      };

      authAPI.login.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult).toEqual(mockResponse.user);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockResponse.user);
      expect(localStorage.getItem('funnelagents_auth_token')).toBe('new-auth-token');
      expect(authAPI.login).toHaveBeenCalledWith('test@example.com', 'password123', false);
    });

    it('should handle login failure', async () => {
      const error = new Error('Invalid credentials');
      authAPI.login.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.login('test@example.com', 'wrong-password');
        });
      }).rejects.toThrow('Invalid credentials');

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.authError).toEqual({
        type: 'login_failed',
        message: 'Invalid credentials',
      });
    });

    it('should support remember me option', async () => {
      const mockResponse = {
        token: 'auth-token',
        user: { id: '1', email: 'test@example.com' },
        expires_in: 3600,
      };

      authAPI.login.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password', true);
      });

      expect(authAPI.login).toHaveBeenCalledWith('test@example.com', 'password', true);
    });
  });

  describe('Signup', () => {
    it('should successfully signup and authenticate', async () => {
      const signupData = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      const mockResponse = {
        token: 'new-token',
        user: { id: '2', ...signupData },
        expires_in: 3600,
      };

      authAPI.signup.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let signupResult;
      await act(async () => {
        signupResult = await result.current.signup(signupData);
      });

      expect(signupResult).toEqual(mockResponse.user);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockResponse.user);
      expect(localStorage.getItem('funnelagents_auth_token')).toBe('new-token');
    });

    it('should handle signup failure', async () => {
      const error = new Error('Email already exists');
      authAPI.signup.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.signup({ email: 'test@example.com', password: '123' });
        });
      }).rejects.toThrow('Email already exists');

      expect(result.current.authError).toEqual({
        type: 'signup_failed',
        message: 'Email already exists',
      });
    });
  });

  describe('Logout', () => {
    it('should logout and clear auth state', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };

      localStorage.setItem('funnelagents_auth_token', 'token');
      localStorage.setItem('funnelagents_user', JSON.stringify(mockUser));

      authAPI.logout.mockResolvedValue({});
      authAPI.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Mock window.location.href
      delete window.location;
      window.location = { href: '' };

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('funnelagents_auth_token')).toBeNull();
      expect(window.location.href).toBe('/Login');
    });

    it('should logout without redirect when specified', async () => {
      localStorage.setItem('funnelagents_auth_token', 'token');
      authAPI.logout.mockResolvedValue({});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const originalHref = window.location.href;

      await act(async () => {
        await result.current.logout(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(window.location.href).toBe(originalHref);
    });

    it('should clear auth state even if API call fails', async () => {
      localStorage.setItem('funnelagents_auth_token', 'token');
      authAPI.logout.mockRejectedValue(new Error('Server error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      delete window.location;
      window.location = { href: '' };

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('funnelagents_auth_token')).toBeNull();
    });
  });

  describe('Token Refresh', () => {
    it('should automatically refresh token before expiry', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      localStorage.setItem('funnelagents_auth_token', 'old-token');
      localStorage.setItem('funnelagents_user', JSON.stringify(mockUser));
      localStorage.setItem('funnelagents_token_expiry', expiryTime.toISOString());

      authAPI.getCurrentUser.mockResolvedValue(mockUser);
      authAPI.refreshToken.mockResolvedValue({
        token: 'new-token',
        user: mockUser,
        expires_in: 3600,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Fast-forward to refresh time (5 minutes before expiry)
      await act(async () => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      await waitFor(() => {
        expect(authAPI.refreshToken).toHaveBeenCalledWith('old-token');
      });

      expect(localStorage.getItem('funnelagents_auth_token')).toBe('new-token');
    });

    it('should manually refresh token', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };

      localStorage.setItem('funnelagents_auth_token', 'old-token');
      authAPI.refreshToken.mockResolvedValue({
        token: 'new-token',
        user: mockUser,
        expires_in: 3600,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let newToken;
      await act(async () => {
        newToken = await result.current.refreshToken();
      });

      expect(newToken).toBe('new-token');
      expect(localStorage.getItem('funnelagents_auth_token')).toBe('new-token');
    });

    it('should clear auth on refresh failure', async () => {
      localStorage.setItem('funnelagents_auth_token', 'old-token');
      authAPI.refreshToken.mockRejectedValue(new Error('Refresh failed'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(async () => {
        await act(async () => {
          await result.current.refreshToken();
        });
      }).rejects.toThrow('Refresh failed');

      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('funnelagents_auth_token')).toBeNull();
    });
  });

  describe('Update User', () => {
    it('should update user data', async () => {
      const initialUser = { id: '1', email: 'test@example.com', name: 'Old Name' };
      const updatedUser = { id: '1', email: 'test@example.com', name: 'New Name' };

      localStorage.setItem('funnelagents_auth_token', 'token');
      localStorage.setItem('funnelagents_user', JSON.stringify(initialUser));
      authAPI.getCurrentUser.mockResolvedValue(initialUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(initialUser);
      });

      act(() => {
        result.current.updateUser(updatedUser);
      });

      expect(result.current.user).toEqual(updatedUser);
      expect(JSON.parse(localStorage.getItem('funnelagents_user'))).toEqual(updatedUser);
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 errors properly', async () => {
      const error = new Error('Unauthorized');
      error.status = 401;

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      authAPI.login.mockRejectedValue(error);

      await expect(async () => {
        await act(async () => {
          await result.current.login('test@example.com', 'password');
        });
      }).rejects.toThrow();

      expect(result.current.authError).toBeTruthy();
    });
  });

  describe('Context Provider', () => {
    it('should throw error when useAuth is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
